import { env } from "../config/env";

export type CatalogMovie = {
  externalId: string;
  title: string;
  description: string;
  imageUrl?: string;
};

export async function searchMovies(query: string): Promise<CatalogMovie[]> {
  if (!env.TMDB_API_KEY) return [];

  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", env.TMDB_API_KEY);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");

  const response = await fetch(url);
  if (!response.ok) throw new Error("TMDb indisponível.");

  const data = await response.json() as {
    results: Array<{ id: number; title: string; overview?: string; poster_path?: string }>;
  };

  return data.results.slice(0, 10).map((movie) => ({
    externalId: String(movie.id),
    title: movie.title,
    description: movie.overview || "",
    imageUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined
  }));
}
