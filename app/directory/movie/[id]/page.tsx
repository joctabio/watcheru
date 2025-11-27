import { getQueryClient } from '@/app/get-query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Movie from './movie';
import { fetchMovieById } from '@/app/queries';

export default async function MovieLayout({
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Movie id={id} />
    </HydrationBoundary>
  );
}
