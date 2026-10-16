import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';

const libraryModule = loadTs('lib/movie-library.ts');
const cloudModule = loadTs('lib/cloud-movie-library.ts', { './movie-library': libraryModule });
const movie = { id: 1, title: 'Film', adult: false, backdrop_path: null, original_language: 'en', original_title: 'Film', overview: '', popularity: 1, poster_path: null, release_date: '', video: false, vote_average: 7, vote_count: 50 };

function harness(t, services = {}) {
  const previousWindow = globalThis.window;
  t.after(() => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  let stored = JSON.stringify({ saved: [movie], watched: [] });
  globalThis.window = {
    localStorage: { getItem: () => stored, setItem: (_, value) => { stored = value; } },
    dispatchEvent: () => {}
  };
  const state = { query: null, mutation: null, error: null, cache: { saved: [], watched: [] }, user: { id: 'account-a' } };
  const queryClient = {
    cancelQueries: async () => {},
    getQueryData: () => state.cache,
    setQueryData: (_key, value) => { state.cache = value; },
    invalidateQueries: async (filter) => { state.invalidated = filter.queryKey; },
    removeQueries: () => {}
  };
  const { MovieLibraryProvider } = loadTs('lib/use-movie-library.tsx', {
    react: {
      createContext: () => ({ Provider: {} }), useEffect: () => {},
      useMemo: (fn) => fn(), useRef: (current) => ({ current }),
      useState: () => [state.error, (value) => { state.error = value; }],
      useSyncExternalStore: (_, snapshot) => snapshot()
    },
    'react/jsx-runtime': { jsx: (_, props) => props.value },
    '@tanstack/react-query': {
      useQueryClient: () => queryClient,
      useQuery: (options) => { state.query = options; return { data: state.cache, isSuccess: true }; },
      useMutation: (options) => { state.mutation = options; return {}; }
    },
    '@/components/auth-provider': { useAuth: () => ({ user: state.user, loading: false }) },
    './supabase': { getSupabase: () => ({}) },
    './movie-library': libraryModule,
    './cloud-movie-library': { ...cloudModule, ...services }
  });
  return { state, render: () => MovieLibraryProvider({ children: null }), stored: () => stored, setStored: (value) => { stored = value; } };
}

test('cloud watched moves optimistically update both collections and roll back both on failure', async (t) => {
  const h = harness(t);
  h.state.cache = { saved: [movie], watched: [] };
  h.render();
  const change = { userId: 'account-a', movie, collection: 'watched', present: true };
  const context = await h.state.mutation.onMutate(change);
  assert.deepEqual(h.state.cache, { saved: [], watched: [movie] });
  assert.deepEqual(context.key, ['movie-library', 'account-a']);
  h.state.mutation.onError(new Error('offline'), change, context);
  assert.deepEqual(h.state.cache, { saved: [movie], watched: [] });
  assert.match(h.state.error, /Could not save/);
  await h.state.mutation.onSettled(null, null, change);
  assert.deepEqual(h.state.invalidated, ['movie-library', 'account-a']);
  assert.equal(h.state.mutation.networkMode, 'always');
});

test('successful imports clear guest storage only after cloud confirmation', async (t) => {
  const h = harness(t, {
    fetchCloudLibrary: async () => ({ saved: [], watched: [] }),
    importGuestLibrary: async () => ({ library: { saved: [movie], watched: [] }, remaining: { saved: [], watched: [] } })
  });
  h.render();
  const data = await h.state.query.queryFn({ signal: new AbortController().signal });
  assert.deepEqual(data.saved, [movie]);
  assert.deepEqual(JSON.parse(h.stored()), { saved: [], watched: [] });
});

test('failed imports preserve guest movies for a later retry', async (t) => {
  const h = harness(t, {
    fetchCloudLibrary: async () => ({ saved: [], watched: [] }),
    importGuestLibrary: async () => { throw new Error('offline'); }
  });
  const before = h.stored();
  h.render();
  await assert.rejects(h.state.query.queryFn({ signal: new AbortController().signal }), /offline/);
  assert.equal(h.stored(), before);
});

test('import completion cannot erase guest edits made by another tab', async (t) => {
  let finishImport;
  const h = harness(t, {
    fetchCloudLibrary: async () => ({ saved: [], watched: [] }),
    importGuestLibrary: () => new Promise((resolve) => { finishImport = resolve; })
  });
  h.render();
  const pending = h.state.query.queryFn({ signal: new AbortController().signal });
  await Promise.resolve();
  const edited = JSON.stringify({ saved: [movie], watched: [movie] });
  h.setStored(edited);
  finishImport({ library: { saved: [movie], watched: [] }, remaining: { saved: [], watched: [] } });
  await pending;
  assert.equal(h.stored(), edited);
});

test('canceling an account query preserves guest data and account keys stay separate', async (t) => {
  const controller = new AbortController();
  const h = harness(t, { fetchCloudLibrary: async () => { controller.abort(); return { saved: [], watched: [] }; } });
  h.render();
  const before = h.stored();
  assert.deepEqual(h.state.query.queryKey, ['movie-library', 'account-a']);
  await assert.rejects(h.state.query.queryFn({ signal: controller.signal }), { name: 'AbortError' });
  assert.equal(h.stored(), before);
  h.state.user = { id: 'account-b' };
  h.render();
  assert.deepEqual(h.state.query.queryKey, ['movie-library', 'account-b']);
  h.state.user = null;
  h.render();
  assert.equal(h.state.query.enabled, false);
});


test('cloud moves back to saved clear watched membership and roll back on failure', async (t) => {
  const h = harness(t);
  h.state.cache = { saved: [], watched: [movie] };
  h.render();
  const change = { userId: 'account-a', movie, collection: 'saved', present: true };
  const context = await h.state.mutation.onMutate(change);
  assert.deepEqual(h.state.cache, { saved: [movie], watched: [] });
  h.state.mutation.onError(new Error('offline'), change, context);
  assert.deepEqual(h.state.cache, { saved: [], watched: [movie] });
});
