"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const error_1 = require("./middleware/error");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({ origin: env_1.env.FRONTEND_URL }));
exports.app.use(express_1.default.json());
exports.app.get("/health", (_req, res) => res.json({ status: "ok" }));
exports.app.use("/api", routes_1.router);
exports.app.use(error_1.errorHandler);
