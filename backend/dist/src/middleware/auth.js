"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const auth_1 = require("../lib/auth");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Autenticação necessária." });
    }
    try {
        req.user = (0, auth_1.verifyToken)(header.slice(7));
        next();
    }
    catch {
        return res.status(401).json({ message: "Token inválido ou expirado." });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Você não possui permissão para esta operação." });
        }
        next();
    };
}
