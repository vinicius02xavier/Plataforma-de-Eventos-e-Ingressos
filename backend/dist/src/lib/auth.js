"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.createTicketShareToken = createTicketShareToken;
exports.verifyTicketShareToken = verifyTicketShareToken;
exports.createOpaqueToken = createOpaqueToken;
exports.sha256 = sha256;
exports.makeTicketCode = makeTicketCode;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 10);
}
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: "8h" });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
}
function createTicketShareToken(ticketId) {
    return jsonwebtoken_1.default.sign({ ticketId, type: "TICKET_SHARE" }, env_1.env.JWT_SECRET, { expiresIn: "30d" });
}
function verifyTicketShareToken(token) {
    const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
    if (payload.type !== "TICKET_SHARE" || !payload.ticketId) {
        throw new Error("INVALID_TICKET_SHARE_TOKEN");
    }
    return payload;
}
function createOpaqueToken() {
    return crypto_1.default.randomBytes(32).toString("hex");
}
function sha256(value) {
    return crypto_1.default.createHash("sha256").update(value).digest("hex");
}
function makeTicketCode() {
    return `ED-${crypto_1.default.randomBytes(6).toString("hex").toUpperCase()}`;
}
