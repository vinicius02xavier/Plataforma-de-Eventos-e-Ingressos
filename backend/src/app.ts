import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { router } from "./routes";
import { errorHandler } from "./middleware/error";

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", router);
app.use(errorHandler);
