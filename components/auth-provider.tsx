'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
}>({ user: null, loading: true, configured: false, error: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(() => ({ user: null as User | null, loading: isSupabaseConfigured(), configured: isSupabaseConfigured(), error: null as string | null }));

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    let active = true;
    let authEventReceived = false;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      if (active) setState({ user: session?.user ?? null, loading: false, configured: true, error: null });
    });
    // Also handle initialization errors, which do not produce an auth event.
    void client.auth.getSession().then(({ data, error }) => {
      if (active && (!authEventReceived || error)) setState({ user: data.session?.user ?? null, loading: false, configured: true, error: error ? 'Could not restore your session. Please sign in again.' : null });
    }).catch(() => {
      if (active) setState({ user: null, loading: false, configured: true, error: 'Could not restore your session. Please sign in again.' });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
