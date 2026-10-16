import type { QueryClient } from '@tanstack/react-query';
import type { DiscoverMovie } from '@/app/definitions';

export function cacheDiscoverMovie(queryClient: QueryClient, movie: DiscoverMovie) {
  const id = String(movie.id);
  for (const key of [['movie', id], ['providers', id]]) {
    queryClient.setQueryDefaults(key, { staleTime: Infinity, gcTime: Infinity });
  }
  queryClient.setQueryData(['movie', id], movie);
  queryClient.setQueryData(['providers', id], movie.watchProviders);
}
