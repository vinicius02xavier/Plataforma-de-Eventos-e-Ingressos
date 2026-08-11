import { Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { buildQrDataUrl, buildShareUrl } from "../services/ticket.service";
import { createTicketShareToken, makeTicketCode, sha256, verifyTicketShareToken } from "../lib/auth";

const reserveSchema = z.object({
  eventId: z.string(),
  quantity: z.number().int().min(1).max(20)
});

const paymentSchema = z.object({
  approved: z.boolean()
});

export async function reserve(req: AuthRequest, res: Response) {
  const { eventId, quantity } = reserveSchema.parse(req.body);

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });

      if (!event || event.status !== "PUBLISHED") {
        throw new Error("EVENT_NOT_FOUND");
      }

      if (event.available < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.event.update({
        where: { id: eventId },
        data: { available: { decrement: quantity } }
      });

      return tx.reservation.create({
        data: {
          eventId,
          customerId: req.user!.sub,
          quantity,
          totalInCents: event.priceInCents * quantity
        },
        include: { event: true }
      });
    });

    return res.status(201).json(reservation);
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
      return res.status(404).json({ message: "Evento não encontrado." });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return res.status(409).json({ message: "Quantidade indisponível." });
    }
    throw error;
  }
}

export async function pay(req: AuthRequest, res: Response) {
  const payment = paymentSchema.parse(req.body);
  const reservationId = req.params.id;

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, customerId: req.user!.sub },
    include: { event: true }
  });

  if (!reservation) {
    return res.status(404).json({ message: "Reserva não encontrada." });
  }

  if (reservation.status !== "PENDING") {
    return res.status(409).json({ message: "Esta reserva já foi processada." });
  }

  if (!payment.approved) {
    const failed = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "FAILED" }
      });

      await tx.event.update({
        where: { id: reservation.eventId },
        data: { available: { increment: reservation.quantity } }
      });

      return updated;
    });

    return res.json(failed);
  }

  const result = await prisma.$transaction(async (tx) => {
    const paid = await tx.reservation.update({
      where: { id: reservation.id },
      data: { status: "PAID" }
    });

    const tickets = [];

    for (let i = 0; i < reservation.quantity; i++) {
      const opaqueToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = sha256(opaqueToken);
      const ticket = await tx.ticket.create({
        data: {
          reservationId: reservation.id,
          eventId: reservation.eventId,
          tokenHash,
          code: makeTicketCode()
        }
      });

      const shareToken = createTicketShareToken(ticket.id);
      tickets.push({
        ...ticket,
        shareToken,
        shareUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/ingresso/${shareToken}`
      });
    }

    return { paid, tickets };
  });

  return res.json(result);
}

export async function myTickets(req: AuthRequest, res: Response) {
  const tickets = await prisma.ticket.findMany({
    where: {
      reservation: {
        customerId: req.user!.sub,
        status: "PAID"
      }
    },
    include: {
      event: true,
      reservation: true
    },
    orderBy: { createdAt: "desc" }
  });

  const result = await Promise.all(
    tickets.map(async (ticket) => {
      const shareUrl = buildShareUrl(ticket.id);
      return {
        id: ticket.id,
        code: ticket.code,
        usedAt: ticket.usedAt,
        event: ticket.event,
        quantity: ticket.reservation.quantity,
        shareUrl,
        qrDataUrl: await buildQrDataUrl(ticket.id)
      };
    })
  );

  return res.json(result);
}

export async function sharedTicket(req: AuthRequest, res: Response) {
  try {
    const payload = verifyTicketShareToken(req.params.token);

    const ticket = await prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { event: true, reservation: true }
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ingresso inválido." });
    }

    return res.json({
      id: ticket.id,
      code: ticket.code,
      usedAt: ticket.usedAt,
      event: ticket.event,
      quantity: ticket.reservation.quantity
    });
  } catch {
    return res.status(404).json({ message: "Ingresso inválido ou link expirado." });
  }
}

export async function validateTicket(req: AuthRequest, res: Response) {
  const schema = z.object({
    token: z.string().optional(),
    code: z.string().optional(),
    eventId: z.string()
  });

  const data = schema.parse(req.body);

  let ticketId: string | undefined;

  if (data.token) {
    try {
      ticketId = verifyTicketShareToken(data.token).ticketId;
    } catch {
      return res.json({
        status: "INVALID",
        message: "QR/token inválido ou expirado."
      });
    }
  }

  const ticket = ticketId
    ? await prisma.ticket.findUnique({ where: { id: ticketId }, include: { event: true } })
    : data.code
      ? await prisma.ticket.findUnique({ where: { code: data.code }, include: { event: true } })
      : null;

  if (!ticket) {
    return res.json({
      status: "INVALID",
      message: "Ingresso inválido."
    });
  }

  if (ticket.eventId !== data.eventId) {
    return res.json({
      status: "WRONG_EVENT",
      message: "Ingresso pertence a outro evento.",
      ticket
    });
  }

  if (ticket.usedAt) {
    return res.json({
      status: "ALREADY_USED",
      message: "Ingresso já utilizado.",
      ticket
    });
  }

  const updated = await prisma.ticket.updateMany({
    where: { id: ticket.id, usedAt: null },
    data: { usedAt: new Date() }
  });

  if (updated.count !== 1) {
    return res.json({
      status: "ALREADY_USED",
      message: "Ingresso já utilizado."
    });
  }

  return res.json({
    status: "VALID",
    message: "Ingresso válido. Entrada liberada.",
    ticket: { ...ticket, usedAt: new Date() }
  });
}
