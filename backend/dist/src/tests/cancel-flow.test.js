"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const event_controller_1 = require("../controllers/event.controller");
const reservation_controller_1 = require("../controllers/reservation.controller");
const prisma_1 = require("../lib/prisma");
vitest_1.vi.mock("../lib/prisma", () => ({
    prisma: {
        reservation: {
            findFirst: vitest_1.vi.fn(),
            update: vitest_1.vi.fn()
        },
        event: {
            findFirst: vitest_1.vi.fn(),
            update: vitest_1.vi.fn()
        },
        $transaction: vitest_1.vi.fn()
    }
}));
(0, vitest_1.describe)("cancelTicket", () => {
    (0, vitest_1.it)("marks a paid reservation as cancelled and restores availability", async () => {
        vitest_1.vi.mocked(prisma_1.prisma.reservation.findFirst).mockResolvedValue({
            id: "res_1",
            customerId: "user_1",
            eventId: "event_1",
            quantity: 2,
            status: "PAID",
            event: { id: "event_1" }
        });
        vitest_1.vi.mocked(prisma_1.prisma.$transaction).mockImplementation(async (fn) => fn({
            reservation: {
                update: vitest_1.vi.fn().mockResolvedValue({ id: "res_1", status: "CANCELLED" }),
            },
            event: {
                update: vitest_1.vi.fn().mockResolvedValue({ id: "event_1", available: 10 })
            }
        }));
        const req = {
            user: { sub: "user_1" },
            params: { id: "res_1" }
        };
        const res = {
            json: vitest_1.vi.fn(),
            status: vitest_1.vi.fn().mockReturnThis()
        };
        await (0, reservation_controller_1.cancelTicket)(req, res);
        (0, vitest_1.expect)(prisma_1.prisma.$transaction).toHaveBeenCalled();
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            message: "Ingresso cancelado com sucesso."
        });
    });
});
(0, vitest_1.describe)("cancelEvent", () => {
    (0, vitest_1.it)("cancels an organizer event", async () => {
        vitest_1.vi.mocked(prisma_1.prisma.event.findFirst).mockResolvedValue({
            id: "event_1",
            organizerId: "user_1",
            status: "PUBLISHED"
        });
        vitest_1.vi.mocked(prisma_1.prisma.event.update).mockResolvedValue({
            id: "event_1",
            status: "CANCELLED"
        });
        const req = {
            user: { sub: "user_1" },
            params: { id: "event_1" }
        };
        const res = {
            json: vitest_1.vi.fn(),
            status: vitest_1.vi.fn().mockReturnThis()
        };
        await (0, event_controller_1.cancelEvent)(req, res);
        (0, vitest_1.expect)(prisma_1.prisma.event.update).toHaveBeenCalledWith({
            where: { id: "event_1" },
            data: { status: "CANCELLED" }
        });
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            id: "event_1",
            status: "CANCELLED"
        });
    });
});
(0, vitest_1.describe)("reserve", () => {
    (0, vitest_1.it)("rejects a seat already assigned to another reservation", async () => {
        vitest_1.vi.mocked(prisma_1.prisma.$transaction).mockImplementation(async (fn) => {
            const tx = {
                event: {
                    findUnique: vitest_1.vi.fn().mockResolvedValue({
                        id: "event_1",
                        status: "PUBLISHED",
                        available: 10,
                        priceInCents: 5000
                    }),
                    update: vitest_1.vi.fn().mockResolvedValue({ id: "event_1" })
                },
                reservation: {
                    findMany: vitest_1.vi.fn().mockResolvedValue([
                        { seatSelection: "A1" }
                    ]),
                    create: vitest_1.vi.fn().mockResolvedValue({ id: "res_1" })
                }
            };
            return fn(tx);
        });
        const req = {
            user: { sub: "user_1" },
            body: {
                eventId: "event_1",
                quantity: 1,
                seatSelection: ["A1"]
            }
        };
        const res = {
            json: vitest_1.vi.fn(),
            status: vitest_1.vi.fn().mockReturnThis()
        };
        await (0, reservation_controller_1.reserve)(req, res);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(409);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            message: "Um ou mais assentos já estão ocupados."
        });
    });
});
