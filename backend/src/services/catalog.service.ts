import { env } from "../config/env";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export type CatalogMovie = {
  externalId: string;
  title: string;
  description: string;
  imageUrl?: string;
  releaseDate?: string;
  voteAverage?: number;
};

type TMDbMovie = {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
};

type TMDbSearchResponse = {
  results: TMDbMovie[];
  page: number;
  total_pages: number;
  total_results: number;
};

async function tmdbFetch<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  if (!env.TMDB_API_KEY) {
    throw new Error("TMDb não configurado.");
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.TMDB_API_KEY}`,
      accept: "application/json"
    }
  });

  if (!response.ok) {
    const body = await response.text();

    console.error("TMDb error:", response.status, body);

    throw new Error("TMDb indisponível.");
  }

  return response.json() as Promise<T>;
}

export async function searchMovies(
  query: string
): Promise<CatalogMovie[]> {
  const data = await tmdbFetch<TMDbSearchResponse>("/search/movie", {
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