import { describe, expect, it, vi } from "vitest";
import { validateTicket } from "../controllers/reservation.controller";
import { prisma } from "../lib/prisma";

vi.mock("../lib/prisma", () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

describe("validateTicket", () => {
  it("requires an eventId when validating by ticketId", async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      id: "ticket_123",
      eventId: "event_1",
      code: "ABC123",
      usedAt: null
    } as any);

    const req = {
      body: {
        ticketId: "ticket_123",
        eventId: ""
      }
    } as any;

    const res = {
      json: vi.fn()
    } as any;

    await validateTicket(req, res);

    expect(res.json).toHaveBeenCalledWith({
      status: "INVALID",
      message: "Informe o ID do evento para validar o ingresso."
    });
  });
});
