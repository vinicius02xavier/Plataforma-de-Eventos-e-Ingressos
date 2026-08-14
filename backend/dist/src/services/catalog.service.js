"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMovies = searchMovies;
const env_1 = require("../config/env");
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
async function tmdbFetch(endpoint, params) {
    if (!env_1.env.TMDB_API_KEY) {
        throw new Error("TMDb não configurado.");
    }
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    Object.entries(params ?? {}).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${env_1.env.TMDB_API_KEY}`,
            accept: "application/json"
        }
    });
    if (!response.ok) {
        const body = await response.text();
        console.error("TMDb error:", response.status, body);
        throw new Error("TMDb indisponível.");
    }
    return response.json();
}
async function searchMovies(query) {
    const data = await tmdbFetch("/search/movie", {
        query,
        language: "pt-BR",
        include_adult: "false",
        page: "1"
    });
    return data.results.slice(0, 10).map((movie) => ({
        externalId: String(movie.id),
        title: movie.title,
        description: movie.overview || "",
        imageUrl: movie.poster_path
            ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
            : undefined,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average
    }));
}
