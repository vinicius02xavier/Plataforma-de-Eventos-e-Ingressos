import { Request, Response } from "express";
import { searchMovies } from "../services/catalog.service";
import { env } from "../config/env";

export async function movies(req: Request, res: Response) {
  const query = String(req.query.q || "").trim();
  if (query.length < 2) return res.json([]);

  try {
    return res.json(await searchMovies(query));
  } catch (error) {
    if (error instanceof Error && error.message.includes("TMDb")) {
      return res.status(503).json({
        message: "Catálogo externo não configurado. Adicione TMDB_API_KEY no backend/.env para ativar a busca de filmes."
      });
    }

    console.error("Catalog search error:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
}

export function catalogStatus(_req: Request, res: Response) {
  res.json({
    provider: "TMDB",
    configured: Boolean(env.TMDB_API_KEY)
  });
}