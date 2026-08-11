import bcrypt from "bcryptjs";
import crypto from "crypto";

import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { EventStatus, PrismaClient, ReservationStatus, Role } from "@prisma/client";

const connectionString = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

const adapter = new PrismaBetterSqlite3({
  url: connectionString,
});

const prisma = new PrismaClient({
  adapter,
});
async function main() {
  const passwordHash = await bcrypt.hash("EliteDev@2026", 10);

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@elite.dev" },
    update: {},
    create: { name: "Organizador Demo", email: "organizer@elite.dev", passwordHash, role: Role.ORGANIZER }
  });

  const client1 = await prisma.user.upsert({
    where: { email: "client1@elite.dev" },
    update: {},
    create: { name: "Cliente Um", email: "client1@elite.dev", passwordHash, role: Role.CUSTOMER }
  });

  await prisma.user.upsert({
    where: { email: "client2@elite.dev" },
    update: {},
    create: { name: "Cliente Dois", email: "client2@elite.dev", passwordHash, role: Role.CUSTOMER }
  });

  await prisma.user.upsert({
    where: { email: "gate@elite.dev" },
    update: {},
    create: { name: "Portaria Demo", email: "gate@elite.dev", passwordHash, role: Role.GATE }
  });

  let event = await prisma.event.findFirst({ where: { title: "Cinema Demo — Elite Dev" } });

  if (!event) {
    event = await prisma.event.create({
      data: {
        title: "Cinema Demo — Elite Dev",
        description: "Evento semeado para percorrer o fluxo completo do desafio.",
        imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: "Cine Demo — Sala 1",
        capacity: 100,
        available: 100,
        priceInCents: 3500,
        status: EventStatus.PUBLISHED,
        organizerId: organizer.id
      }
    });
  }

  const existing = await prisma.reservation.findFirst({
    where: { eventId: event.id, customerId: client1.id, status: ReservationStatus.PAID }
  });

  if (!existing) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const code = `ED-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

    const reservation = await prisma.reservation.create({
      data: {
        eventId: event.id,
        customerId: client1.id,
        quantity: 1,
        totalInCents: event.priceInCents,
        status: ReservationStatus.PAID
      }
    });

    await prisma.ticket.create({
      data: {
        reservationId: reservation.id,
        eventId: event.id,
        tokenHash,
        code
      }
    });

    await prisma.event.update({
      where: { id: event.id },
      data: { available: { decrement: 1 } }
    });

    console.log(`Seed ticket token for debugging only: ${token}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
