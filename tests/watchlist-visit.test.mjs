import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';

const first = { id: 1, title: 'First' };
const second = { id: 2, title: 'Second' };
const third = { id: 3, title: 'Third' };

function newVisit() {
  let state;
  return loadTs('lib/use-watchlist-visit.ts', {
    react: { useState: (initial) => {
      state ??= initial;
      return [state, (next) => { state = next; }];
    } }
  }).useWatchlistVisit;
}

test('removing and restoring saved or watched membership retains rows without duplicates', () => {
  const visit = newVisit();
  assert.deepEqual(visit([first], [second]), { saved: [first], watched: [second] });
  assert.deepEqual(visit([], []), { saved: [first], watched: [second] });
  assert.deepEqual(visit([first], [second]), { saved: [first], watched: [second] });
  assert.deepEqual(visit([], []), { saved: [first], watched: [second] });
});

test('a fresh page visit uses persisted membership and drops previously removed rows', () => {
  const visit = newVisit();
  visit([first, second], [third]);
  const saved = [second];
  const watched = [];
  assert.deepEqual(visit(saved, watched), { saved: [first, second], watched: [third] });
  assert.deepEqual(newVisit()(saved, watched), { saved: [second], watched: [] });
});

test('async library loads and additions update each tab independently', () => {
  const visit = newVisit();
  visit([], []);
  assert.deepEqual(visit([first], []), { saved: [first], watched: [] });
  assert.deepEqual(visit([], [first]), { saved: [], watched: [first] });
  assert.deepEqual(visit([second], []), { saved: [second], watched: [first] });
  const updated = { ...first, title: 'Updated' };
  assert.deepEqual(visit([updated, second], []), { saved: [updated, second], watched: [] });
});

test('moving to watched removes the saved row immediately and a rollback restores it', () => {
  const visit = newVisit();
  visit([first, second], []);
  assert.deepEqual(visit([second], [first]), { saved: [second], watched: [first] });
  assert.deepEqual(visit([first, second], []), { saved: [first, second], watched: [] });
});

test('moving a watched movie to saved removes it from the watched tab immediately', () => {
  const visit = newVisit();
  visit([], [first, second]);
  assert.deepEqual(visit([first], [second]), { saved: [first], watched: [second] });
  assert.deepEqual(visit([first], []), { saved: [first], watched: [second] });
});
