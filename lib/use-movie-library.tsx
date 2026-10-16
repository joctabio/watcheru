'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Movie } from '@/app/definitions';
import { useAuth } from '@/components/auth-provider';
import { getSupabase } from './supabase';
import { changeMovieMembership, emptyLibrary, movieSchema, parseMovieLibrary, type MovieLibrary } from './movie-library';
import { collectionLimits, fetchCloudLibrary, hasMovies, importGuestLibrary, setCloudMovie, type Collection } from './cloud-movie-library';

const storageKey = 'watcheru-library-v1';
const changeEvent = 'watcheru-library-change';

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) callback();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(changeEvent, callback);
  };
}

function getSnapshot() {
  try { return window.localStorage.getItem(storageKey); } catch { return null; }
}

function writeGuest(library: MovieLibrary) {
  window.localStorage.setItem(storageKey, JSON.stringify(library));
  window.dispatchEvent(new Event(changeEvent));
}

type LibraryContext = MovieLibrary & {
  toggle: (movie: Movie, collection: Collection) => void;
  storageError: string | null;
  isLoading: boolean;
  isBusy: boolean;
  retry: () => void;
};
const LibraryContext = createContext<LibraryContext | null>(null);

export function MovieLibraryProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const guest = useMemo(() => parseMovieLibrary(raw), [raw]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const mutationLock = useRef(false);
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['movie-library'], predicate: (query) => query.queryKey[1] !== user?.id });
  }, [user?.id, queryClient]);

  const cloud = useQuery({
    queryKey: ['movie-library', user?.id],
    enabled: !!user && !loading,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 1,
    queryFn: async ({ signal }) => {
      const client = getSupabase()!;
      const userId = user!.id;
      const library = await fetchCloudLibrary(client, userId);
      // Capture a fresh snapshot; never erase guest edits made while importing.
      signal.throwIfAborted();
      const snapshot = getSnapshot();
      const local = parseMovieLibrary(snapshot);
      if (!hasMovies(local)) return library;
      const { library: merged, remaining } = await importGuestLibrary(client, userId, library, local);
      signal.throwIfAborted();
      if (getSnapshot() === snapshot) {
        try { writeGuest(remaining); } catch { /* Cloud import succeeded; a retry is safe. */ }
      }
      return merged;
    }
  });

  const mutation = useMutation({
    networkMode: 'always',
    mutationFn: async (change: { userId: string; movie: MovieLibrary['saved'][number]; collection: Collection; present: boolean }) => {
      await setCloudMovie(getSupabase()!, change.userId, change.movie, change.collection, change.present);
    },
    onMutate: async (change) => {
      const key = ['movie-library', change.userId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MovieLibrary>(key);
      if (previous) queryClient.setQueryData(key, changeMovieMembership(previous, change.movie, change.collection, change.present));
      return { previous, key };
    },
    onError: (_error, _change, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      setStorageError('Could not save your change to your account. Check your connection and try again.');
    },
    onSettled: async (_data, _error, change) => {
      await queryClient.invalidateQueries({ queryKey: ['movie-library', change.userId] });
      mutationLock.current = false;
    }
  });

  const library = loading ? emptyLibrary : user ? cloud.data ?? emptyLibrary : guest;
  const isBusy = loading || mutation.isPending || (!!user && (cloud.isFetching || !cloud.data || cloud.isError));

  function toggle(movie: Movie, collection: Collection) {
    if (isBusy || mutationLock.current) return;
    try {
      const current = user ? library : parseMovieLibrary(window.localStorage.getItem(storageKey));
      const exists = current[collection].some((item) => item.id === movie.id);
      const limit = collectionLimits[collection];
      if (!exists && current[collection].length >= limit) {
        setStorageError(`Your ${collection} list is full (${limit} movies). Remove a movie before adding another.`);
        return;
      }
      setStorageError(null);
      if (user) {
        const parsed = movieSchema.parse(movie);
        mutationLock.current = true;
        mutation.mutate({ userId: user.id, movie: parsed, collection, present: !exists });
      } else {
        writeGuest(changeMovieMembership(current, movie, collection, !exists));
      }
    } catch {
      setStorageError('Could not save this change. Please allow browser storage and try again.');
    }
  }

  const error = cloud.isError && user ? 'Could not sync your watchlist. Check your connection and retry.' : user && hasMovies(guest) && cloud.isSuccess ? 'Some browser movies are waiting to sync. If your account list is full, remove movies to make room. Your browser movies remain saved locally.' : null;
  return <LibraryContext.Provider value={{
    ...library, toggle, storageError: storageError ?? error,
    isLoading: loading || (!!user && cloud.isPending), isBusy,
    retry: () => { setStorageError(null); void cloud.refetch(); }
  }}>{children}</LibraryContext.Provider>;
}

export function useMovieLibrary() {
  const library = useContext(LibraryContext);
  if (!library) throw new Error('useMovieLibrary requires MovieLibraryProvider.');
  return library;
}
