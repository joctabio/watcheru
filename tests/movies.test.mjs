import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';

function service(fetch) {
  return loadTs('lib/tmdb-queries.ts', { 'server-only': {}, '@/lib/api': fetch });
}
const page = (results, totalPages = 1) => ({ page: 1, results, total_pages: totalPages, total_results: results.length });

test('search trims the title and safely encodes punctuation and the requested page', async () => {
  let url;
  const tmdb = service(async (endpoint) => { url = new URL(endpoint, 'https://example.test'); return page([]); });
  await tmdb.fetchMoviesByTitle('  Love & War?  ', 3);
  assert.equal(url.pathname, '/search/movie');
  assert.equal(url.searchParams.get('query'), 'Love & War?');
  assert.equal(url.searchParams.get('page'), '3');
  assert.equal(url.searchParams.get('include_adult'), 'false');
});

test('blank titles and invalid pages fail before calling the API', async () => {
  const tmdb = service(() => assert.fail('API should not be called'));
  await assert.rejects(tmdb.fetchMoviesByTitle('   '), /Enter a movie title/);
  for (const value of [0, 501, 1.5, NaN]) await assert.rejects(tmdb.fetchMoviesByTitle('Movie', value), /Invalid search page/);
});

test('random picks use the available page count and pass all preferences', async (t) => {
  t.mock.method(Math, 'random', () => 0.75);
  const urls = [];
  const tmdb = service(async (endpoint) => {
    const url = new URL(endpoint, 'https://example.test');
    urls.push(url);
    return url.searchParams.get('page') === '1' ? page([{ id: 1 }], 2) : page([{ id: 2 }], 2);
  });
  const result = await tmdb.fetchRandomMovie({ genre: 28, language: 'tl', year: 2020, maxRuntime: 120, minRating: 7 });
  assert.equal(result.id, 2);
  assert.deepEqual(urls.map((url) => url.searchParams.get('page')), ['1', '2']);
  for (const url of urls) {
    for (const [key, value] of Object.entries({ with_genres: '28', with_original_language: 'tl', primary_release_year: '2020', 'with_runtime.gte': '1', 'with_runtime.lte': '120', 'vote_average.gte': '7', 'vote_count.gte': '50', include_adult: 'false' })) {
      assert.equal(url.searchParams.get(key), value);
    }
  }
});

test('random picks cap TMDB discovery at page 500', async (t) => {
  t.mock.method(Math, 'random', () => 0.9999);
  const pages = [];
  const tmdb = service(async (endpoint) => {
    pages.push(Number(new URL(endpoint, 'https://example.test').searchParams.get('page')));
    return page([{ id: 1 }], 1000);
  });
  await tmdb.fetchRandomMovie();
  assert.deepEqual(pages, [1, 500]);
});

test('a one-page result reuses the initial request and excludes watched/recent movies', async (t) => {
  t.mock.method(Math, 'random', () => 0);
  let calls = 0;
  const tmdb = service(async () => { calls++; return page([{ id: 1 }, { id: 2 }, { id: 3 }]); });
  assert.equal((await tmdb.fetchRandomMovie({}, [1, 2])).id, 3);
  assert.equal(calls, 1);
});

test('picker tries another page when the chosen page contains only excluded titles', async (t) => {
  t.mock.method(Math, 'random', () => 0.75);
  const pages = [];
  const tmdb = service(async (endpoint) => {
    const selected = Number(new URL(endpoint, 'https://example.test').searchParams.get('page'));
    pages.push(selected);
    return page([{ id: selected === 1 ? 3 : 2 }], 2);
  });
  assert.equal((await tmdb.fetchRandomMovie({}, [2])).id, 3);
  assert.deepEqual(pages, [1, 2]);
});

test('empty filters and exhausted results have actionable errors', async () => {
  await assert.rejects(service(async () => page([], 0)).fetchRandomMovie(), /broaden/i);
  await assert.rejects(service(async () => page([{ id: 1 }])).fetchRandomMovie({}, [1]), /new title/);
});

test('invalid preferences and oversized history fail before calling the API', async () => {
  const tmdb = service(() => assert.fail('API should not be called'));
  for (const filters of [{ minRating: 11 }, { year: 1 }, { maxRuntime: -1 }, { language: 'invalid' }, { genre: 1.5 }]) {
    await assert.rejects(tmdb.fetchRandomMovie(filters), /check your movie filters/);
  }
  await assert.rejects(tmdb.fetchRandomMovie({}, Array.from({ length: 501 }, (_, i) => i + 1)), /Invalid movie history/);
});

