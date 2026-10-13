import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';

const { getStreamingPlatforms } = loadTs('lib/streaming-providers.ts');
const provider = (provider_id, provider_name, logo_path = null) => ({ provider_id, provider_name, logo_path });

test('the same service appears once across IDs, regions, logos, ad plans, and channel listings', () => {
  const platforms = getStreamingPlatforms({
    US: { flatrate: [provider(1, 'Netflix', '/netflix.jpg'), provider(2, 'Paramount+', '/paramount.jpg'), provider(3, 'Amazon Prime Video', '/prime.jpg')] },
    GB: { flatrate: [provider(11, 'NETFLIX', '/netflix-uk.jpg'), provider(12, 'Paramount Plus Amazon Channel', '/channel.jpg')], ads: [provider(13, 'Prime Video with Ads', '/prime-ads.jpg')] },
    PH: { free: [provider(21, 'Netflix Basic with Ads', '/netflix-ads.jpg'), provider(22, 'Different regional listing', '/paramount.jpg'), provider(3, 'Prime Video')] }
  });
  assert.deepEqual(platforms.map((item) => item.provider_id), [3, 1, 2]);
});

test('distinct platforms stay separate and an available logo is preferred over a missing logo', () => {
  const platforms = getStreamingPlatforms({
    PH: { free: [provider(1, 'Example'), provider(2, 'Example Kids', '/kids.jpg'), provider(3, 'Unrelated', '/other.jpg')] },
    US: { flatrate: [provider(4, ' example ', '/example.jpg')], rent: [provider(5, 'Rent only', '/rent.jpg')], buy: [provider(6, 'Buy only', '/buy.jpg')] }
  });
  assert.equal(platforms.length, 3);
  assert.ok(platforms.some((item) => item.provider_id === 4));
  assert.ok(platforms.some((item) => item.provider_name === 'Example Kids'));
  assert.ok(platforms.some((item) => item.provider_name === 'Unrelated'));
});
