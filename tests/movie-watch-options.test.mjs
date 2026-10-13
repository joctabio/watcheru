import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ReactQuery from '@tanstack/react-query';
import { loadTs } from './load-ts.mjs';

const { Button } = loadTs('components/ui/button.tsx', { '@/lib/utils': loadTs('lib/utils.ts') });
const WatchProviderBadge = loadTs('components/watch-provider.tsx', {
  'next/image': () => null,
  './ui/popover': loadTs('components/ui/popover.tsx', { '@/lib/utils': loadTs('lib/utils.ts') })
}).default;
const MovieWatchOptions = loadTs('components/movie-watch-options.tsx', {
  '@tanstack/react-query': ReactQuery,
  '@/app/queries': { fetchMovieProviders: async () => assert.fail('Cached availability should not fetch during server rendering') },
  './ui/button': { Button },
  './request-error': () => null,
  './ui/spinner': { Spinner: () => null },
  './watch-provider': WatchProviderBadge
}).default;
const MovieStreaming = loadTs('components/movie-streaming.tsx', {
  '@/lib/streaming-providers': loadTs('lib/streaming-providers.ts'),
  './ui/button': { Button },
  '@tanstack/react-query': ReactQuery,
  '@/app/queries': { fetchMovieProviders: async () => assert.fail('Cached availability should not fetch during server rendering') },
  './ui/spinner': { Spinner: () => null },
  './watch-provider': WatchProviderBadge
}).default;

function render(movieId, data, Component = MovieWatchOptions) {
  const client = new ReactQuery.QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (data) client.setQueryData(['providers', String(movieId)], data);
  const html = renderToStaticMarkup(createElement(ReactQuery.QueryClientProvider, { client }, createElement(Component, { movieId })));
  client.clear();
  return html;
}

test('detail watch options separate subscriptions from rent and buy', () => {
  const netflix = { provider_id: 1, provider_name: 'Netflix', logo_path: '/netflix.jpg' };
  const apple = { provider_id: 2, provider_name: 'Apple TV', logo_path: '/apple.jpg' };
  const data = {
    PH: { link: 'https://www.themoviedb.org/movie/1/watch', flatrate: [netflix], rent: [apple], buy: [apple] },
    US: { link: 'https://www.themoviedb.org/movie/1/watch', flatrate: [{ ...netflix, provider_name: 'US-only service' }] }
  };
    const html = render(1, data);
    assert.ok(html.includes('Where to watch'));
    assert.ok(html.includes('Subscription</h3>'));
    assert.ok(html.includes('Rent</h3>'));
    assert.ok(html.includes('Buy</h3>'));
    assert.ok(html.includes('Netflix'));
    assert.ok(html.includes('Apple TV'));
    assert.ok(!html.includes('US-only service'));
    assert.ok(html.includes('https://www.themoviedb.org/movie/1/watch'));
});

test('Discover combines unique streaming logos across regions and excludes rental and purchase providers', () => {
  const netflix = { provider_id: 1, provider_name: 'Netflix', logo_path: '/netflix.jpg' };
  const free = { provider_id: 2, provider_name: 'Free service', logo_path: null };
  const rental = { provider_id: 3, provider_name: 'Rental service', logo_path: '/rent.jpg' };
  const html = render(1, {
    PH: { flatrate: [netflix], free: [netflix, free], ads: [free], rent: [rental], buy: [rental] },
    US: { flatrate: [netflix, { ...netflix, provider_id: 4, provider_name: 'US-only service', logo_path: '/us.jpg' }] },
    GB: { free: [free], ads: [{ ...netflix, provider_id: 5, provider_name: 'UK-only service', logo_path: '/uk.jpg' }] }
  }, MovieStreaming);
  assert.ok(html.includes('Watch On'));
  assert.equal(html.match(/aria-label="Netflix"/g)?.length, 1);
  assert.equal(html.match(/aria-label="Free service"/g)?.length, 1);
  assert.ok(!html.includes('Rental service'));
  assert.ok(html.includes('US-only service'));
  assert.ok(html.includes('UK-only service'));
  assert.ok(!html.includes('<select'));
  const rentalOnly = render(2, { PH: { rent: [rental], buy: [rental] } }, MovieStreaming);
  assert.ok(rentalOnly.includes('Streaming availability'));
  assert.ok(rentalOnly.includes('No streaming options listed.'));
  assert.ok(!rentalOnly.includes('Rental service'));
  const missingRegion = render(3, { US: { flatrate: [netflix] } }, MovieStreaming);
  assert.ok(missingRegion.includes('Watch On'));
  assert.ok(missingRegion.includes('Netflix'));
  assert.ok(render(4, undefined, MovieStreaming).includes('Checking availability'));
});

test('missing regional availability and pending requests have clear states', () => {
  const html = render(2, { US: { flatrate: [{ provider_id: 1, provider_name: 'Netflix', logo_path: null }] } });
  assert.ok(html.includes('No availability is listed for this region'));
  assert.ok(!html.includes('Netflix'));
  const pending = render(3);
  assert.ok(pending.includes('Loading watch options'));
  assert.ok(!pending.includes('No availability'));
});
