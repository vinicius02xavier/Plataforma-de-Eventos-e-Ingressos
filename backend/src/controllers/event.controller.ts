import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  date: z.coerce.date(),
  location: z.string().min(2),
  capacity: z.number().int().positive(),
  priceInCents: z.number().int().nonnegative(),
  catalogExternalId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED")
});

export async function listEvents(_req: AuthRequest, res: Response) {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { date: "asc" }
  });
  return res.json(events);
}

export async function getEvent(req: AuthRequest, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return res.status(404).json({ message: "Evento não encontrado." });

  const occupiedSeats = await prisma.reservation.findMany({
    where: {
      eventId: event.id,
      status: { in: ["PENDING", "PAID"] }
    },
    select: { seatSelection: true }
  });

  const occupiedSeatSet = new Set<string>();

  for (const reservation of occupiedSeats) {
    const seats = (reservation.seatSelection ?? "")
      .split(",")
      .map((seat: string) => seat.trim())
      .filter(Boolean);

    for (const seat of seats) {
      occupiedSeatSet.add(seat);
    }
  }

  return res.json({
    ...event,
    occupiedSeats: [...occupiedSeatSet]
  });
}

export async function createEvent(req: AuthRequest, res: Response) {
  const data = eventSchema.parse(req.body);

  let catalogItemId: string | undefined;

  if (data.catalogExternalId) {
    const existingCatalogItem = await prisma.catalogItem.findFirst({
      where: {
        externalId: data.catalogExternalId,
        provider: "TMDB"
      }
    });

    const catalogItem = existingCatalogItem
      ? await prisma.catalogItem.update({
        where: { id: existingCatalogItem.id },
        data: {
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl || null
        }
      })
      : await prisma.catalogItem.create({
        data: {
          externalId: data.catalogExternalId,
          provider: "TMDB",
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl || null
        }
      });

    catalogItemId = catalogItem.id;
  }

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl || null,
      date: data.date,
      location: data.location,
      capacity: data.capacity,
      priceInCents: data.priceInCents,
      status: data.status,
      organizerId: req.user!.sub,
      available: data.capacity,
      catalogItemId
    }
  });

  return res.status(201).json(event);
}

export async function myEvents(req: AuthRequest, res: Response) {
  const events = await prisma.event.findMany({
    where: { organizerId: req.user!.sub },
    orderBy: { createdAt: "desc" }
  });
  return res.json(events);
}

const eventStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional()
});

export async function updateEventStatus(req: AuthRequest, res: Response) {
  const { status } = eventStatusSchema.parse(req.body);
  const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!status) {
    return res.status(400).json({ message: "Informe o novo status do evento." });
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: req.user!.sub }
  });

  if (!event) {
    return res.status(404).json({ message: "Evento não encontrado." });
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status }
  });

  return res.json(updated);
}

export async function cancelEvent(req: AuthRequest, res: Response) {
  const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: req.user!.sub }
  });

  if (!event) {
    return res.status(404).json({ message: "Evento não encontrado." });
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: "CANCELLED" }
  });

  return res.json(updated);
}
