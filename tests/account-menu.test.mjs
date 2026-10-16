import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './load-ts.mjs';

function menu(user = null, signOut = async () => ({ error: null })) {
  const state = { user, loading: false, items: [], images: [], themeGroup: null, selectedTheme: null };
  const hooks = [];
  let cursor = 0;
  const wrapper = ({ children }) => createElement('div', null, children);
  const names = ['DropdownMenu', 'DropdownMenuContent', 'DropdownMenuLabel', 'DropdownMenuPortal', 'DropdownMenuRadioItem', 'DropdownMenuSeparator', 'DropdownMenuSub', 'DropdownMenuSubContent', 'DropdownMenuSubTrigger', 'DropdownMenuTrigger'];
  const dropdown = Object.fromEntries(names.map((name) => [name, wrapper]));
  dropdown.DropdownMenuItem = (props) => { state.items.push(props); return wrapper(props); };
  dropdown.DropdownMenuRadioGroup = (props) => { state.themeGroup = props; return wrapper(props); };
  const AccountMenu = loadTs('components/account-menu.tsx', {
    react: { useState: (initial) => {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], (value) => { hooks[index] = value; }];
    } },
    'next/image': (props) => {
      state.images.push(props);
      return createElement('img', { src: props.src, alt: props.alt, className: props.className });
    },
    'next/link': ({ href, children }) => createElement('a', { href }, children),
    'next-themes': { useTheme: () => ({ theme: 'dark', setTheme: (value) => { state.selectedTheme = value; } }) },
    './auth-provider': { useAuth: () => state },
    '@/lib/supabase': { getSupabase: () => ({ auth: { signOut } }) },
    './ui/button': { Button: ({ children, ...props }) => createElement('button', { disabled: props.disabled, 'aria-label': props['aria-label'] }, children) },
    './ui/dropdown-menu': dropdown
  }).default;
  return {
    state,
    render() {
      cursor = 0;
      state.items = [];
      state.images = [];
      return renderToStaticMarkup(createElement(AccountMenu));
    }
  };
}

const user = { email: 'jane@example.com', user_metadata: { full_name: 'Jane Doe', avatar_url: 'https://example.com/avatar.jpg' } };

test('account menu displays provider full name and rounded avatar, with a theme submenu', () => {
  const h = menu(user);
  const html = h.render();
  assert.ok(html.includes('Jane Doe'));
  assert.ok(html.includes('jane@example.com'));
  assert.ok(html.includes('rounded-lg'));
  assert.equal(h.state.images[0].src, user.user_metadata.avatar_url);
  for (const label of ['Theme', 'Light', 'Dark', 'System', 'Sign out']) assert.ok(html.includes(label));
  assert.equal(h.state.themeGroup.value, 'dark');
  h.state.themeGroup.onValueChange('light');
  assert.equal(h.state.selectedTheme, 'light');
});

test('guests can sign in and access themes; loading disables the account button', () => {
  const h = menu();
  assert.ok(h.render().includes('href="/login"'));
  assert.ok(!h.render().includes('Sign out'));
  assert.equal(h.state.images.length, 0);
  h.state.loading = true;
  assert.ok(h.render().includes('disabled=""'));
});

test('missing names fall back to email, and broken or invalid avatars use the account icon', () => {
  const h = menu({ email: user.email, user_metadata: { picture: user.user_metadata.avatar_url } });
  assert.ok(h.render().includes('Open account menu for jane@example.com'));
  h.state.images[0].onError();
  assert.ok(h.render().includes('lucide-user-round'));
  assert.equal(h.state.images.length, 0);
  h.state.user = { email: user.email, user_metadata: { avatar_url: 'invalid', picture: 'javascript:void(0)' } };
  h.render();
  assert.equal(h.state.images.length, 0);
});

test('sign out uses the local session and keeps failures visible for retry', async () => {
  let fail = true;
  let options;
  const h = menu(user, async (value) => { options = value; return { error: fail ? new Error('offline') : null }; });
  h.render();
  let prevented = false;
  h.state.items.find((item) => item.onSelect).onSelect({ preventDefault: () => { prevented = true; } });
  await new Promise(setImmediate);
  assert.ok(prevented);
  assert.deepEqual(options, { scope: 'local' });
  assert.ok(h.render().includes('Could not sign out. Please try again.'));
  fail = false;
  h.state.items.find((item) => item.onSelect).onSelect({ preventDefault() {} });
  await new Promise(setImmediate);
  assert.ok(!h.render().includes('Could not sign out'));
});
