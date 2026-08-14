import { describe, expect, it, vi } from "vitest";
import { cancelEvent } from "../controllers/event.controller";
import { cancelTicket, reserve } from "../controllers/reservation.controller";
import { prisma } from "../lib/prisma";

vi.mock("../lib/prisma", () => ({
  prisma: {
    reservation: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    event: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

describe("cancelTicket", () => {
  it("marks a paid reservation as cancelled and restores availability", async () => {
    vi.mocked(prisma.reservation.findFirst).mockResolvedValue({
      id: "res_1",
      customerId: "user_1",
      eventId: "event_1",
      quantity: 2,
      status: "PAID",
      event: { id: "event_1" }
    } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn({
      reservation: {
        update: vi.fn().mockResolvedValue({ id: "res_1", status: "CANCELLED" }),
      },
      event: {
        update: vi.fn().mockResolvedValue({ id: "event_1", available: 10 })
      }
    } as any));

    const req = {
      user: { sub: "user_1" },
      params: { id: "res_1" }
    } as any;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    } as any;

    await cancelTicket(req, res);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Ingresso cancelado com sucesso."
    });
  });
});

describe("cancelEvent", () => {
  it("cancels an organizer event", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValue({
      id: "event_1",
      organizerId: "user_1",
      status: "PUBLISHED"
    } as any);

    vi.mocked(prisma.event.update).mockResolvedValue({
      id: "event_1",
      status: "CANCELLED"
    } as any);

    const req = {
      user: { sub: "user_1" },
      params: { id: "event_1" }
    } as any;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    } as any;

    await cancelEvent(req, res);

    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: "event_1" },
      data: { status: "CANCELLED" }
    });
    expect(res.json).toHaveBeenCalledWith({
      id: "event_1",
      status: "CANCELLED"
    });
  });
});

describe("reserve", () => {
  it("rejects a seat already assigned to another reservation", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        event: {
          findUnique: vi.fn().mockResolvedValue({
            id: "event_1",
            status: "PUBLISHED",
            available: 10,
            priceInCents: 5000
          }),
          update: vi.fn().mockResolvedValue({ id: "event_1" })
        },
        reservation: {
          findMany: vi.fn().mockResolvedValue([
            { seatSelection: "A1" }
          ]),
          create: vi.fn().mockResolvedValue({ id: "res_1" })
        }
      };

      return fn(tx as any);
    });

    const req = {
      user: { sub: "user_1" },
      body: {
        eventId: "event_1",
        quantity: 1,
        seatSelection: ["A1"]
      }
    } as any;

    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    } as any;

    await reserve(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Um ou mais assentos já estão ocupados."
    });
  });
});
