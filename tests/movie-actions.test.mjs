import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './load-ts.mjs';

const movie = { id: 1, title: 'Film', adult: false, backdrop_path: null, original_language: 'en', original_title: 'Film', overview: '', popularity: 1, poster_path: null, release_date: '', video: false, vote_average: 7, vote_count: 50 };
const libraryModule = loadTs('lib/movie-library.ts');

test('watched controls are opt-in, work without saving, and can be undone', () => {
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
  const unsaved = render(true);
  assert.ok(!unsaved.includes('disabled=""'));
  assert.ok(unsaved.includes('Mark as watched'));
  library = { saved: [], watched: [movie] };
  assert.ok(render(true).includes('Add to watchlist</button>'));
  assert.ok(render(true).includes('as unwatched'));
  assert.ok(!render().includes('as unwatched'));
});

test('each watchlist tab offers exactly its move and remove actions, with restoration after removal', () => {
  let library = { saved: [movie], watched: [] };
  const { Button } = loadTs('components/ui/button.tsx', { '@/lib/utils': loadTs('lib/utils.ts') });
  const MovieActions = loadTs('components/movie-actions.tsx', {
    '@/lib/use-movie-library': { useMovieLibrary: () => ({ ...library, toggle() {}, storageError: null }) },
    './ui/button': { Button }
  }).default;
  const render = (watchlistCollection) => renderToStaticMarkup(createElement(MovieActions, { movie, watchlistCollection }));
  const saved = render('saved');
  assert.equal((saved.match(/<button/g) || []).length, 2);
  assert.ok(saved.includes('Mark as watched</button>'));
  assert.ok(saved.includes('Remove</button>'));
  assert.ok(!saved.includes('Add to watchlist</button>'));
  assert.ok(saved.indexOf('lucide-trash-2') < saved.indexOf('Remove</button>'));
  assert.ok(saved.includes('film-remove'));
  library = { saved: [], watched: [movie] };
  const watched = render('watched');
  assert.equal((watched.match(/<button/g) || []).length, 2);
  assert.ok(watched.includes('Add to watchlist</button>'));
  assert.ok(watched.includes('Remove</button>'));
  assert.ok(watched.includes('from watched'));
  assert.ok(!watched.includes('Mark as watched</button>'));
  library = { saved: [], watched: [] };
  for (const collection of ['saved', 'watched']) {
    const removed = render(collection);
    assert.ok(removed.includes('Add to watchlist</button>'));
    assert.ok(removed.includes('Mark as watched</button>'));
    assert.ok(!removed.includes('lucide-trash-2'));
  }
});

test('guest library moves saved movies to watched and preserves direct removal behavior', (t) => {
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
  const { MovieLibraryProvider } = loadTs('lib/use-movie-library.tsx', {
    'react/jsx-runtime': { jsx: (_, props) => props.value },
    react: {
      createContext: () => ({ Provider: {} }),
      useEffect: () => {},
      useRef: (current) => ({ current }),
      useMemo: (factory) => factory(),
      useState: () => [null, (value) => { error = value; }],
      useSyncExternalStore: (_, snapshot) => snapshot()
    },
    '@tanstack/react-query': { useQuery: () => ({}), useMutation: () => ({}), useQueryClient: () => ({}) },
    '@/components/auth-provider': { useAuth: () => ({ user: null, loading: false }) },
    './supabase': { getSupabase: () => null },
    './cloud-movie-library': loadTs('lib/cloud-movie-library.ts', { './movie-library': libraryModule }),
    './movie-library': libraryModule
  });
  const { toggle } = MovieLibraryProvider({ children: null });
  toggle(movie, 'watched');
  assert.equal(changeEvents, 1);
  assert.equal(error, null);
  assert.equal(libraryModule.parseMovieLibrary(stored).watched[0].id, movie.id);
  assert.deepEqual(libraryModule.parseMovieLibrary(stored).saved, []);
  toggle(movie, 'watched');
  assert.deepEqual(libraryModule.parseMovieLibrary(stored), { saved: [], watched: [] });
  toggle(movie, 'saved');
  assert.deepEqual(libraryModule.parseMovieLibrary(stored).saved, [movie]);
  toggle(movie, 'watched');
  assert.deepEqual(libraryModule.parseMovieLibrary(stored), { saved: [], watched: [movie] });
  toggle(movie, 'saved');
  assert.deepEqual(libraryModule.parseMovieLibrary(stored), { saved: [movie], watched: [] });
  toggle(movie, 'saved');
  assert.deepEqual(libraryModule.parseMovieLibrary(stored), { saved: [], watched: [] });
});


test('tab actions move a movie in either direction and Remove restores the correct collection', () => {
  let library = { saved: [movie], watched: [] };
  let buttons = [];
  const { Button } = loadTs('components/ui/button.tsx', { '@/lib/utils': loadTs('lib/utils.ts') });
  const MovieActions = loadTs('components/movie-actions.tsx', {
    '@/lib/use-movie-library': { useMovieLibrary: () => ({
      ...library,
      toggle: (film, collection) => {
        const present = !library[collection].some((item) => item.id === film.id);
        library = libraryModule.changeMovieMembership(library, film, collection, present);
      }
    }) },
    './ui/button': { Button: (props) => { buttons.push(props); return createElement(Button, props); } }
  }).default;
  const render = (watchlistCollection) => {
    buttons = [];
    renderToStaticMarkup(createElement(MovieActions, { movie, watchlistCollection }));
  };
  render('saved');
  buttons[0].onClick();
  assert.deepEqual(library, { saved: [], watched: [movie] });
  render('watched');
  buttons[0].onClick();
  assert.deepEqual(library, { saved: [movie], watched: [] });
  for (const collection of ['saved', 'watched']) {
    library = { saved: [], watched: [], [collection]: [movie] };
    render(collection);
    buttons[1].onClick();
    assert.deepEqual(library, { saved: [], watched: [] });
    render(collection);
    buttons[1].onClick();
    assert.deepEqual(library[collection], [movie]);
    assert.deepEqual(library[collection === 'saved' ? 'watched' : 'saved'], []);
  }
});
