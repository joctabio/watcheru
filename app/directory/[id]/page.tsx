import { getQueryClient } from '@/app/get-query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Movie from './movie';
import { fetchMovieById, fetchMovieGenres } from '@/app/queries';

export default async function MoviePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = getQueryClient();

  queryClient.prefetchQuery({
    queryKey: ['movie', id],
    queryFn: () => fetchMovieById(id)
  });

  queryClient.prefetchQuery({
    queryKey: ['genres'],
    queryFn: () => fetchMovieGenres()
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className={'mt-[68px] pt-6 pb-10 px-6'}>
        <Movie id={id} />
      </div>
    </HydrationBoundary>
  );
}
