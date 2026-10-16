'use client';

import { Suspense, useState } from 'react';
import { ArrowRight, Bookmark } from 'lucide-react';
import Header from '@/components/header';
import CinemaHeaderFallback from '@/components/cinema-header-fallback';
import MovieList from '@/components/movie-list';
import { useMovieLibrary } from '@/lib/use-movie-library';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { useWatchlistVisit } from '@/lib/use-watchlist-visit';

export default function WatchlistPage() {
  const { user } = useAuth();
  // Account changes start a new visit so retained rows never cross accounts.
  return <WatchlistContent key={user?.id ?? 'guest'} />;
}

function WatchlistContent() {
  const { saved, watched, isLoading, storageError, retry } = useMovieLibrary();
  const { user } = useAuth();
  const [collection, setCollection] = useState<'saved' | 'watched'>('saved');
  const visible = useWatchlistVisit(saved, watched);
  const movies = visible[collection];

  return (
    <>
      <Suspense fallback={<CinemaHeaderFallback />}><Header /></Suspense>
      <main className='programme-shell'>
        <div className='programme-heading collection-heading'>
          <div>
            <h1>Watchlist</h1>
          </div>
          <Bookmark size={24} strokeWidth={1} className='mb-2 shrink-0 text-primary' aria-hidden='true' />
        </div>
        {storageError && <div role='alert' className='mb-4 text-sm text-destructive'>{storageError} <button type='button' className='underline' onClick={retry}>Retry sync</button></div>}
        <div className='collection-tabs' role='group' aria-label='Movie collection'>
          <button type='button' aria-pressed={collection === 'saved'} onClick={() => setCollection('saved')}>Saved<span>{saved.length}</span></button>
          <button type='button' aria-pressed={collection === 'watched'} onClick={() => setCollection('watched')}>Watched<span>{watched.length}</span></button>
        </div>
        {isLoading ? <p role='status' className='py-12 text-muted-foreground'>Loading your watchlist…</p> : movies.length === 0 ? (
          <section className='empty-screen'>
            <Bookmark size={36} strokeWidth={1.5} />
            <h2>{collection === 'saved' ? 'No saved movies yet' : 'No watched movies yet'}</h2>
            <p>{collection === 'saved' ? 'Save movies to find them here later.' : 'Mark movies as watched to exclude them from new picks.'}</p>
            <Button className='pick-button mt-2' asChild><Link href='/'>Discover movies<ArrowRight size={14} /></Link></Button>
          </section>
        ) : <MovieList movies={movies} layout='list' showActions watchlistCollection={collection} returnTo='/watchlist' />}
        <p className='mt-8 text-sm text-muted-foreground'>{user ? 'Saved to your account.' : 'Saved in this browser.'} Watched films are excluded from new picks.</p>
      </main>
    </>
  );
}
