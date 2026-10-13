'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchMoviesByTitle } from '../queries';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Film, Grid2X2, List } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { MovieResultsSkeleton } from '@/components/movie-skeleton';
import RequestError from '@/components/request-error';
import MovieList from '@/components/movie-list';
import { searchResultsHref } from '@/lib/movie-navigation';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const layoutMode = searchParams.get('view') === 'list' ? 'list' : 'grid';
  const router = useRouter();
  const searchText = searchParams.get('search')?.trim() || '';
  const requestedPage = Number(searchParams.get('page') || 1);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 500 ? requestedPage : 1;

  const { isPending, isFetching, isPlaceholderData, data, error, refetch } = useQuery({
    queryKey: ['movies', searchText, page],
    queryFn: () => fetchMoviesByTitle(searchText, page),
    enabled: !!searchText,
    placeholderData: (previousData, previousQuery) => previousQuery?.queryKey[1] === searchText ? previousData : undefined
  });

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    router.push(`/directory?${params}`);
  }

  function setLayoutMode(view: 'grid' | 'list') {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'list') params.set('view', view);
    else params.delete('view');
    router.replace(`/directory?${params}`, { scroll: false });
  }

  if (!searchText) {
    return (
      <div className='programme-shell'>
        <section className='empty-screen'>
          <Film size={42} strokeWidth={1} />
          <h1>Search movies</h1>
          <p>Enter a movie title in the search bar.</p>
        </section>
      </div>
    );
  }

  const totalPages = Math.min(data?.total_pages || 0, 500);

  return (
    <div className='programme-shell' aria-busy={isFetching}>
      <div className='programme-heading'>
        <div>
          <h1>{searchText}</h1>
          <p role='status'>{data ? `${data.total_results.toLocaleString()} results` : 'Searching…'}</p>
        </div>
        <div className='layout-switch' role='group' aria-label='Results layout'>
          <Button variant='ghost' onClick={() => setLayoutMode('grid')} aria-label='Grid view' aria-pressed={layoutMode === 'grid'}><Grid2X2 size={16} /></Button>
          <Button variant='ghost' onClick={() => setLayoutMode('list')} aria-label='List view' aria-pressed={layoutMode === 'list'}><List size={17} /></Button>
        </div>
      </div>
      {error && <RequestError error={error} isRetrying={isFetching} onRetry={() => { void refetch(); }} />}
      {isPending && <MovieResultsSkeleton layout={layoutMode} />}
      {isFetching && data && <div className='mb-6 flex items-center gap-2 text-sm text-muted-foreground' role='status'><Spinner size={18} aria-hidden />Updating results…</div>}
      {data && data.results.length === 0 && (
        <section className='empty-screen' role='status'>
          <Film size={36} strokeWidth={1} />
          <h2>No results found</h2>
          <p>No films found for this title. Try another spelling or a different title.</p>
        </section>
      )}
      {data && <MovieList movies={data.results} layout={layoutMode} returnTo={searchResultsHref(searchText, page, layoutMode)} />}
      {totalPages > 0 && (
        <nav aria-label='Search pagination' className='pagination'>
          <Button variant='ghost' disabled={page <= 1 || isFetching} onClick={() => goToPage(page - 1)}><ArrowLeft size={14} />Previous page</Button>
          <span aria-live='polite'>PAGE {data?.page ?? page} / {totalPages}</span>
          <Button variant='ghost' disabled={page >= totalPages || isFetching || isPlaceholderData} onClick={() => goToPage(page + 1)}>Next page<ArrowRight size={14} /></Button>
        </nav>
      )}
    </div>
  );
}
