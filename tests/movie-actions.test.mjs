import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './load-ts.mjs';

const movie = { id: 1, title: 'Film', adult: false, backdrop_path: null, original_language: 'en', original_title: 'Film', overview: '', popularity: 1, poster_path: null, release_date: '', video: false, vote_average: 7, vote_count: 50 };
const libraryModule = loadTs('lib/movie-library.ts');

test('watched controls are opt-in and require a saved movie, while watched entries can be undone', () => {
  let library = { saved: [movie], watched: [] };
  const { Button } = loadTs('components/ui/button.tsx', { '@/lib/utils': loadTs('lib/utils.ts') });
  const MovieActions = loadTs('components/movie-actions.tsx', {
    '@/lib/use-movie-library': { useMovieLibrary: () => ({ ...library, toggle() {}, storageError: null }) },
    './ui/button': { Button }
  }).default;
  const render = (allowMarkWatched = false) => renderToStaticMarkup(createElement(MovieActions, { movie, allowMarkWatched }));
  assert.ok(!render().includes('Mark as watched'));
  assert.ok(!render().includes('>Saved</button>'));
  assert.ok(render(true).includes('Saved</button>'));
  assert.ok(render(true).includes('Mark as watched'));
  library = { saved: [], watched: [] };
  assert.ok(!render(true).includes('Mark as watched'));
  library = { saved: [], watched: [movie] };
  assert.ok(render(true).includes('Add to watchlist</button>'));
  assert.ok(render(true).includes('as unwatched'));
  assert.ok(!render().includes('as unwatched'));
});

test('library rejects marking an unsaved movie as watched and accepts it after saving', (t) => {
  const previousWindow = globalThis.window;
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  let stored = null;
  let error = null;
  let changeEvents = 0;
  globalThis.window = {
    localStorage: { getItem: () => stored, setItem: (_, value) => { stored = value; } },
    dispatchEvent: () => { changeEvents++; }
  };
  const { useMovieLibrary } = loadTs('lib/use-movie-library.ts', {
    react: {
      useMemo: (factory) => factory(),
      useState: () => [null, (value) => { error = value; }],
      useSyncExternalStore: (_, snapshot) => snapshot()
    },
    './movie-library': libraryModule
  });
  const { toggle } = useMovieLibrary();
  toggle(movie, 'watched');
  assert.equal(stored, null);
  assert.equal(changeEvents, 0);
  assert.match(error, /Save this movie/);
  toggle(movie, 'saved');
  toggle(movie, 'watched');
  assert.equal(error, null);
  assert.equal(libraryModule.parseMovieLibrary(stored).watched[0].id, movie.id);
  // Removing a bookmark must not prevent correcting an existing watched entry.
  toggle(movie, 'saved');
  toggle(movie, 'watched');
  assert.deepEqual(libraryModule.parseMovieLibrary(stored), { saved: [], watched: [] });
});
