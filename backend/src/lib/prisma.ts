import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const useSqlite = connectionString.startsWith("file:");

export const prisma = useSqlite
  ? new PrismaClient({
      adapter: new PrismaBetterSqlite3({
        url: connectionString,
      }),
    })
  : new PrismaClient();