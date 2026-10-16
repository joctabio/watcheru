import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './load-ts.mjs';

const navigation = loadTs('lib/movie-navigation.ts');
const Link = ({ children, href }) => createElement('a', { href }, children);

test('search context round-trips through a movie URL with punctuation, page, and list view', () => {
  const origin = navigation.searchResultsHref('Love & War? 日本', 3, 'list');
  const movieUrl = new URL(navigation.movieDetailsHref(10, origin), 'https://app.test');
  const destination = navigation.getMovieReturnDestination(movieUrl.searchParams.get('from'));
  assert.equal(movieUrl.pathname, '/directory/10');
  assert.equal(destination.href, origin);
  assert.equal(destination.label, 'Back to search results');
  assert.equal(destination.search, 'Love & War? 日本');
});

test('direct movie links return to Discover, and saved movies return to the collection', () => {
  assert.equal(navigation.movieDetailsHref(10), '/directory/10');
  assert.deepEqual(navigation.getMovieReturnDestination(undefined), { href: '/', label: 'Back to discover' });
  assert.deepEqual(navigation.getMovieReturnDestination('/watchlist'), { href: '/watchlist', label: 'Back to saved movies' });
});

test('return destinations ignore external URLs, unrelated routes, and ambiguous inputs', () => {
  for (const input of ['https://example.test/directory?search=Film', '//example.test/directory?search=Film', '/directory/10?search=Film', '/directory?search=  ', 'javascript:alert(1)', ['/directory?search=Film'], '/watchlist?from=https://example.test']) {
    assert.equal(navigation.getMovieReturnDestination(input).href, '/');
  }
});

test('invalid page and view values normalize to a usable search URL', () => {
  for (const page of ['0', '501', '1.5', 'NaN']) {
    const result = navigation.getMovieReturnDestination(`/directory?search=Film&page=${page}&view=invalid&unrelated=value`);
    assert.equal(result.href, '/directory?search=Film&page=1');
  }
});

test('the actual results card links to details with the return destination attached', () => {
  const MovieList = loadTs('components/movie-list.tsx', {
    'next/link': Link,
    'next/image': () => null,
    './movie-actions': () => null,
    '@/lib/movie-navigation': navigation
  }).default;
  const origin = navigation.searchResultsHref('Film', 4, 'list');
  const movie = { id: 10, title: 'Film', poster_path: null, release_date: '2020-01-01', original_language: 'en', vote_count: 0, overview: '' };
  const html = renderToStaticMarkup(createElement(MovieList, { movies: [movie], layout: 'list', returnTo: origin }));
  const href = html.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&');
  const destination = new URL(href, 'https://app.test');
  assert.equal(destination.pathname, '/directory/10');
  assert.equal(destination.searchParams.get('from'), origin);
});

test('the actual detail page renders a back button to the original search', async () => {
  const MoviePage = loadTs('app/directory/[id]/page.tsx', {
    '@/app/get-query-client': { getQueryClient: () => ({ prefetchQuery: async () => undefined }) },
    '@tanstack/react-query': { dehydrate: () => ({}), HydrationBoundary: ({ children }) => children },
    './movie': () => null,
    '@/app/queries': { fetchMovieById: async () => ({}) },
    'next/link': Link,
    '@/lib/movie-navigation': navigation,
    '@/components/ui/button': { Button: ({ children }) => children }
  }).default;
  const origin = navigation.searchResultsHref('Film', 4, 'list');
  const element = await MoviePage({ params: Promise.resolve({ id: '10' }), searchParams: Promise.resolve({ from: origin }) });
  const html = renderToStaticMarkup(element);
  assert.ok(html.includes('Back to search results'));
  const href = html.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&');
  assert.equal(href, origin);
});


test('Discover detail navigation skips the server fetch and returns without resetting scroll', async () => {
  let prefetched = false;
  let backProps;
  const MoviePage = loadTs('app/directory/[id]/page.tsx', {
    '@/app/get-query-client': { getQueryClient: () => ({ prefetchQuery: async () => { prefetched = true; } }) },
    '@tanstack/react-query': { dehydrate: () => ({}), HydrationBoundary: ({ children }) => children },
    './movie': () => null,
    '@/app/queries': { fetchMovieById: () => assert.fail('Discover already loaded this movie') },
    'next/link': (props) => { backProps = props; return Link(props); },
    '@/lib/movie-navigation': navigation,
    '@/components/ui/button': { Button: ({ children }) => children }
  }).default;
  const element = await MoviePage({ params: Promise.resolve({ id: '10' }), searchParams: Promise.resolve({ from: '/' }) });
  assert.ok(renderToStaticMarkup(element).includes('Back to discover'));
  assert.equal(prefetched, false);
  assert.equal(backProps.href, '/');
  assert.equal(backProps.scroll, false);
});
