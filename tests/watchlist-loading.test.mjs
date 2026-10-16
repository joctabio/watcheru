import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './load-ts.mjs';

test('watchlist shows skeletons only on initial load and keeps rows mounted during background sync', () => {
  let library = { saved: [{ id: 1 }], watched: [], isLoading: true, isFetching: true };
  const WatchlistPage = loadTs('app/watchlist/page.tsx', {
    '@/components/header': () => null,
    '@/components/cinema-header-fallback': () => null,
    '@/components/movie-list': () => createElement('div', { 'data-testid': 'movie-rows' }),
    '@/components/movie-skeleton': { MovieResultsSkeleton: () => createElement('div', { 'data-testid': 'skeleton' }) },
    '@/lib/use-movie-library': { useMovieLibrary: () => library },
    '@/components/ui/button': { Button: 'button' },
    'next/link': 'a',
    '@/components/auth-provider': { useAuth: () => ({ user: { id: 'account-a' } }) },
    '@/lib/use-watchlist-visit': { useWatchlistVisit: (saved, watched) => ({ saved, watched }) }
  }).default;
  const render = () => renderToStaticMarkup(createElement(WatchlistPage));
  assert.match(render(), /data-testid="skeleton"/);
  library = { ...library, isLoading: false };
  const refreshing = render();
  assert.match(refreshing, /data-testid="movie-rows"/);
  assert.doesNotMatch(refreshing, /data-testid="skeleton"/);
  library = { ...library, isFetching: false };
  assert.match(render(), /data-testid="movie-rows"/);
});
