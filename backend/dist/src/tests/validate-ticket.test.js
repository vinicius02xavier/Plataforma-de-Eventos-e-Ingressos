"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const reservation_controller_1 = require("../controllers/reservation.controller");
const prisma_1 = require("../lib/prisma");
vitest_1.vi.mock("../lib/prisma", () => ({
    prisma: {
        ticket: {
            findUnique: vitest_1.vi.fn(),
            updateMany: vitest_1.vi.fn()
        }
    }
}));
(0, vitest_1.describe)("validateTicket", () => {
    (0, vitest_1.it)("requires an eventId when validating by ticketId", async () => {
        vitest_1.vi.mocked(prisma_1.prisma.ticket.findUnique).mockResolvedValue({
            id: "ticket_123",
            eventId: "event_1",
            code: "ABC123",
            usedAt: null
        });
        const req = {
            body: {
                ticketId: "ticket_123",
                eventId: ""
            }
        };
        const res = {
            json: vitest_1.vi.fn()
        };
        await (0, reservation_controller_1.validateTicket)(req, res);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith({
            status: "INVALID",
            message: "Informe o ID do evento para validar o ingresso."
        });
    });
});
