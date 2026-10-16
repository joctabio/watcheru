export type Movie = {
  adult: boolean;
  backdrop_path: string | null;
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};

export type MovieSummary = Movie & { genre_ids: number[]; runtime?: number | null };

export type MovieDetails = Movie & {
  genres: Genre[];
  runtime: number | null;
  credits: { cast: Array<{ id: number; name: string; character: string }> };
  videos: { results: Array<{ key: string; site: string; type: string; official: boolean }> };
};

export type DiscoverMovie = MovieSummary & MovieDetails & { watchProviders: Record<string, WatchAvailability> };

export type PaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type MovieFilters = {
  genre?: number;
  language?: string;
  year?: number;
  maxRuntime?: number;
  minRating?: number;
};

export type MovieActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type WatchProvider = { provider_id: number; provider_name: string; logo_path: string | null };
export type WatchAvailability = {
  link: string;
  flatrate?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

export type ShowSummary = {
  id: number;
  name: string;
  genre_ids: number[];
  poster_path: string | null;
  overview: string;
};

export type Genre = {
  id: number;
  name: string;
};

export type Genres = Array<Genre>;
