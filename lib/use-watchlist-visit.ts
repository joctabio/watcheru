'use client';

import { useState } from 'react';
import type { MovieLibrary } from './movie-library';

function retainMovies(previous: MovieLibrary['saved'], current: MovieLibrary['saved']) {
  const previousIds = new Set(previous.map((movie) => movie.id));
  const currentById = new Map(current.map((movie) => [movie.id, movie]));
  return [
    ...current.filter((movie) => !previousIds.has(movie.id)),
    ...previous.map((movie) => currentById.get(movie.id) ?? movie)
  ];
}

// Keep rows for this page visit; action buttons still read live library membership.
export function useWatchlistVisit(saved: MovieLibrary['saved'], watched: MovieLibrary['watched']) {
  const [visit, setVisit] = useState({ saved, watched, visible: { saved, watched } });
  if (visit.saved !== saved || visit.watched !== watched) {
    const savedIds = new Set(saved.map((movie) => movie.id));
    const watchedIds = new Set(watched.map((movie) => movie.id));
    const next = {
      saved,
      watched,
      visible: {
        // A move to Watched leaves Saved immediately; simple removals stay undoable.
        saved: retainMovies(visit.visible.saved, saved).filter((movie) => savedIds.has(movie.id) || !watchedIds.has(movie.id)),
        watched: retainMovies(visit.visible.watched, watched).filter((movie) => watchedIds.has(movie.id) || !savedIds.has(movie.id))
      }
    };
    setVisit(next);
    return next.visible;
  }
  return visit.visible;
}
