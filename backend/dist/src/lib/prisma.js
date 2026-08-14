"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const useSqlite = connectionString.startsWith("file:");
exports.prisma = useSqlite
    ? new client_1.PrismaClient({
        adapter: new adapter_better_sqlite3_1.PrismaBetterSqlite3({
            url: connectionString,
        }),
    })
    : new client_1.PrismaClient();
