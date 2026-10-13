'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import type { Movie } from '@/app/definitions';
import { librarySchema, parseMovieLibrary, type MovieLibrary } from './movie-library';

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

export function useMovieLibrary() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const library = useMemo(() => parseMovieLibrary(raw), [raw]);
  const [storageError, setStorageError] = useState<string | null>(null);

  function toggle(movie: Movie, collection: keyof MovieLibrary) {
    try {
      // Read the current value so multiple cards and tabs don't overwrite each other.
      const current = parseMovieLibrary(window.localStorage.getItem(storageKey));
      const exists = current[collection].some((item) => item.id === movie.id);
      if (collection === 'watched' && !exists && !current.saved.some((item) => item.id === movie.id)) {
        setStorageError('Save this movie to your watchlist before marking it as watched.');
        return;
      }
      const limit = collection === 'saved' ? 200 : 400;
      if (!exists && current[collection].length >= limit) {
        setStorageError(`Your ${collection} list is full (${limit} movies). Remove a movie before adding another.`);
        return;
      }
      const next = librarySchema.parse({
        ...current,
        [collection]: exists ? current[collection].filter((item) => item.id !== movie.id) : [movie, ...current[collection]]
      });
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError(null);
      window.dispatchEvent(new Event(changeEvent));
    } catch {
      setStorageError('Could not save this change. Please allow browser storage and try again.');
    }
  }

  return { ...library, toggle, storageError };
}
