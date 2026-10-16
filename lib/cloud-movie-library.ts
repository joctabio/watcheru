import type { SupabaseClient } from '@supabase/supabase-js';
import { emptyLibrary, librarySchema, movieSchema, normalizeMovieLibrary, type MovieLibrary } from './movie-library';

export const collectionLimits = { saved: 200, watched: 400 };
export type Collection = keyof MovieLibrary;

type LibraryRow = { movie_id: number; collection: Collection; movie: unknown };

export function libraryFromRows(rows: LibraryRow[]): MovieLibrary {
  const library: MovieLibrary = { saved: [], watched: [] };
  for (const row of rows) {
    const movie = movieSchema.parse(row.movie);
    if (movie.id !== row.movie_id || !(row.collection in collectionLimits)) throw new Error('Invalid cloud library entry.');
    library[row.collection].push(movie);
  }
  return normalizeMovieLibrary(librarySchema.parse(library));
}

// Import only entries that fit. Keep any overflow in guest storage rather than losing it.
export function planGuestImport(cloud: MovieLibrary, guest: MovieLibrary) {
  const imports: MovieLibrary = { saved: [], watched: [] };
  const remaining: MovieLibrary = { saved: [], watched: [] };
  const ids = new Set([...cloud.saved, ...cloud.watched].map((movie) => movie.id));
  const normalizedGuest = normalizeMovieLibrary(guest);
  for (const collection of ['saved', 'watched'] as const) {
    for (const movie of normalizedGuest[collection]) {
      if (ids.has(movie.id)) continue;
      if (cloud[collection].length + imports[collection].length < collectionLimits[collection]) {
        imports[collection].push(movie);
        ids.add(movie.id);
      } else remaining[collection].push(movie);
    }
  }
  return { imports, remaining };
}

export async function fetchCloudLibrary(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from('movie_library').select('movie_id, collection, movie').eq('user_id', userId).order('added_at', { ascending: false });
  if (error) throw error;
  return libraryFromRows(data ?? []);
}

export async function importGuestLibrary(client: SupabaseClient, userId: string, cloud: MovieLibrary, guest: MovieLibrary) {
  const { imports, remaining } = planGuestImport(cloud, guest);
  const rows = (['saved', 'watched'] as const).flatMap((collection) => imports[collection].map((movie) => ({ user_id: userId, movie_id: movie.id, collection, movie })));
  if (rows.length) {
    const { error } = await client.from('movie_library').upsert(rows, { onConflict: 'user_id,movie_id,collection', ignoreDuplicates: true });
    if (error) throw error;
  }
  return { library: rows.length ? await fetchCloudLibrary(client, userId) : cloud, remaining };
}

export async function setCloudMovie(client: SupabaseClient, userId: string, movie: MovieLibrary['saved'][number], collection: Collection, present: boolean) {
  if (present && collection === 'watched') {
    // One database transaction: a failure must leave the saved entry intact.
    const { error } = await client.rpc('mark_movie_watched', { movie_data: movieSchema.parse(movie), target_user_id: userId });
    if (error) throw error;
  } else if (present) {
    const { error } = await client.from('movie_library').upsert({ user_id: userId, movie_id: movie.id, collection, movie: movieSchema.parse(movie) }, { onConflict: 'user_id,movie_id,collection', ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await client.from('movie_library').delete().eq('user_id', userId).eq('movie_id', movie.id).eq('collection', collection);
    if (error) throw error;
  }
}

export function hasMovies(library: MovieLibrary = emptyLibrary) {
  return library.saved.length > 0 || library.watched.length > 0;
}
