import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';

const { subscribeToMobileKeyboard } = loadTs('lib/mobile-keyboard.ts');

function setup(t) {
  const original = { window: globalThis.window, document: globalThis.document, HTMLElement: globalThis.HTMLElement };
  class Element {
    constructor(tagName, type = 'text') {
      this.tagName = tagName;
      this.type = type;
      this.isContentEditable = false;
    }
  }
  const viewport = Object.assign(new EventTarget(), { height: 844, scale: 1 });
  const win = Object.assign(new EventTarget(), { innerHeight: 844, innerWidth: 402, visualViewport: viewport });
  const doc = Object.assign(new EventTarget(), { activeElement: null });
  Object.assign(globalThis, { window: win, document: doc, HTMLElement: Element });
  const states = [];
  const cleanup = subscribeToMobileKeyboard((open) => states.push(open));
  t.after(() => {
    cleanup();
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
  return {
    states, win, cleanup,
    focus(type = 'text') { doc.activeElement = new Element('INPUT', type); doc.dispatchEvent(new Event('focusin')); },
    blur() { doc.activeElement = null; doc.dispatchEvent(new Event('focusout')); },
    resize(height) { viewport.height = height; viewport.dispatchEvent(new Event('resize')); }
  };
}

test('keyboard dismissal restores the actions even when the text input stays focused', (t) => {
  const ui = setup(t);
  ui.focus('search');
  assert.deepEqual(ui.states, [false, true]);
  ui.resize(480);
  ui.resize(844);
  assert.deepEqual(ui.states, [false, true, false]);
  // Tapping the same still-focused input can reopen the keyboard without focusin.
  ui.resize(480);
  assert.equal(ui.states.at(-1), true);
});

test('blurring waits for the keyboard to finish closing before restoring the actions', (t) => {
  const ui = setup(t);
  ui.focus('number');
  ui.resize(480);
  ui.blur();
  assert.equal(ui.states.at(-1), true);
  ui.resize(844);
  assert.equal(ui.states.at(-1), false);
});

test('non-text controls and small browser-toolbar resizes do not hide actions', (t) => {
  const ui = setup(t);
  ui.focus('checkbox');
  ui.resize(780);
  assert.deepEqual(ui.states, [false]);
  ui.cleanup();
  ui.focus();
  assert.deepEqual(ui.states, [false]);
});

test('rotation resets the viewport baseline instead of leaving actions hidden', (t) => {
  const ui = setup(t);
  ui.focus();
  ui.resize(480);
  ui.win.innerWidth = 844;
  ui.win.innerHeight = 402;
  ui.resize(402);
  assert.equal(ui.states.at(-1), false);
});
