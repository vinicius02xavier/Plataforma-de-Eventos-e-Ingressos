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
  catalogItemId: z.string().optional(),
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
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ message: "Evento não encontrado." });
  return res.json(event);
}

export async function createEvent(req: AuthRequest, res: Response) {
  const data = eventSchema.parse(req.body);
  const event = await prisma.event.create({
    data: {
      ...data,
      imageUrl: data.imageUrl || null,
      organizerId: req.user!.sub,
      available: data.capacity
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
