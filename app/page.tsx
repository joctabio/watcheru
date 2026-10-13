'use client';

import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchMovieGenres, fetchRandomMovie } from './queries';
import { Suspense, useId, useLayoutEffect, useReducer, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Play, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/header';
import CinemaHeaderFallback from '@/components/cinema-header-fallback';
import { Spinner } from '@/components/ui/spinner';
import MovieHero from '@/components/movie-hero';
import MovieFilters from '@/components/movie-filters';
import ResponsivePickActions from '@/components/responsive-pick-actions';
import type { Genre, MovieFilters as Filters, MovieSummary } from './definitions';
import RequestError from '@/components/request-error';
import { useMovieLibrary } from '@/lib/use-movie-library';

type History = { items: MovieSummary[]; index: number };
function historyReducer(state: History, action: { type: 'pick'; movie: MovieSummary } | { type: 'previous' }) {
  if (action.type === 'previous') return { ...state, index: Math.max(0, state.index - 1) };
  const items = [...state.items, action.movie].slice(-100);
  return { items, index: items.length - 1 };
}

export default function Home() {
  const pickerFormId = useId();
  const filtersId = `${pickerFormId}-filters`;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [history, dispatch] = useReducer(historyReducer, { items: [], index: -1 });
  const scrollAfterPick = useRef(false);
  const scrollToFilters = useRef(false);
  const movie = history.items[history.index];
  const { watched } = useMovieLibrary();
  const picker = useMutation({
    mutationFn: async (filters: Filters) => {
      // Let the outgoing fade finish even when the API responds immediately.
      const shouldFade = movie && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const [nextMovie] = await Promise.all([
        fetchRandomMovie(filters, [...new Set([...history.items.map((item) => item.id), ...watched.map((item) => item.id)])]),
        shouldFade ? new Promise<void>((resolve) => window.setTimeout(resolve, 160)) : Promise.resolve()
      ]);
      return nextMovie;
    },
    onSuccess: (nextMovie) => {
      scrollAfterPick.current = Boolean(movie);
      dispatch({ type: 'pick', movie: nextMovie });
    }
  });
  const genres = useQuery({ queryKey: ['genres'], queryFn: fetchMovieGenres });

  useLayoutEffect(() => {
    if (scrollAfterPick.current) {
      scrollAfterPick.current = false;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [history]);

  useLayoutEffect(() => {
    if (filtersOpen && scrollToFilters.current && window.matchMedia('(max-width: 767px)').matches) {
      document.getElementById(filtersId)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    scrollToFilters.current = false;
  }, [filtersOpen, filtersId]);

  function pickMovie(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const number = (key: string) => values.get(key) ? Number(values.get(key)) : undefined;
    picker.mutate({
      genre: number('genre'), language: String(values.get('language') || '') || undefined,
      year: number('year'), maxRuntime: number('maxRuntime'), minRating: number('minRating')
    });
  }

  const pickControls = (
    <ResponsivePickActions>
      <div className='picker-controls'>
        {movie && <Button type='button' variant='ghost' className='previous-pick' aria-label='Previous pick' title='Previous pick' disabled={history.index <= 0 || picker.isPending} onClick={() => dispatch({ type: 'previous' })}>
          <ArrowLeft size={20} className='size-5' aria-hidden='true' /><span className='previous-pick-label'>Previous pick</span>
        </Button>}
        <div className='picker-pick-group' role='group' aria-label='Pick a movie and adjust filters'>
          <Button type='button' variant='outline' size='icon-lg' className='filter-toggle' disabled={picker.isPending} aria-label='Filters for the next movie pick' title='Filters for the next pick' aria-expanded={filtersOpen} aria-controls={filtersId} onClick={() => {
            scrollToFilters.current = Boolean(movie) && !filtersOpen;
            setFiltersOpen((open) => !open);
          }}>
            <SlidersHorizontal size={20} className='size-5' aria-hidden='true' />
          </Button>
          <PickButton pending={picker.isPending} hasMovie={Boolean(movie)} formId={pickerFormId} />
        </div>
      </div>
    </ResponsivePickActions>
  );

  return (
    <>
      <Suspense fallback={<CinemaHeaderFallback />}><Header /></Suspense>
      <main className={`cinema-shell discover-page${movie ? '' : ' discover-initial'}`}>
        {movie ? (
          <div className='movie-pick-transition' data-loading={picker.isPending} aria-busy={picker.isPending} inert={picker.isPending}>
            <MovieHero movie={movie} runtime={movie.runtime} detailsHref={`/directory/${movie.id}`} genres={movie.genre_ids.map((id) => genres.data?.find((genre) => genre.id === id)).filter((genre): genre is Genre => Boolean(genre))} />
          </div>
        ) : (
          <div className='screening-room'>
            <SplashScreen actions={pickControls} />
          </div>
        )}
        <form id={pickerFormId} onSubmit={pickMovie} onReset={() => picker.reset()} className={`picker-desk${movie ? '' : ' picker-desk-initial'}`} aria-busy={picker.isPending}>
          {movie && pickControls}
          <MovieFilters id={filtersId} hidden={!filtersOpen} genres={genres.data ?? []} disabled={picker.isPending} />
          {genres.error && <RequestError error={genres.error} isRetrying={genres.isFetching} onRetry={() => { void genres.refetch(); }} />}
          {picker.error && <RequestError error={picker.error} isRetrying={picker.isPending} onRetry={() => picker.mutate(picker.variables ?? {})} />}
        </form>
      </main>
    </>
  );
}

function SplashScreen({ actions }: { actions: ReactNode }) {
  return (
    <section className='landing-screen' aria-label='Movie picker'>
      <h1>Find your next movie.</h1>
      <p>Get a random pick, or narrow it down with filters.</p>
      <div className='landing-action'>{actions}</div>
    </section>
  );
}

function PickButton({ pending, hasMovie = false, formId }: { pending: boolean; hasMovie?: boolean; formId?: string }) {
  return (
    <Button type='submit' form={formId} className='pick-button' disabled={pending} aria-busy={pending}>
      <span className='button-icon-slot' aria-hidden='true'>{pending ? <Spinner size={20} aria-hidden /> : <Play size={16} fill='currentColor' />}</span>
      <span>{pending ? 'Finding a movie…' : hasMovie ? 'Pick another' : 'Pick a movie'}</span>
    </Button>
  );
}
