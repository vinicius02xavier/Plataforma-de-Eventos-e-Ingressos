import QRCode from "qrcode";
import { env } from "../config/env";
import { createTicketShareToken, createOpaqueToken, makeTicketCode, sha256 } from "../lib/auth";
import { prisma } from "../lib/prisma";

export async function createTicket(reservationId: string, eventId: string) {
  const token = createOpaqueToken();
  const ticket = await prisma.ticket.create({
    data: {
      reservationId,
      eventId,
      tokenHash: sha256(token),
      code: makeTicketCode()
    }
  });

  return { ticket, token };
}

export function buildShareUrl(ticketId: string) {
  const shareToken = createTicketShareToken(ticketId);
  return `${env.FRONTEND_URL}/ingresso/${shareToken}`;
}

export async function buildQrDataUrl(ticketId: string) {
  return QRCode.toDataURL(buildShareUrl(ticketId), {
    width: 320,
    margin: 2
  });
}
