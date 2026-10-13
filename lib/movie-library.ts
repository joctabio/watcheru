import { z } from 'zod';

// Store only the fields needed to show saved movies, not credits or videos.
const movieSchema = z.object({
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

export function parseMovieLibrary(raw: string | null): MovieLibrary {
  if (!raw) return emptyLibrary;
  try {
    const parsed = librarySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyLibrary;
  } catch {
    return emptyLibrary;
  }
}
