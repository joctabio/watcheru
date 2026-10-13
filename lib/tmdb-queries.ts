import 'server-only';

import fetchTmdbApi from '@/lib/api';
import type { Genre, MovieDetails, MovieFilters, MovieSummary, PaginatedResponse, ShowSummary, WatchAvailability } from '@/app/definitions';
import { z } from 'zod';

const filtersSchema = z.object({
  genre: z.number().int().positive().optional(),
  language: z.string().regex(/^[a-z]{2}$/).optional(),
  year: z.number().int().min(1874).max(2100).optional(),
  maxRuntime: z.number().int().min(1).max(600).optional(),
  minRating: z.number().min(0).max(10).optional()
});

export async function fetchMoviesByTitle(title: string, page = 1) {
  const query = title.trim();
  if (!query) throw new Error('Enter a movie title to search.');
  if (!Number.isInteger(page) || page < 1 || page > 500) throw new Error('Invalid search page.');
  const params = new URLSearchParams({ query, page: String(page), include_adult: 'false' });
  const endpoint = `/search/movie?${params.toString()}`;

  return fetchTmdbApi<PaginatedResponse<MovieSummary>>(endpoint);
}

export async function fetchMovieById(id: string) {
  if (!/^\d+$/.test(id)) throw new Error('Invalid movie ID.');
  return fetchTmdbApi<MovieDetails>(`/movie/${id}?append_to_response=credits,videos`);
}

export async function fetchMovieProviders(id: string) {
  if (!/^\d+$/.test(id)) throw new Error('Invalid movie ID.');
  const data = await fetchTmdbApi<{ results: Record<string, WatchAvailability> }>(`/movie/${id}/watch/providers`);
  return data.results;
}

export async function fetchRandomMovie(filters: MovieFilters = {}, excludedIds: number[] = []) {
  const validated = filtersSchema.safeParse(filters);
  if (!validated.success) throw new Error('Please check your movie filters.');
  const excluded = z.array(z.number().int().positive()).max(500).safeParse(excludedIds);
  if (!excluded.success) throw new Error('Invalid movie history.');
  const params = new URLSearchParams({ include_adult: 'false', include_video: 'false' });
  const { genre, language, year, maxRuntime, minRating } = validated.data;
  if (genre) params.set('with_genres', String(genre));
  if (language) params.set('with_original_language', language);
  if (year) params.set('primary_release_year', String(year));
  if (maxRuntime) {
    params.set('with_runtime.gte', '1');
    params.set('with_runtime.lte', String(maxRuntime));
  }
  if (minRating) {
    params.set('vote_average.gte', String(minRating));
    params.set('vote_count.gte', '50');
  }
  return fetchRandomDiscoverItem<MovieSummary>('/discover/movie', params, excluded.data);
}

export async function fetchRandomShow() {
  return fetchRandomDiscoverItem<ShowSummary>('/discover/tv');
}

export async function fetchMovieGenres() {
  const data = await fetchTmdbApi<{ genres: Genre[] }>('/genre/movie/list');
  return data.genres;
}

async function fetchRandomDiscoverItem<T extends { id: number }>(
  endpoint: string,
  params = new URLSearchParams({ include_adult: 'false' }),
  excludedIds: number[] = []
) {
  params.set('page', '1');
  const firstPage = await fetchTmdbApi<PaginatedResponse<T>>(`${endpoint}?${params}`);
  const totalPages = Math.min(firstPage.total_pages, 500);
  if (!totalPages || !firstPage.results.length) {
    throw new Error('No titles match these filters. Try broadening your preferences.');
  }

  const excluded = new Set(excludedIds);
  const tried = new Set<number>();
  for (let attempt = 0; attempt < Math.min(totalPages, 3); attempt++) {
    let page = Math.floor(Math.random() * totalPages) + 1;
    while (tried.has(page)) page = page % totalPages + 1;
    tried.add(page);
    params.set('page', String(page));
    const data = page === 1 ? firstPage : await fetchTmdbApi<PaginatedResponse<T>>(`${endpoint}?${params}`);
    const candidates = data.results.filter((item) => !excluded.has(item.id));
    if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const remaining = firstPage.results.filter((item) => !excluded.has(item.id));
  if (remaining.length) return remaining[Math.floor(Math.random() * remaining.length)];
  throw new Error('Could not find a new title. Try again or broaden your preferences.');
}
