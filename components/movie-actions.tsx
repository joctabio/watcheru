'use client';

import type { Movie } from '@/app/definitions';
import { useMovieLibrary } from '@/lib/use-movie-library';
import { Bookmark, Check, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export default function MovieActions({ movie, detailsHref }: { movie: Movie; detailsHref?: string }) {
  const { saved, watched, toggle, storageError } = useMovieLibrary();
  const isSaved = saved.some((item) => item.id === movie.id);
  const isWatched = watched.some((item) => item.id === movie.id);
  return (
    <div>
      <div className='film-actions'>
        <Button type='button' variant='outline' aria-pressed={isSaved} onClick={() => toggle(movie, 'saved')} aria-label={isSaved ? `Remove ${movie.title} from saved movies` : `Save ${movie.title} for later`}>
          <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />{isSaved ? 'Saved' : 'Save for later'}
        </Button>
        <Button type='button' variant='ghost' aria-pressed={isWatched} onClick={() => toggle(movie, 'watched')} aria-label={isWatched ? `Mark ${movie.title} as unwatched` : `Mark ${movie.title} as watched`}>
          <Check size={14} />{isWatched ? 'Watched' : 'Mark as watched'}
        </Button>
        {detailsHref && <Button variant='ghost' className='film-more-info' asChild>
          <Link href={detailsHref}><Info size={16} aria-hidden='true' />More info</Link>
        </Button>}
      </div>
      {storageError && <div role='alert' className='mt-2 text-sm text-destructive'>{storageError}</div>}
    </div>
  );
}
