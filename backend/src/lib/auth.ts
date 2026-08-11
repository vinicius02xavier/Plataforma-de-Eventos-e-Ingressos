import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/env";

export type JwtPayload = {
  sub: string;
  role: "ORGANIZER" | "CUSTOMER" | "GATE";
  name: string;
};

type SharePayload = {
  ticketId: string;
  type: "TICKET_SHARE";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function createTicketShareToken(ticketId: string) {
  return jwt.sign(
    { ticketId, type: "TICKET_SHARE" } satisfies SharePayload,
    env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyTicketShareToken(token: string) {
  const payload = jwt.verify(token, env.JWT_SECRET) as SharePayload;
  if (payload.type !== "TICKET_SHARE" || !payload.ticketId) {
    throw new Error("INVALID_TICKET_SHARE_TOKEN");
  }
  return payload;
}

export function createOpaqueToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function makeTicketCode() {
  return `ED-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}
