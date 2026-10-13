'use client';

import { Suspense, useState } from 'react';
import { ArrowRight, Bookmark } from 'lucide-react';
import Header from '@/components/header';
import CinemaHeaderFallback from '@/components/cinema-header-fallback';
import MovieList from '@/components/movie-list';
import { useMovieLibrary } from '@/lib/use-movie-library';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WatchlistPage() {
  const { saved, watched } = useMovieLibrary();
  const [collection, setCollection] = useState<'saved' | 'watched'>('saved');
  const movies = collection === 'saved' ? saved : watched;

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
        <div className='collection-tabs' role='group' aria-label='Movie collection'>
          <button type='button' aria-pressed={collection === 'saved'} onClick={() => setCollection('saved')}>Saved<span>{saved.length}</span></button>
          <button type='button' aria-pressed={collection === 'watched'} onClick={() => setCollection('watched')}>Watched<span>{watched.length}</span></button>
        </div>
        {movies.length === 0 ? (
          <section className='empty-screen'>
            <Bookmark size={36} strokeWidth={1.5} />
            <h2>{collection === 'saved' ? 'No saved movies yet' : 'No watched movies yet'}</h2>
            <p>{collection === 'saved' ? 'Save movies to find them here later.' : 'Mark movies as watched to exclude them from new picks.'}</p>
            <Button className='pick-button mt-2' asChild><Link href='/'>Discover movies<ArrowRight size={14} /></Link></Button>
          </section>
        ) : <MovieList movies={movies} layout='list' showActions returnTo='/watchlist' />}
        <p className='mt-8 text-sm text-muted-foreground'>Saved in this browser. Watched films are excluded from new picks.</p>
      </main>
    </>
  );
}
