"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movies = movies;
exports.catalogStatus = catalogStatus;
const catalog_service_1 = require("../services/catalog.service");
const env_1 = require("../config/env");
async function movies(req, res) {
    const query = String(req.query.q || "").trim();
    if (query.length < 2)
        return res.json([]);
    try {
        return res.json(await (0, catalog_service_1.searchMovies)(query));
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("TMDb")) {
            return res.status(503).json({
                message: "Catálogo externo não configurado. Adicione TMDB_API_KEY no backend/.env para ativar a busca de filmes."
            });
        }
        console.error("Catalog search error:", error);
        return res.status(500).json({ message: "Erro interno do servidor." });
    }
}
function catalogStatus(_req, res) {
    res.json({
        provider: "TMDB",
        configured: Boolean(env_1.env.TMDB_API_KEY)
    });
}
