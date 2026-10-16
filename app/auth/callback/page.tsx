'use client';

import Link from 'next/link';
import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  window.addEventListener('popstate', callback);
  return () => { window.removeEventListener('hashchange', callback); window.removeEventListener('popstate', callback); };
}
function hasCallbackError() {
  return new URLSearchParams(window.location.hash.slice(1)).has('error') || new URLSearchParams(window.location.search).has('error');
}

export default function AuthCallbackPage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const callbackError = useSyncExternalStore(subscribe, hasCallbackError, () => false);

  useEffect(() => {
    if (!loading && user && !callbackError) router.replace('/watchlist');
  }, [loading, user, router, callbackError]);

  return <main className='mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-4 px-6'>
    <h1 className='text-2xl font-semibold'>Signing you in</h1>
    {callbackError || error || (!loading && !user) ? <>
      <p role='alert'>This sign-in link could not be used. It may have expired. Please try signing in again.</p>
      <Link href='/login' className='underline'>Back to sign in</Link>
    </> : <p role='status'>Finishing your sign-in…</p>}
  </main>;
}
