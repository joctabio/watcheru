import type { Movie } from '@/app/definitions';
import { ArrowUpRight, Film, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import MovieActions from './movie-actions';
import { movieDetailsHref } from '@/lib/movie-navigation';

export default function MovieList({ movies, layout = 'grid', showActions = false, allowMarkWatched = false, watchlistCollection, returnTo }: {
  movies: Movie[];
  layout?: 'grid' | 'list';
  showActions?: boolean;
  allowMarkWatched?: boolean;
  watchlistCollection?: 'saved' | 'watched';
  returnTo?: string;
}) {
  const list = layout === 'list';
  return (
    <ul className={list ? 'movie-rows' : 'movie-grid'}>
      {movies.map((movie) => (
        <li key={movie.id}>
          <Link href={movieDetailsHref(movie.id, returnTo)} className='poster-card'>
            <div className='poster-art'>
              {movie.poster_path ? (
                <Image src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt={`${movie.title} poster`} width={200} height={300} sizes={list ? '96px' : '(max-width: 479px) 43vw, (max-width: 767px) 28vw, (max-width: 1023px) 21vw, 220px'} />
              ) : <div className='poster-placeholder'><Film size={24} strokeWidth={1} /><span>No poster</span></div>}
              {!list && movie.vote_count > 0 && <span className='poster-rating'><Star size={9} className='rating-star' fill='currentColor' aria-hidden='true' />{movie.vote_average.toFixed(1)}</span>}
              {!list && <span className='poster-hover'>View details<ArrowUpRight size={14} /></span>}
            </div>
            <div className='poster-info'>
              <h2 className='poster-title'>{movie.title}</h2>
              <div className='poster-meta'>
                <span>{movie.release_date?.split('-')[0] || 'Release date unknown'}</span>
                <span className='text-primary' aria-hidden='true'>·</span><span>{movie.original_language.toUpperCase()}</span>
                {list && <><span className='text-primary' aria-hidden='true'>·</span><span>{movie.vote_count ? `${movie.vote_average.toFixed(1)} / 10` : 'Not rated'}</span></>}
              </div>
              {list && <p className='poster-description line-clamp-3'>{movie.overview || 'No synopsis available.'}</p>}
            </div>
          </Link>
          {showActions && <MovieActions movie={movie} allowMarkWatched={allowMarkWatched} watchlistCollection={watchlistCollection} />}
        </li>
      ))}
    </ul>
  );
}
