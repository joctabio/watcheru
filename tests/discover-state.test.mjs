import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { loadTs } from './load-ts.mjs';

const { cacheDiscoverMovie } = loadTs('lib/discover-cache.ts');
const movie = { id: 10, title: 'Film', genre_ids: [28], genres: [{ id: 28, name: 'Action' }], runtime: 120, credits: { cast: [] }, videos: { results: [] }, watchProviders: { PH: { link: 'https://example.test/watch' } } };

test('More info renders seeded movie and availability immediately without fetching again', async () => {
  const client = new QueryClient();
  cacheDiscoverMovie(client, movie);
  const subscriptions = [];
  let requests = 0;
  const useQuery = (options) => {
    const observer = new QueryObserver(client, options);
    subscriptions.push(observer.subscribe(() => {}));
    return observer.getCurrentResult();
  };
  const MovieWatchOptions = loadTs('components/movie-watch-options.tsx', {
    '@tanstack/react-query': { useQuery },
    '@/app/queries': { fetchMovieProviders: async () => { requests++; return {}; } },
    './ui/button': { Button: ({ children }) => createElement('button', null, children) },
    './request-error': () => null,
    './ui/spinner': { Spinner: () => createElement('span', null, 'Loading') },
    './watch-provider': () => null
  }).default;
  const MovieDisplay = loadTs('app/directory/[id]/movie.tsx', {
    '@tanstack/react-query': { useQuery },
    '@/app/queries': { fetchMovieById: async () => { requests++; return movie; } },
    '@/components/request-error': () => null,
    '@/components/ui/spinner': { Spinner: () => createElement('span', null, 'Loading') },
    '@/components/movie-skeleton': { MovieDetailsSkeleton: () => createElement('span', null, 'Loading details') },
    '@/components/movie-hero': ({ movie }) => createElement('h1', null, movie.title),
    '@/components/movie-extras': ({ movie }) => createElement(MovieWatchOptions, { movieId: movie.id })
  }).default;
  try {
    const html = renderToStaticMarkup(createElement(MovieDisplay, { id: '10' }));
    await new Promise(setImmediate);
    assert.ok(html.includes('Film'));
    assert.ok(html.includes('Where to watch'));
    assert.ok(!html.includes('Loading'));
    assert.ok(!html.includes('Updating movie'));
    assert.equal(requests, 0);
    assert.equal(client.getQueryState(['movie', '10']).status, 'success');
    assert.deepEqual(client.getQueryData(['providers', '10']), movie.watchProviders);
  } finally {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    client.clear();
  }
});

test('an uncached direct detail URL still loads its movie normally', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let requests = 0;
  const data = await client.fetchQuery({ queryKey: ['movie', '10'], queryFn: async () => { requests++; return movie; }, staleTime: Infinity });
  assert.equal(requests, 1);
  assert.deepEqual(data, movie);
  client.clear();
});

test('Discover provider preserves the selected history entry, preferences, and scroll across page remounts', () => {
  const slots = [];
  let cursor = 0;
  const stateHook = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
  };
  const { DiscoverProvider } = loadTs('components/discover-provider.tsx', {
    react: {
      createContext: () => ({ Provider: {} }),
      useState: stateHook,
      useReducer: (reducer, initial) => { const [state, setState] = stateHook(initial); return [state, (action) => setState((current) => reducer(current, action))]; },
      useRef: (initial) => stateHook({ current: initial })[0]
    },
    'react/jsx-runtime': { jsx: (_type, props) => props.value }
  });
  const render = () => { cursor = 0; return DiscoverProvider({ children: null }); };
  let discover = render();
  discover.dispatch({ type: 'pick', movie });
  discover.dispatch({ type: 'pick', movie: { ...movie, id: 11 } });
  discover.dispatch({ type: 'previous' });
  discover.setPreferences({ genre: '28', language: 'en', year: '2020', maxRuntime: '120', minRating: '7' });
  discover.setFiltersOpen(true);
  discover.scrollPositionRef.current = 420;
  discover = render();
  assert.equal(discover.history.items.length, 2);
  assert.equal(discover.history.items[discover.history.index].id, 10);
  assert.equal(discover.preferences.genre, '28');
  assert.equal(discover.preferences.minRating, '7');
  assert.equal(discover.filtersOpen, true);
  assert.equal(discover.scrollPositionRef.current, 420);
});
