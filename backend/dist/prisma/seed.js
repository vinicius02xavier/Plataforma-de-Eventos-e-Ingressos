"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
require("dotenv/config");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const connectionString = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({
    url: connectionString,
});
const prisma = new client_1.PrismaClient({
    adapter,
});
async function main() {
    const passwordHash = await bcryptjs_1.default.hash("EliteDev@2026", 10);
    const organizer = await prisma.user.upsert({
        where: { email: "organizer@elite.dev" },
        update: {},
        create: { name: "Organizador Demo", email: "organizer@elite.dev", passwordHash, role: client_1.Role.ORGANIZER }
    });
    const client1 = await prisma.user.upsert({
        where: { email: "client1@elite.dev" },
        update: {},
        create: { name: "Cliente Um", email: "client1@elite.dev", passwordHash, role: client_1.Role.CUSTOMER }
    });
    await prisma.user.upsert({
        where: { email: "client2@elite.dev" },
        update: {},
        create: { name: "Cliente Dois", email: "client2@elite.dev", passwordHash, role: client_1.Role.CUSTOMER }
    });
    await prisma.user.upsert({
        where: { email: "gate@elite.dev" },
        update: {},
        create: { name: "Portaria Demo", email: "gate@elite.dev", passwordHash, role: client_1.Role.GATE }
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
                status: client_1.EventStatus.PUBLISHED,
                organizerId: organizer.id
            }
        });
    }
    const existing = await prisma.reservation.findFirst({
        where: { eventId: event.id, customerId: client1.id, status: client_1.ReservationStatus.PAID }
    });
    if (!existing) {
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const code = `ED-${crypto_1.default.randomBytes(5).toString("hex").toUpperCase()}`;
        const reservation = await prisma.reservation.create({
            data: {
                eventId: event.id,
                customerId: client1.id,
                quantity: 1,
                totalInCents: event.priceInCents,
                status: client_1.ReservationStatus.PAID
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
