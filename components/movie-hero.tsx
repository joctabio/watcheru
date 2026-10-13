import type { Genre, Movie } from '@/app/definitions';
import { Star } from 'lucide-react';
import Image from 'next/image';
import MovieActions from './movie-actions';
import MoviePoster from './movie-poster';

export default function MovieHero({ movie, genres, runtime, detailsHref, variant = 'card' }: {
  movie: Movie;
  genres: Genre[];
  runtime?: number | null;
  detailsHref?: string;
  variant?: 'card' | 'detail';
}) {
  return (
    <article className={`${variant === 'detail' ? 'feature-details' : 'feature-presentation'} movie-reveal`} key={movie.id}>
      {variant === 'card' && movie.backdrop_path && <Image src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`} alt='' fill sizes='1080px' className='feature-backdrop' aria-hidden='true' />}
      <div className='feature-content'>
        <MoviePoster key={movie.poster_path} path={movie.poster_path} title={movie.title} />
        <div className='feature-copy'>
          <h1>{movie.title}</h1>
          <div className='film-meta'>
            <span>{movie.release_date?.split('-')[0] || 'Release date unknown'}</span>
            {runtime != null && runtime > 0 && <span>{runtime} minutes</span>}
            <span>{movie.original_language.toUpperCase()}</span>
          </div>
          {genres.length > 0 && <div className='film-genres'>{genres.map((genre) => <span className='genre-badge' key={genre.id}>{genre.name}</span>)}</div>}
          <div className='film-synopsis' role='region' aria-label='Movie synopsis' tabIndex={0}>
            <p>{movie.overview || 'No synopsis available.'}</p>
          </div>
          <div className='film-stats'>
            <div className='film-stat'>
              <strong><Star size={16} className='text-primary' fill='currentColor' aria-hidden='true' />{movie.vote_count ? movie.vote_average.toFixed(1) : '—'}</strong>
              <span>{movie.vote_count ? 'Audience rating / 10' : 'Not yet rated'}</span>
            </div>
            <div className='film-stat'><strong>{movie.vote_count.toLocaleString('en')}</strong><span>Audience votes</span></div>
            <div className='film-stat'><strong>{movie.popularity.toFixed(0)}</strong><span>Popularity</span></div>
          </div>
          <div className='film-actions-reveal'><MovieActions movie={movie} detailsHref={detailsHref} /></div>
        </div>
      </div>
    </article>
  );
}
