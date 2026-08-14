"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const schema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(16),
    TMDB_API_KEY: zod_1.z.string().optional(),
    FRONTEND_URL: zod_1.z.string().url().default("http://localhost:5173"),
    PORT: zod_1.z.coerce.number().default(3333)
});
exports.env = schema.parse(process.env);
