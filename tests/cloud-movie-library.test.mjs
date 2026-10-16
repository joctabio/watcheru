import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';

const movieLibrary = loadTs('lib/movie-library.ts');
const { libraryFromRows, planGuestImport, fetchCloudLibrary, importGuestLibrary, setCloudMovie } = loadTs('lib/cloud-movie-library.ts', { './movie-library': movieLibrary });
const movie = (id) => ({ id, title: `Film ${id}`, adult: false, backdrop_path: null, original_language: 'en', original_title: 'Film', overview: '', popularity: 1, poster_path: null, release_date: '', video: false, vote_average: 7, vote_count: 50 });

function mockClient(result = { data: [], error: null }) {
  const calls = [];
  const chain = {};
  for (const method of ['select', 'eq', 'order', 'upsert', 'delete']) {
    chain[method] = (...args) => { calls.push([method, ...args]); return chain; };
  }
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return { calls, from: (table) => { calls.push(['from', table]); return chain; }, rpc: (...args) => { calls.push(['rpc', ...args]); return Promise.resolve(result); } };
}

test('cloud reads resolve older duplicate memberships in favor of watched and validate identity', () => {
  assert.deepEqual(libraryFromRows([
    { movie_id: 1, collection: 'saved', movie: movie(1) },
    { movie_id: 1, collection: 'watched', movie: movie(1) }
  ]), { saved: [], watched: [movie(1)] });
  assert.throws(() => libraryFromRows([{ movie_id: 2, collection: 'saved', movie: movie(1) }]));
  assert.throws(() => libraryFromRows([{ movie_id: 1, collection: 'other', movie: movie(1) }]));
  assert.throws(() => libraryFromRows([{ movie_id: 1, collection: 'saved', movie: { id: 1 } }]));
});

test('guest import deduplicates each collection and preserves overflow', () => {
  const cloud = { saved: Array.from({ length: 199 }, (_, i) => movie(i + 1)), watched: [movie(203)] };
  const guest = { saved: [movie(1), movie(200), movie(201), movie(200)], watched: [movie(202), movie(202)] };
  assert.deepEqual(planGuestImport(cloud, guest), {
    imports: { saved: [movie(200)], watched: [movie(202)] },
    remaining: { saved: [movie(201)], watched: [] }
  });
});

test('cloud reads are scoped to the current account and ordered newest first', async () => {
  const client = mockClient({ data: [{ movie_id: 1, collection: 'saved', movie: movie(1) }], error: null });
  assert.deepEqual(await fetchCloudLibrary(client, 'account-a'), { saved: [movie(1)], watched: [] });
  assert.ok(client.calls.some((call) => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'account-a'));
  assert.deepEqual(client.calls.at(-1), ['order', 'added_at', { ascending: false }]);
});

test('imports use idempotent inserts without overwriting existing account entries', async () => {
  const client = mockClient();
  const guest = { saved: [movie(1)], watched: [movie(1)] };
  const result = await importGuestLibrary(client, 'account-a', { saved: [], watched: [] }, guest);
  const upsert = client.calls.find((call) => call[0] === 'upsert');
  assert.deepEqual(upsert[2], { onConflict: 'user_id,movie_id,collection', ignoreDuplicates: true });
  assert.deepEqual(upsert[1].map(({ user_id, movie_id, collection }) => [user_id, movie_id, collection]), [['account-a', 1, 'watched']]);
  assert.deepEqual(result.remaining, { saved: [], watched: [] });
});

test('a failed import rejects so the caller cannot clear guest data', async () => {
  const client = mockClient({ data: null, error: new Error('network') });
  await assert.rejects(importGuestLibrary(client, 'account-a', { saved: [], watched: [] }, { saved: [movie(1)], watched: [] }), /network/);
});

test('deletes target one movie, collection, and account; writes strip extra metadata', async () => {
  const client = mockClient();
  await setCloudMovie(client, 'account-b', movie(1), 'watched', false);
  assert.deepEqual(client.calls.slice(-3), [['eq', 'user_id', 'account-b'], ['eq', 'movie_id', 1], ['eq', 'collection', 'watched']]);
  await setCloudMovie(client, 'account-b', { ...movie(1), credits: { cast: ['large'] } }, 'saved', true);
  const row = client.calls.find((call) => call[0] === 'upsert')[1];
  assert.equal(row.user_id, 'account-b');
  assert.equal('credits' in row.movie, false);
});

test('cloud read and mutation failures propagate for retry and rollback', async () => {
  const client = mockClient({ data: null, error: new Error('permission denied') });
  await assert.rejects(fetchCloudLibrary(client, 'account-a'), /permission denied/);
  await assert.rejects(setCloudMovie(client, 'account-a', movie(1), 'saved', true), /permission denied/);
  await assert.rejects(setCloudMovie(client, 'account-a', movie(1), 'saved', false), /permission denied/);
});


test('marking watched uses one atomic operation scoped to the initiating account', async () => {
  const client = mockClient();
  await setCloudMovie(client, 'account-a', { ...movie(1), credits: {} }, 'watched', true);
  assert.deepEqual(client.calls, [['rpc', 'mark_movie_watched', { movie_data: movie(1), target_user_id: 'account-a' }]]);
  const failing = mockClient({ data: null, error: new Error('watched list full') });
  await assert.rejects(setCloudMovie(failing, 'account-a', movie(1), 'watched', true), /watched list full/);
  assert.equal(failing.calls.length, 1);
});


test('guest imports preserve account membership even when guest collection differs', () => {
  const cloud = { saved: [movie(1)], watched: [movie(2)] };
  const guest = { saved: [movie(2), movie(3)], watched: [movie(1), movie(3)] };
  assert.deepEqual(planGuestImport(cloud, guest), {
    imports: { saved: [], watched: [movie(3)] }, remaining: { saved: [], watched: [] }
  });
});
