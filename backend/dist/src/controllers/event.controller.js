"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEvents = listEvents;
exports.getEvent = getEvent;
exports.createEvent = createEvent;
exports.myEvents = myEvents;
exports.updateEventStatus = updateEventStatus;
exports.cancelEvent = cancelEvent;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const eventSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().max(5000).optional(),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
    date: zod_1.z.coerce.date(),
    location: zod_1.z.string().min(2),
    capacity: zod_1.z.number().int().positive(),
    priceInCents: zod_1.z.number().int().nonnegative(),
    catalogExternalId: zod_1.z.string().optional(),
    status: zod_1.z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED")
});
async function listEvents(_req, res) {
    const events = await prisma_1.prisma.event.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { date: "asc" }
    });
    return res.json(events);
}
async function getEvent(req, res) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const event = await prisma_1.prisma.event.findUnique({ where: { id } });
    if (!event)
        return res.status(404).json({ message: "Evento não encontrado." });
    const occupiedSeats = await prisma_1.prisma.reservation.findMany({
        where: {
            eventId: event.id,
            status: { in: ["PENDING", "PAID"] }
        },
        select: { seatSelection: true }
    });
    const occupiedSeatSet = new Set();
    for (const reservation of occupiedSeats) {
        const seats = (reservation.seatSelection ?? "")
            .split(",")
            .map((seat) => seat.trim())
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
async function createEvent(req, res) {
    const data = eventSchema.parse(req.body);
    let catalogItemId;
    if (data.catalogExternalId) {
        const existingCatalogItem = await prisma_1.prisma.catalogItem.findFirst({
            where: {
                externalId: data.catalogExternalId,
                provider: "TMDB"
            }
        });
        const catalogItem = existingCatalogItem
            ? await prisma_1.prisma.catalogItem.update({
                where: { id: existingCatalogItem.id },
                data: {
                    title: data.title,
                    description: data.description,
                    imageUrl: data.imageUrl || null
                }
            })
            : await prisma_1.prisma.catalogItem.create({
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
    const event = await prisma_1.prisma.event.create({
        data: {
            title: data.title,
            description: data.description,
            imageUrl: data.imageUrl || null,
            date: data.date,
            location: data.location,
            capacity: data.capacity,
            priceInCents: data.priceInCents,
            status: data.status,
            organizerId: req.user.sub,
            available: data.capacity,
            catalogItemId
        }
    });
    return res.status(201).json(event);
}
async function myEvents(req, res) {
    const events = await prisma_1.prisma.event.findMany({
        where: { organizerId: req.user.sub },
        orderBy: { createdAt: "desc" }
    });
    return res.json(events);
}
const eventStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]).optional()
});
async function updateEventStatus(req, res) {
    const { status } = eventStatusSchema.parse(req.body);
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!status) {
        return res.status(400).json({ message: "Informe o novo status do evento." });
    }
    const event = await prisma_1.prisma.event.findFirst({
        where: { id: eventId, organizerId: req.user.sub }
    });
    if (!event) {
        return res.status(404).json({ message: "Evento não encontrado." });
    }
    const updated = await prisma_1.prisma.event.update({
        where: { id: eventId },
        data: { status }
    });
    return res.json(updated);
}
async function cancelEvent(req, res) {
    const eventId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const event = await prisma_1.prisma.event.findFirst({
        where: { id: eventId, organizerId: req.user.sub }
    });
    if (!event) {
        return res.status(404).json({ message: "Evento não encontrado." });
    }
    const updated = await prisma_1.prisma.event.update({
        where: { id: eventId },
        data: { status: "CANCELLED" }
    });
    return res.json(updated);
}
