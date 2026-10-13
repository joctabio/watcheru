'use client';

import RequestError from '@/components/request-error';
import { Spinner } from '@/components/ui/spinner';
import { MovieDetailsSkeleton } from '@/components/movie-skeleton';
import MovieHero from '@/components/movie-hero';
import { useQuery } from '@tanstack/react-query';
import { fetchMovieById } from '@/app/queries';
import MovieExtras from '@/components/movie-extras';

export default function MovieDisplay({ id }: { id: string }) {
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => fetchMovieById(id)
  });

  if (isPending) return <MovieDetailsSkeleton />;

  return (
    <div className='flex flex-col gap-4'>
      {error && <RequestError error={error} isRetrying={isFetching} onRetry={() => { void refetch(); }} />}
      {data && <><MovieHero movie={data} genres={data.genres} runtime={data.runtime} variant='detail' /><MovieExtras movie={data} /></>}
      {isFetching && data && <div className='flex items-center gap-2 text-sm text-muted-foreground' role='status'><Spinner size={18} aria-hidden />Updating movie…</div>}
    </div>
  );
}
