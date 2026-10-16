import { z } from 'zod';

// Store only the fields needed to show saved movies, not credits or videos.
export const movieSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  adult: z.boolean(),
  backdrop_path: z.string().nullable(),
  original_language: z.string(),
  original_title: z.string(),
  overview: z.string(),
  popularity: z.number(),
  poster_path: z.string().nullable(),
  release_date: z.string(),
  video: z.boolean(),
  vote_average: z.number(),
  vote_count: z.number()
});

export const librarySchema = z.object({
  saved: z.array(movieSchema).max(200),
  watched: z.array(movieSchema).max(400)
});

export type MovieLibrary = z.infer<typeof librarySchema>;
export const emptyLibrary: MovieLibrary = { saved: [], watched: [] };

// Prefer Watched when importing an older library that allowed both memberships.
export function normalizeMovieLibrary(library: MovieLibrary): MovieLibrary {
  const watched = [...new Map(library.watched.map((movie) => [movie.id, movie])).values()];
  const watchedIds = new Set(watched.map((movie) => movie.id));
  const saved = [...new Map(library.saved.filter((movie) => !watchedIds.has(movie.id)).map((movie) => [movie.id, movie])).values()];
  return { saved, watched };
}

export function changeMovieMembership(library: MovieLibrary, movie: MovieLibrary['saved'][number], collection: keyof MovieLibrary, present: boolean): MovieLibrary {
  const others = library[collection].filter((item) => item.id !== movie.id);
  return librarySchema.parse({
    ...library,
    [collection]: present ? [movie, ...others] : others,
    ...(present ? { [collection === 'saved' ? 'watched' : 'saved']: library[collection === 'saved' ? 'watched' : 'saved'].filter((item) => item.id !== movie.id) } : {})
  });
}

export function parseMovieLibrary(raw: string | null): MovieLibrary {
  if (!raw) return emptyLibrary;
  try {
    const parsed = librarySchema.safeParse(JSON.parse(raw));
    return parsed.success ? normalizeMovieLibrary(parsed.data) : emptyLibrary;
  } catch {
    return emptyLibrary;
  }
}
