'use client';

import type { Movie } from '@/app/definitions';
import { useMovieLibrary } from '@/lib/use-movie-library';
import { Bookmark, Check } from 'lucide-react';
import { Button } from './ui/button';

export default function MovieActions({ movie, allowMarkWatched = false, showSaveLabel = allowMarkWatched }: { movie: Movie; allowMarkWatched?: boolean; showSaveLabel?: boolean }) {
  const { saved, watched, toggle, storageError } = useMovieLibrary();
  const isSaved = saved.some((item) => item.id === movie.id);
  const isWatched = watched.some((item) => item.id === movie.id);
  return (
    <div>
      <div className={`film-actions${allowMarkWatched ? ' film-actions-watchlist' : ''}`}>
        <Button type='button' variant={showSaveLabel ? 'outline' : 'ghost'} size={showSaveLabel ? 'default' : 'icon-lg'} className={showSaveLabel ? 'film-bookmark-label' : 'film-bookmark'} title={isSaved ? 'Remove from watchlist' : 'Add to watchlist'} aria-pressed={isSaved} onClick={() => toggle(movie, 'saved')} aria-label={isSaved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}>
          <Bookmark size={18} className='size-[18px]' fill={isSaved ? 'currentColor' : 'none'} aria-hidden='true' />
          {showSaveLabel && (isSaved ? 'Saved' : 'Add to watchlist')}
        </Button>
        {allowMarkWatched && <Button type='button' variant='outline' aria-pressed={isWatched} onClick={() => toggle(movie, 'watched')} aria-label={isWatched ? `Mark ${movie.title} as unwatched` : `Mark ${movie.title} as watched`}>
          <Check size={18} className='size-[18px]' aria-hidden='true' />{isWatched ? 'Watched' : 'Mark as watched'}
        </Button>}
      </div>
      {storageError && <div role='alert' className='mt-2 text-sm text-destructive'>{storageError}</div>}
    </div>
  );
}
