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
      const result = provider === 'google'
        ? await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
        : await client.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo } });
      if (result.error) throw result.error;
      if (provider === 'email') setSent(true);
    } catch {
      setError('Could not sign in. Please try again.');
    } finally { setBusy(false); }
  }

  return (
    <main className='mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 px-6 py-16'>
      <Link href='/' className='text-sm text-muted-foreground hover:text-primary'>← Back to Watcheru</Link>
      <h1 className='text-3xl font-semibold'>Your movies, everywhere.</h1>
      <p className='text-muted-foreground'>Sign in to sync your saved and watched movies across devices. Movies saved in this browser will be added to your account.</p>
      {loading ? <p role='status'>Checking your session…</p> : !configured ? <p>Cloud sync is not configured yet. You can continue saving movies in this browser.</p> : user ? <Button asChild><Link href='/watchlist'>Go to your watchlist</Link></Button> : <>
        <Button variant='outline' disabled={busy} onClick={() => void signIn('google')}>Continue with Google</Button>
        <form className='flex flex-col gap-3' onSubmit={(event) => { event.preventDefault(); void signIn('email'); }}>
          <label htmlFor='email' className='text-sm'>Email address</label>
          <Input id='email' type='email' autoComplete='email' required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder='you@example.com' disabled={busy} />
          <Button type='submit' disabled={busy}>{busy ? 'Please wait…' : 'Email me a sign-in link'}</Button>
        </form>
      </>}
      {sent && <p role='status' className='text-sm'>Check your email for a sign-in link. You can close this page.</p>}
      {(error || sessionError) && <p role='alert' className='text-sm text-destructive'>{error || sessionError}</p>}
    </main>
  );
}
