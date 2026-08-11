import { Request, Response } from "express";
import { searchMovies } from "../services/catalog.service";

export async function movies(req: Request, res: Response) {
  const query = String(req.query.q || "").trim();
  if (query.length < 2) return res.json([]);

  return res.json(await searchMovies(query));
}