test('details reject invalid IDs and request cast and videos', async () => {
  let endpoint;
  const tmdb = service(async (value) => { endpoint = value; return { id: 10 }; });
  await assert.rejects(tmdb.fetchMovieById('../bad'), /Invalid movie ID/);
  await tmdb.fetchMovieById('10');
  assert.equal(endpoint, '/movie/10?append_to_response=credits,videos');
});

test('provider regions are preserved and invalid IDs are rejected', async () => {
  const availability = { PH: { link: 'https://www.themoviedb.org/movie/10/watch', flatrate: [{ provider_id: 1, provider_name: 'Example' }] } };
  const tmdb = service(async () => ({ results: availability }));
  assert.deepEqual(await tmdb.fetchMovieProviders('10'), availability);
  await assert.rejects(tmdb.fetchMovieProviders('bad'), /Invalid movie ID/);
});

test('action failures survive serialization and become client query errors', async () => {
  const actions = loadTs('app/movie-actions.ts', { '@/lib/tmdb-queries': { fetchRandomMovie: async () => { throw new Error('No titles match these filters.'); } } });
  const result = JSON.parse(JSON.stringify(await actions.pickMovie({}, [])));
  assert.deepEqual(result, { ok: false, error: 'No titles match these filters.' });
  const queries = loadTs('app/queries.ts', { './movie-actions': actions });
  await assert.rejects(queries.fetchRandomMovie(), /No titles match/);
});

test('successful actions unwrap their payload for React Query', async () => {
  const actions = loadTs('app/movie-actions.ts', { '@/lib/tmdb-queries': { fetchMovieGenres: async () => [{ id: 28, name: 'Action' }] } });
  const queries = loadTs('app/queries.ts', { './movie-actions': actions });
  assert.deepEqual(await queries.fetchMovieGenres(), [{ id: 28, name: 'Action' }]);
});

test('movie library recovers safely from missing, corrupt, or invalid storage', () => {
  const { parseMovieLibrary } = loadTs('lib/movie-library.ts');
  for (const raw of [null, '', '{broken', 'null', '{"saved":[{"id":1}],"watched":[]}']) {
    assert.deepEqual(parseMovieLibrary(raw), { saved: [], watched: [] });
  }
});

test('movie library retains saved/watched movies and strips large detail payloads', () => {
  const { librarySchema, parseMovieLibrary } = loadTs('lib/movie-library.ts');
  const movie = { id: 1, title: 'Movie', adult: false, backdrop_path: null, original_language: 'en', original_title: 'Movie', overview: '', popularity: 1, poster_path: null, release_date: '', video: false, vote_average: 7, vote_count: 50, credits: { cast: ['large payload'] } };
  const stored = librarySchema.parse({ saved: [movie], watched: [movie] });
  assert.equal(stored.saved[0].id, 1);
  assert.equal(stored.watched[0].id, 1);
  assert.equal('credits' in stored.saved[0], false);
  assert.deepEqual(parseMovieLibrary(JSON.stringify(stored)), stored);
});

function configureApi(t) {
  const previous = { url: process.env.TMDB_API_URL, token: process.env.TMDB_ACCESS_TOKEN };
  process.env.TMDB_API_URL = 'https://example.test/3/';
  process.env.TMDB_ACCESS_TOKEN = 'test-token';
  t.after(() => {
    if (previous.url === undefined) delete process.env.TMDB_API_URL; else process.env.TMDB_API_URL = previous.url;
    if (previous.token === undefined) delete process.env.TMDB_ACCESS_TOKEN; else process.env.TMDB_ACCESS_TOKEN = previous.token;
  });
  return loadTs('lib/api.ts').default;
}

test('API keeps custom Headers and adds authorization and a timeout', async (t) => {
  const api = configureApi(t);
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://example.test/3/movie/1');
    assert.equal(options.headers.get('X-Test'), 'value');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ id: 1 });
  });
  assert.deepEqual(await api('/movie/1', { headers: new Headers({ 'X-Test': 'value' }) }), { id: 1 });
});

test('API returns useful HTTP, invalid JSON, and connectivity errors', async (t) => {
  const api = configureApi(t);
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ status_message: 'Title not found' }, { status: 404 }));
  await assert.rejects(api('/movie/1'), /Title not found/);
  fetch.mock.mockImplementation(async () => new Response('not JSON'));
  await assert.rejects(api('/movie/1'), /invalid response/);
  fetch.mock.mockImplementation(async () => { throw new Error('network'); });
  await assert.rejects(api('/movie/1'), /could not be reached/);
});

test('missing configuration produces an error without making a network request', async (t) => {
  const api = configureApi(t);
  delete process.env.TMDB_ACCESS_TOKEN;
  t.mock.method(globalThis, 'fetch', () => assert.fail('Fetch should not be called'));
  await assert.rejects(api('/movie/1'), /not configured/);
});
