'use client';

import { createContext, useContext, useReducer, useRef, useState } from 'react';
import type { DiscoverMovie } from '@/app/definitions';

export const emptyPreferences = { genre: '', language: '', year: '', maxRuntime: '', minRating: '' };
export type DiscoverPreferences = typeof emptyPreferences;
export type DiscoverHistory = { items: DiscoverMovie[]; index: number };
export function discoverHistoryReducer(state: DiscoverHistory, action: { type: 'pick'; movie: DiscoverMovie } | { type: 'previous' }): DiscoverHistory {
  if (action.type === 'previous') return { ...state, index: Math.max(0, state.index - 1) };
  const items = [...state.items, action.movie].slice(-100);
  return { items, index: items.length - 1 };
}

function useDiscoverState() {
  const [history, dispatch] = useReducer(discoverHistoryReducer, { items: [], index: -1 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [preferences, setPreferences] = useState(emptyPreferences);
  const scrollPositionRef = useRef(0);
  return { history, dispatch, filtersOpen, setFiltersOpen, preferences, setPreferences, scrollPositionRef };
}
const DiscoverContext = createContext<ReturnType<typeof useDiscoverState> | null>(null);
export function DiscoverProvider({ children }: { children: React.ReactNode }) {
  const state = useDiscoverState();
  return <DiscoverContext.Provider value={state}>{children}</DiscoverContext.Provider>;
}
export function useDiscover() {
  const state = useContext(DiscoverContext);
  if (!state) throw new Error('useDiscover requires DiscoverProvider.');
  return state;
}
