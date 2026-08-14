"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicket = createTicket;
exports.buildShareUrl = buildShareUrl;
exports.buildQrDataUrl = buildQrDataUrl;
const qrcode_1 = __importDefault(require("qrcode"));
const env_1 = require("../config/env");
const auth_1 = require("../lib/auth");
const prisma_1 = require("../lib/prisma");
async function createTicket(reservationId, eventId) {
    const token = (0, auth_1.createOpaqueToken)();
    const ticket = await prisma_1.prisma.ticket.create({
        data: {
            reservationId,
            eventId,
            tokenHash: (0, auth_1.sha256)(token),
            code: (0, auth_1.makeTicketCode)()
        }
    });
    return { ticket, token };
}
function buildShareUrl(ticketId) {
    const shareToken = (0, auth_1.createTicketShareToken)(ticketId);
    return `${env_1.env.FRONTEND_URL}/ingresso/${shareToken}`;
}
async function buildQrDataUrl(ticketId) {
    return qrcode_1.default.toDataURL(buildShareUrl(ticketId), {
        width: 320,
        margin: 2
    });
}
