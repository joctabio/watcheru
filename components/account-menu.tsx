'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { LogIn, LogOut, Monitor, Moon, Sun, SunMoon, UserRound } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from './auth-provider';
import { getSupabase } from '@/lib/supabase';
import { Button } from './ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger
} from './ui/dropdown-menu';

function metadataText(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function avatarUrl(...values: unknown[]) {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
    } catch { /* Try the next provider field, then use the account icon. */ }
  }
  return null;
}

export default function AccountMenu() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const metadata = user?.user_metadata;
  const fullName = metadataText(metadata?.full_name, metadata?.name, metadata?.display_name);
  const name = fullName ?? user?.email ?? 'Your account';
  const avatar = avatarUrl(metadata?.avatar_url, metadata?.picture);

  async function signOut() {
    setBusy(true);
    setError(false);
    try {
      const client = getSupabase();
      if (!client) throw new Error('Authentication is unavailable.');
      const result = await client.auth.signOut({ scope: 'local' });
      if (result.error) throw result.error;
      setOpen(false);
    } catch { setError(true); }
    finally { setBusy(false); }
  }

  return <DropdownMenu open={open} onOpenChange={setOpen}>
    <DropdownMenuTrigger asChild>
      <Button type='button' variant='ghost' size='icon-lg' className='text-muted-foreground' disabled={loading} aria-label={loading ? 'Loading account' : user ? `Open account menu for ${name}` : 'Open account menu to sign in'} title={user ? name : 'Account'}>
        {user && avatar && avatar !== failedAvatar ? <Image src={avatar} alt='' width={32} height={32} unoptimized referrerPolicy='no-referrer' className='size-8 rounded-lg object-cover' onError={() => setFailedAvatar(avatar)} /> : <UserRound size={20} className='size-5' aria-hidden='true' />}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align='end' sideOffset={8} className='w-60'>
      <DropdownMenuLabel className='whitespace-normal break-words'>
        {user ? name : 'Welcome, Guest!'}
        {user?.email && fullName && <span className='mt-1 block text-xs font-normal text-muted-foreground'>{user.email}</span>}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger><SunMoon aria-hidden='true' />Theme</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent sideOffset={6}>
            <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={setTheme} aria-label='Theme'>
              <DropdownMenuRadioItem value='light'><Sun aria-hidden='true' />Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='dark'><Moon aria-hidden='true' />Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value='system'><Monitor aria-hidden='true' />System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      {user ? <DropdownMenuItem disabled={busy} onSelect={(event) => { event.preventDefault(); void signOut(); }}>
        <LogOut aria-hidden='true' />{busy ? 'Signing out…' : 'Sign out'}
      </DropdownMenuItem> : <DropdownMenuItem asChild><Link href='/login'><LogIn aria-hidden='true' />Sign in</Link></DropdownMenuItem>}
      {error && <p role='alert' className='px-2 py-2 text-xs text-destructive'>Could not sign out. Please try again.</p>}
    </DropdownMenuContent>
  </DropdownMenu>;
}
