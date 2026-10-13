import { getQueryClient } from '@/app/get-query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Movie from './movie';
import { fetchMovieById } from '@/app/queries';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getMovieReturnDestination } from '@/lib/movie-navigation';
import { Button } from '@/components/ui/button';

export default async function MoviePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const returnDestination = getMovieReturnDestination(from);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['movie', id],
    queryFn: () => fetchMovieById(id)
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className='detail-shell'>
        <div className='detail-heading'>
          <Button variant='ghost' className='back-button' asChild>
            <Link href={returnDestination.href}><ArrowLeft size={16} />{returnDestination.label}</Link>
          </Button>
        </div>
        <Movie id={id} />
      </main>
    </HydrationBoundary>
  );
}
