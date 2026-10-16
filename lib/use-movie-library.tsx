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
  isFetching: boolean;
  isBusy: boolean;
  isMovieBusy: (movieId: number) => boolean;
  retry: () => void;
};
const LibraryContext = createContext<LibraryContext | null>(null);

export function MovieLibraryProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const guest = useMemo(() => parseMovieLibrary(raw), [raw]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const mutationLocks = useRef(new Set<string>());
  const [pendingMovies, setPendingMovies] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['movie-library'], predicate: (query) => query.queryKey[1] !== user?.id });
  }, [user?.id, queryClient]);

  function hasPendingChanges(userId: string | undefined) {
    return !!userId && [...mutationLocks.current].some((key) => key.startsWith(`${userId}:`));
  }

  const cloud = useQuery({
    queryKey: ['movie-library', user?.id],
    enabled: !!user && !loading,
    staleTime: 0,
    refetchOnWindowFocus: () => !hasPendingChanges(user?.id),
    refetchOnReconnect: () => !hasPendingChanges(user?.id),
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
    onError: (_error, change, context) => {
      if (context?.previous) {
        const previous = context.previous;
        // Roll back only this movie; other rows may have saved in the meantime.
        queryClient.setQueryData<MovieLibrary>(context.key, (current) => current ? {
          saved: [...previous.saved.filter((movie) => movie.id === change.movie.id), ...current.saved.filter((movie) => movie.id !== change.movie.id)],
          watched: [...previous.watched.filter((movie) => movie.id === change.movie.id), ...current.watched.filter((movie) => movie.id !== change.movie.id)]
        } : current);
      }
      setStorageError('Could not save your change to your account. Check your connection and try again.');
    },
    onSettled: async (_data, _error, change) => {
      mutationLocks.current.delete(`${change.userId}:${change.movie.id}`);
      setPendingMovies(new Set(mutationLocks.current));
      // Avoid replacing another movie's optimistic state with a partial server snapshot.
      if (!hasPendingChanges(change.userId)) {
        await queryClient.invalidateQueries({ queryKey: ['movie-library', change.userId] });
      }
    }
  });

  const library = loading ? emptyLibrary : user ? cloud.data ?? emptyLibrary : guest;
  const isBusy = loading || (!!user && !cloud.data);

  function isMovieBusy(movieId: number) {
    return isBusy || (!!user && pendingMovies.has(`${user.id}:${movieId}`));
  }

  function toggle(movie: Movie, collection: Collection) {
    const lockKey = user ? `${user.id}:${movie.id}` : '';
    if (isBusy || mutationLocks.current.has(lockKey)) return;
    try {
      const current = user ? queryClient.getQueryData<MovieLibrary>(['movie-library', user.id]) ?? library : parseMovieLibrary(window.localStorage.getItem(storageKey));
      const exists = current[collection].some((item) => item.id === movie.id);
      const limit = collectionLimits[collection];
      if (!exists && current[collection].length >= limit) {
        setStorageError(`Your ${collection} list is full (${limit} movies). Remove a movie before adding another.`);
        return;
      }
      setStorageError(null);
      if (user) {
        const parsed = movieSchema.parse(movie);
        mutationLocks.current.add(lockKey);
        setPendingMovies(new Set(mutationLocks.current));
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
    isLoading: loading || (!!user && cloud.isPending),
    isFetching: !!user && cloud.isFetching, isBusy, isMovieBusy,
    retry: () => { if (!hasPendingChanges(user?.id)) { setStorageError(null); void cloud.refetch(); } }
  }}>{children}</LibraryContext.Provider>;
}

export function useMovieLibrary() {
  const library = useContext(LibraryContext);
  if (!library) throw new Error('useMovieLibrary requires MovieLibraryProvider.');
  return library;
}
