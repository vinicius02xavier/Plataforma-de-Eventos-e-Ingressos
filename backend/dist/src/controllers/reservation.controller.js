"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserve = reserve;
exports.pay = pay;
exports.cancelTicket = cancelTicket;
exports.myTickets = myTickets;
exports.sharedTicket = sharedTicket;
exports.validateTicket = validateTicket;
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const ticket_service_1 = require("../services/ticket.service");
const auth_1 = require("../lib/auth");
const reserveSchema = zod_1.z.object({
    eventId: zod_1.z.string(),
    quantity: zod_1.z.number().int().min(1).max(20),
    seatSelection: zod_1.z.union([zod_1.z.array(zod_1.z.string()), zod_1.z.string()]).optional()
});
const paymentSchema = zod_1.z.object({
    approved: zod_1.z.boolean()
});
function normalizeSeatSelection(seats) {
    const raw = Array.isArray(seats) ? seats : typeof seats === "string" ? seats.split(",") : [];
    return [...new Set(raw.map((seat) => seat.trim()).filter(Boolean))];
}
async function reserve(req, res) {
    const { eventId, quantity, seatSelection } = reserveSchema.parse(req.body);
    const normalizedSeats = normalizeSeatSelection(seatSelection);
    try {
        const reservation = await prisma_1.prisma.$transaction(async (tx) => {
            const event = await tx.event.findUnique({ where: { id: eventId } });
            if (!event || event.status !== "PUBLISHED") {
                throw new Error("EVENT_NOT_FOUND");
            }
            if (event.available < quantity) {
                throw new Error("INSUFFICIENT_STOCK");
            }
            if (normalizedSeats.length > 0) {
                if (normalizedSeats.length !== quantity) {
                    throw new Error("SEAT_QUANTITY_MISMATCH");
                }
                const existing = await tx.reservation.findMany({
                    where: {
                        eventId,
                        status: { in: ["PENDING", "PAID"] }
                    },
                    select: { seatSelection: true }
                });
                const occupied = new Set();
                for (const entry of existing) {
                    const seats = (entry.seatSelection ?? "")
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean);
                    for (const seat of seats) {
                        occupied.add(seat);
                    }
                }
                const conflict = normalizedSeats.filter((seat) => occupied.has(seat));
                if (conflict.length > 0) {
                    throw new Error("SEAT_TAKEN");
                }
            }
            await tx.event.update({
                where: { id: eventId },
                data: { available: { decrement: quantity } }
            });
            return tx.reservation.create({
                data: {
                    eventId,
                    customerId: req.user.sub,
                    quantity,
                    totalInCents: event.priceInCents * quantity,
                    seatSelection: normalizedSeats.length ? normalizedSeats.join(",") : null
                },
                include: { event: true }
            });
        });
        return res.status(201).json(reservation);
    }
    catch (error) {
        if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
            return res.status(404).json({ message: "Evento não encontrado." });
        }
        if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
            return res.status(409).json({ message: "Quantidade indisponível." });
        }
        if (error instanceof Error && error.message === "SEAT_TAKEN") {
            return res.status(409).json({ message: "Um ou mais assentos já estão ocupados." });
        }
        if (error instanceof Error && error.message === "SEAT_QUANTITY_MISMATCH") {
            return res.status(409).json({ message: "A quantidade deve corresponder ao número de assentos selecionados." });
        }
        throw error;
    }
}
async function pay(req, res) {
    const payment = paymentSchema.parse(req.body);
    const reservationId = req.params.id;
    const reservation = await prisma_1.prisma.reservation.findFirst({
        where: { id: reservationId, customerId: req.user.sub },
        include: { event: true }
    });
    if (!reservation) {
        return res.status(404).json({ message: "Reserva não encontrada." });
    }
    if (reservation.status !== "PENDING") {
        return res.status(409).json({ message: "Esta reserva já foi processada." });
    }
    if (!payment.approved) {
        const failed = await prisma_1.prisma.$transaction(async (tx) => {
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
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const paid = await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: "PAID" }
        });
        const tickets = [];
        for (let i = 0; i < reservation.quantity; i++) {
            const opaqueToken = crypto_1.default.randomBytes(32).toString("hex");
            const tokenHash = (0, auth_1.sha256)(opaqueToken);
            const ticket = await tx.ticket.create({
                data: {
                    reservationId: reservation.id,
                    eventId: reservation.eventId,
                    tokenHash,
                    code: (0, auth_1.makeTicketCode)()
                }
            });
            const shareToken = (0, auth_1.createTicketShareToken)(ticket.id);
            tickets.push({
                ...ticket,
                shareToken,
                shareUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/ingresso/${shareToken}`,
                updatedAt: null
            });
        }
        return { paid, tickets };
    });
    return res.json(result);
}
async function cancelTicket(req, res) {
    const reservationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reservation = await prisma_1.prisma.reservation.findFirst({
        where: { id: reservationId, customerId: req.user.sub },
        include: { event: true }
    });
    if (!reservation) {
        return res.status(404).json({ message: "Reserva não encontrada." });
    }
    if (reservation.status === "CANCELLED") {
        return res.json({ message: "Esta reserva já foi cancelada." });
    }
    if (reservation.status === "FAILED") {
        return res.status(409).json({ message: "Reserva já foi recusada." });
    }
    const updated = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: "CANCELLED" }
        });
        await tx.event.update({
            where: { id: reservation.eventId },
            data: { available: { increment: reservation.quantity } }
        });
        return { message: "Ingresso cancelado com sucesso." };
    });
    return res.json(updated);
}
async function myTickets(req, res) {
    const tickets = await prisma_1.prisma.ticket.findMany({
        where: {
            reservation: {
                customerId: req.user.sub,
                status: "PAID"
            }
        },
        include: {
            event: true,
            reservation: true
        },
        orderBy: { createdAt: "desc" }
    });
    const result = await Promise.all(tickets.map(async (ticket) => {
        const shareUrl = (0, ticket_service_1.buildShareUrl)(ticket.id);
        const seatSelection = ticket.reservation.seatSelection
            ? ticket.reservation.seatSelection.split(",").filter(Boolean)
            : [];
        return {
            id: ticket.id,
            reservationId: ticket.reservationId,
            code: ticket.code,
            usedAt: ticket.usedAt,
            event: ticket.event,
            quantity: ticket.reservation.quantity,
            seatSelection,
            shareUrl,
            qrDataUrl: await (0, ticket_service_1.buildQrDataUrl)(ticket.id)
        };
    }));
    return res.json(result);
}
async function sharedTicket(req, res) {
    try {
        const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
        const payload = (0, auth_1.verifyTicketShareToken)(token);
        const ticket = await prisma_1.prisma.ticket.findUnique({
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
    }
    catch {
        return res.status(404).json({ message: "Ingresso inválido ou link expirado." });
    }
}
async function validateTicket(req, res) {
    const schema = zod_1.z.object({
        token: zod_1.z.string().optional(),
        code: zod_1.z.string().optional(),
        ticketId: zod_1.z.string().optional(),
        eventId: zod_1.z.string().optional()
    });
    const data = schema.parse(req.body);
    const eventId = data.eventId?.trim();
    if (!eventId) {
        return res.json({
            status: "INVALID",
            message: "Informe o ID do evento para validar o ingresso."
        });
    }
    let ticketId;
    if (data.token) {
        try {
            ticketId = (0, auth_1.verifyTicketShareToken)(data.token).ticketId;
        }
        catch {
            return res.json({
                status: "INVALID",
                message: "QR/token inválido ou expirado."
            });
        }
    }
    else if (data.ticketId) {
        ticketId = data.ticketId.trim();
    }
    const ticket = ticketId
        ? await prisma_1.prisma.ticket.findUnique({ where: { id: ticketId }, include: { event: true } })
        : data.code
            ? await prisma_1.prisma.ticket.findUnique({ where: { code: data.code }, include: { event: true } })
            : null;
    if (!ticket) {
        return res.json({
            status: "INVALID",
            message: "Ingresso inválido."
        });
    }
    if (ticket.eventId !== eventId) {
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
    const updated = await prisma_1.prisma.ticket.updateMany({
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
