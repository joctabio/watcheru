import { getGenres, getMovie, getProviders, pickMovie, pickShow, searchMovies } from './movie-actions';
import type { MovieActionResult, MovieFilters } from './definitions';

function unwrap<T>(result: MovieActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export async function fetchMoviesByTitle(title: string, page = 1) {
  return unwrap(await searchMovies(title, page));
}
export async function fetchMovieById(id: string) {
  return unwrap(await getMovie(id));
}
export async function fetchMovieProviders(id: string) {
  return unwrap(await getProviders(id));
}
export async function fetchRandomMovie(filters: MovieFilters = {}, excludedIds: number[] = []) {
  return unwrap(await pickMovie(filters, excludedIds));
}
export async function fetchRandomShow() {
  return unwrap(await pickShow());
}
export async function fetchMovieGenres() {
  return unwrap(await getGenres());
}
