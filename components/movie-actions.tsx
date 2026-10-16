'use client';

import type { MovieLibrary } from '@/lib/movie-library';
import type { Movie } from '@/app/definitions';
import { useMovieLibrary } from '@/lib/use-movie-library';
import { Bookmark, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

export default function MovieActions({ movie, allowMarkWatched = false, showSaveLabel = allowMarkWatched, watchlistCollection }: { movie: Movie; allowMarkWatched?: boolean; showSaveLabel?: boolean; watchlistCollection?: keyof MovieLibrary }) {
  const { saved, watched, toggle, storageError, isBusy } = useMovieLibrary();
  const isSaved = saved.some((item) => item.id === movie.id);
  const isWatched = watched.some((item) => item.id === movie.id);
  if (watchlistCollection) {
    const inCollection = watchlistCollection === 'saved' ? isSaved : isWatched;
    const destination = watchlistCollection === 'saved' ? 'watched' : 'saved';
    const moveLabel = destination === 'watched' ? 'Mark as watched' : 'Add to watchlist';
    const restoreLabel = watchlistCollection === 'saved' ? 'Add to watchlist' : 'Mark as watched';
    const MoveIcon = destination === 'watched' ? Check : Plus;
    const RestoreIcon = watchlistCollection === 'saved' ? Plus : Check;
    return <div>
      <div className='film-actions film-actions-watchlist'>
        <Button disabled={isBusy} type='button' variant='outline' onClick={() => toggle(movie, destination)} aria-label={`${moveLabel}: ${movie.title}`}>
          <MoveIcon size={18} className='size-[18px]' aria-hidden='true' />{moveLabel}
        </Button>
        <Button disabled={isBusy} type='button' variant='outline' className={inCollection ? 'film-remove' : undefined} aria-pressed={inCollection} onClick={() => toggle(movie, watchlistCollection)} aria-label={inCollection ? `Remove ${movie.title} from ${watchlistCollection === 'saved' ? 'watchlist' : 'watched'}` : `${restoreLabel}: ${movie.title}`}>
          {inCollection ? <Trash2 size={18} className='size-[18px]' aria-hidden='true' /> : <RestoreIcon size={18} className='size-[18px]' aria-hidden='true' />}{inCollection ? 'Remove' : restoreLabel}
        </Button>
      </div>
      {storageError && <div role='alert' className='mt-2 text-sm text-destructive'>{storageError}</div>}
    </div>;
  }
  return (
    <div>
      <div className={`film-actions${allowMarkWatched ? ' film-actions-watchlist' : ''}`}>
        <Button disabled={isBusy} type='button' variant={showSaveLabel ? 'outline' : 'ghost'} size={showSaveLabel ? 'default' : 'icon-lg'} className={showSaveLabel ? 'film-bookmark-label' : 'film-bookmark'} title={isSaved ? 'Remove from watchlist' : 'Add to watchlist'} aria-pressed={isSaved} onClick={() => toggle(movie, 'saved')} aria-label={isSaved ? `Remove ${movie.title} from watchlist` : `Add ${movie.title} to watchlist`}>
          {isSaved ? <Bookmark size={18} className='size-[18px]' fill='currentColor' aria-hidden='true' /> : <Plus size={18} className='size-[18px]' aria-hidden='true' />}
          {showSaveLabel && (isSaved ? 'Saved' : 'Add to watchlist')}
        </Button>
        {allowMarkWatched && <Button disabled={isBusy} type='button' variant='outline' aria-pressed={isWatched} onClick={() => toggle(movie, 'watched')} aria-label={isWatched ? `Mark ${movie.title} as unwatched` : `Mark ${movie.title} as watched`}>
          <Check size={18} className='size-[18px]' aria-hidden='true' />{isWatched ? 'Watched' : 'Mark as watched'}
        </Button>}
      </div>
      {storageError && <div role='alert' className='mt-2 text-sm text-destructive'>{storageError}</div>}
    </div>
  );
}
