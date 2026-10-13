'use server';

import * as tmdb from '@/lib/tmdb-queries';
import type { MovieActionResult, MovieFilters } from './definitions';

// Expected failures are returned as data; Next.js hides thrown server error
// messages in production, which would otherwise obscure retry/filter guidance.
async function execute<T>(request: () => Promise<T>): Promise<MovieActionResult<T>> {
  try { return { ok: true, data: await request() }; }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Movie service is unavailable. Please try again.' }; }
}

export async function searchMovies(title: string, page: number) {
  return execute(() => tmdb.fetchMoviesByTitle(title, page));
}
export async function getMovie(id: string) {
  return execute(() => tmdb.fetchMovieById(id));
}
export async function getProviders(id: string) {
  return execute(() => tmdb.fetchMovieProviders(id));
}
export async function pickMovie(filters: MovieFilters, excludedIds: number[]) {
  return execute(() => tmdb.fetchRandomMovie(filters, excludedIds));
}
export async function pickShow() {
  return execute(() => tmdb.fetchRandomShow());
}
export async function getGenres() {
  return execute(() => tmdb.fetchMovieGenres());
}
