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
  const state = { query: null, mutation: null, error: null, cache: { saved: [], watched: [] }, user: { id: 'account-a' }, changes: [], queryFlags: {} };
  const hookState = [];
  let stateIndex = 0;
  const mutationLocks = { current: new Set() };
  const queryClient = {
    cancelQueries: async () => {},
    getQueryData: () => state.cache,
    setQueryData: (_key, value) => { state.cache = typeof value === 'function' ? value(state.cache) : value; },
    invalidateQueries: async (filter) => { state.invalidated = filter.queryKey; },
    removeQueries: () => {}
  };
  const { MovieLibraryProvider } = loadTs('lib/use-movie-library.tsx', {
    react: {
      createContext: () => ({ Provider: {} }), useEffect: () => {},
      useMemo: (fn) => fn(), useRef: () => mutationLocks,
      useState: (initial) => {
        const index = stateIndex++;
        if (!(index in hookState)) hookState[index] = typeof initial === 'function' ? initial() : initial;
        return [hookState[index], (value) => {
          hookState[index] = value;
          if (index === 0) state.error = value;
        }];
      },
      useSyncExternalStore: (_, snapshot) => snapshot()
    },
    'react/jsx-runtime': { jsx: (_, props) => props.value },
    '@tanstack/react-query': {
      useQueryClient: () => queryClient,
      useQuery: (options) => { state.query = options; return { data: state.cache, isSuccess: true, isPending: false, isFetching: false, isError: false, ...state.queryFlags }; },
      useMutation: (options) => { state.mutation = options; return { mutate: (change) => state.changes.push(change) }; }
    },
    '@/components/auth-provider': { useAuth: () => ({ user: state.user, loading: false }) },
    './supabase': { getSupabase: () => ({}) },
    './movie-library': libraryModule,
    './cloud-movie-library': { ...cloudModule, ...services }
  });
  return { state, render: () => { stateIndex = 0; return MovieLibraryProvider({ children: null }); }, stored: () => stored, setStored: (value) => { stored = value; } };
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


test('removals from either collection are optimistic and reversible on API failure', async (t) => {
  const h = harness(t);
  for (const collection of ['saved', 'watched']) {
    h.state.cache = { saved: [], watched: [], [collection]: [movie] };
    h.render().toggle(movie, collection);
    const change = h.state.changes.at(-1);
    assert.equal(change.present, false);
    const context = await h.state.mutation.onMutate(change);
    assert.deepEqual(h.state.cache, { saved: [], watched: [] });
    h.state.mutation.onError(new Error('offline'), change, context);
    assert.deepEqual(h.state.cache[collection], [movie]);
    await h.state.mutation.onSettled(null, new Error('offline'), change);
  }
});

test('saving one movie leaves other rows usable and rollback preserves their optimistic changes', async (t) => {
  const h = harness(t);
  const other = { ...movie, id: 2, title: 'Other film' };
  h.state.cache = { saved: [movie, other], watched: [] };
  h.state.queryFlags = { isFetching: true };
  h.render().toggle(movie, 'watched');
  const first = h.state.changes[0];
  const firstContext = await h.state.mutation.onMutate(first);
  const pending = h.render();
  assert.equal(pending.isLoading, false);
  assert.equal(pending.isMovieBusy(movie.id), true);
  assert.equal(pending.isMovieBusy(other.id), false);
  assert.equal(h.state.query.refetchOnWindowFocus(), false);
  assert.equal(h.state.query.refetchOnReconnect(), false);
  pending.toggle(movie, 'saved');
  assert.equal(h.state.changes.length, 1, 'same movie cannot submit conflicting writes');
  pending.toggle(other, 'watched');
  const second = h.state.changes[1];
  await h.state.mutation.onMutate(second);
  h.state.mutation.onError(new Error('offline'), first, firstContext);
  assert.deepEqual(h.state.cache, { saved: [movie], watched: [other] });
  await h.state.mutation.onSettled(null, new Error('offline'), first);
  assert.equal(h.state.invalidated, undefined, 'wait for all writes before refetching');
  await h.state.mutation.onSettled(null, null, second);
  assert.deepEqual(h.state.invalidated, ['movie-library', 'account-a']);
  assert.equal(h.render().isMovieBusy(movie.id), false);
  assert.equal(h.render().isMovieBusy(other.id), false);
  assert.equal(h.state.query.refetchOnWindowFocus(), true);
});
