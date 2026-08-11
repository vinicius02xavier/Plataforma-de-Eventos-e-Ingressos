import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  TMDB_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"), 
  PORT: z.coerce.number().default(3333)
});

export const env = schema.parse(process.env);
