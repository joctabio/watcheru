'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const { user, loading, configured, error: sessionError } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function signIn(provider: 'google' | 'email') {
    const client = getSupabase();
    if (!client) return;
    setBusy(true);
    setError(null);
    setSent(false);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const result =
        provider === 'google'
          ? await client.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo }
            })
          : await client.auth.signInWithOtp({
              email: email.trim(),
              options: { emailRedirectTo: redirectTo }
            });
      if (result.error) throw result.error;
      if (provider === 'email') setSent(true);
    } catch {
      setError('Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className='mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 px-6 py-16'>
      <Link
        href='/'
        className='text-sm text-muted-foreground hover:text-primary'
      >
        ← Back to Watcheru
      </Link>
      <h1 className='text-3xl font-semibold'>Sign In</h1>
      <p className='text-muted-foreground'>
        Sync your watchlist across devices. Movies saved in this browser will be
        added to your account.
      </p>
      {loading ? (
        <p role='status'>Checking your session…</p>
      ) : !configured ? (
        <p>
          Cloud sync is not configured yet. You can continue saving movies in
          this browser.
        </p>
      ) : user ? (
        <Button asChild>
          <Link href='/watchlist'>Go to your watchlist</Link>
        </Button>
      ) : (
        <>
          <form
            className='flex flex-col gap-3'
            onSubmit={(event) => {
              event.preventDefault();
              void signIn('email');
            }}
          >
            <label htmlFor='email' className='text-sm'>
              Email address
            </label>
            <Input
              id='email'
              type='email'
              autoComplete='email'
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='you@example.com'
              disabled={busy}
            />
            <Button type='submit' disabled={busy}>
              {busy ? 'Please wait…' : 'Continue'}
            </Button>
          </form>
          <div className='flex items-center gap-4 text-xs text-muted-foreground'>
            <span className='h-px flex-1 bg-border' aria-hidden='true' />
            <span>OR</span>
            <span className='h-px flex-1 bg-border' aria-hidden='true' />
          </div>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => void signIn('google')}
          >
            <svg viewBox='0 0 24 24' className='size-5 shrink-0' aria-hidden='true' focusable='false'>
              <path fill='#4285F4' d='M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z' />
              <path fill='#34A853' d='M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z' />
              <path fill='#FBBC05' d='M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02l3.34-2.59Z' />
              <path fill='#EA4335' d='M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59C7.19 7.72 9.4 5.96 12 5.96Z' />
            </svg>
            Continue with Google
          </Button>
        </>
      )}
      {sent && (
        <p role='status' className='text-sm'>
          Check your email for a sign-in link. You can close this page.
        </p>
      )}
      {(error || sessionError) && (
        <p role='alert' className='text-sm text-destructive'>
          {error || sessionError}
        </p>
      )}
    </main>
  );
}
