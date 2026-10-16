import type { Genre, Movie } from '@/app/definitions';
import { Info, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import MovieActions from './movie-actions';
import MoviePoster from './movie-poster';

export default function MovieHero({ movie, genres, runtime, detailsHref, onMoreInfo, variant = 'card' }: {
  movie: Movie;
  genres: Genre[];
  runtime?: number | null;
  detailsHref?: string;
  onMoreInfo?: () => void;
  variant?: 'card' | 'detail';
}) {
  return (
    <article className={`${variant === 'detail' ? 'feature-details' : 'feature-presentation'} movie-reveal`} key={movie.id}>
      {variant === 'card' && movie.backdrop_path && <Image src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`} alt='' fill sizes='1080px' className='feature-backdrop' aria-hidden='true' />}
      <div className='feature-content'>
        <div className='feature-poster-column'>
          <MoviePoster key={movie.poster_path} path={movie.poster_path} title={movie.title} />
        </div>
        <div className='feature-copy'>
          <div className='film-heading'>
            <h1>{movie.title}</h1>
          </div>
          <div className='film-meta'>
            <span>{movie.release_date?.split('-')[0] || 'Release date unknown'}</span>
            {runtime != null && runtime > 0 && <span>{runtime >= 60 ? `${Math.floor(runtime / 60)}h ` : ''}{runtime % 60}m</span>}
            <span>{movie.original_language.toUpperCase()}</span>
          </div>
          {genres.length > 0 && <div className='film-genres'>{genres.map((genre) => <span className='genre-badge' key={genre.id}>{genre.name}</span>)}</div>}
          <div className='film-synopsis' role='region' aria-label='Movie synopsis' tabIndex={0}>
            <p>{movie.overview || 'No synopsis available.'}</p>
          </div>
          <div className='film-summary'>
            <div className='film-stats'>
              <div className='film-stat'>
                <strong><Star size={16} className='rating-star' fill='currentColor' aria-hidden='true' />{movie.vote_count ? movie.vote_average.toFixed(1) : '—'}</strong>
                <span>Rating</span>
              </div>
              <div className='film-stat'><strong>{movie.vote_count.toLocaleString('en')}</strong><span>Audience votes</span></div>
              <div className='film-stat'><strong>{movie.popularity.toFixed(0)}</strong><span>Popularity</span></div>
            </div>
            <div className='film-result-actions film-actions-reveal'>
              <MovieActions movie={movie} showSaveLabel allowMarkWatched />
              {variant === 'card' && detailsHref && <Button variant='outline' className='film-more-info' asChild>
                <Link href={detailsHref} prefetch onNavigate={onMoreInfo}><Info size={16} aria-hidden='true' />More info</Link>
              </Button>}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
