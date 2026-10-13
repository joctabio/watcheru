'use client';

import { ArrowUpRight } from 'lucide-react';
import { IconBrandYoutubeFilled } from '@tabler/icons-react';
import type { MovieDetails } from '@/app/definitions';
import { Button } from './ui/button';
import MovieWatchOptions from './movie-watch-options';

export default function MovieExtras({ movie }: { movie: MovieDetails }) {
  const trailers = movie.videos?.results.filter((video) => video.site === 'YouTube' && video.type === 'Trailer') ?? [];
  const trailer = trailers.find((video) => video.official) ?? trailers[0];
  const cast = movie.credits?.cast.slice(0, 6) ?? [];

  return (
    <div className='film-extras movie-extras-reveal' key={movie.id}>
      {(cast.length > 0 || trailer) && (
        <section>
          {cast.length > 0 && <>
            <h2>Cast</h2>
            <ul className='cast-list'>{cast.map((person) => <li key={person.id}><strong>{person.name}</strong><span>{person.character}</span></li>)}</ul>
          </>}
          {trailer && <Button variant='outline' className='mt-6' asChild><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}`} target='_blank' rel='noopener noreferrer' aria-label={`Watch ${movie.title} trailer on YouTube (opens in a new tab)`} title='Watch on YouTube'><IconBrandYoutubeFilled className='size-6 youtube-logo' aria-hidden='true' />Watch trailer<ArrowUpRight size={13} aria-hidden='true' /></a></Button>}
        </section>
      )}
      <MovieWatchOptions key={movie.id} movieId={movie.id} />
    </div>
  );
}
