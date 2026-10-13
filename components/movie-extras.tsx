'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { IconBrandYoutubeFilled } from '@tabler/icons-react';
import type { MovieDetails, WatchAvailability } from '@/app/definitions';
import { fetchMovieProviders } from '@/app/queries';
import { Button } from './ui/button';
import RequestError from './request-error';
import { Spinner } from './ui/spinner';
import WatchProviderBadge from './watch-provider';

const regions = [
  ['PH', 'Philippines'], ['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'],
  ['AU', 'Australia'], ['JP', 'Japan'], ['KR', 'South Korea'], ['IN', 'India'],
  ['FR', 'France'], ['DE', 'Germany'], ['ES', 'Spain']
];
const categories: Array<[keyof Omit<WatchAvailability, 'link'>, string]> = [
  ['flatrate', 'Subscription'], ['free', 'Free'], ['ads', 'With ads'], ['rent', 'Rent'], ['buy', 'Buy']
];

export default function MovieExtras({ movie }: { movie: MovieDetails }) {
  const [region, setRegion] = useState('PH');
  const providers = useQuery({ queryKey: ['providers', String(movie.id)], queryFn: () => fetchMovieProviders(String(movie.id)) });
  const availability = providers.data?.[region];
  const groups = categories.filter(([key]) => availability?.[key]?.length);
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
      <section>
        <h2>Where to watch</h2>
        <label className='mb-4 flex items-center gap-3 text-sm text-muted-foreground'>Region
          <select value={region} onChange={(event) => setRegion(event.target.value)} className='cinema-field max-w-52'>
            {regions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        {providers.isPending && <div className='flex items-center gap-2 text-sm text-muted-foreground' role='status'><Spinner size={18} aria-hidden />Loading watch options…</div>}
        {providers.error && <RequestError error={providers.error} isRetrying={providers.isFetching} onRetry={() => { void providers.refetch(); }} />}
        {providers.data && groups.length === 0 && <p role='status' className='text-base text-muted-foreground'>No availability is listed for this region. Try another region.</p>}
        {groups.map(([key, label]) => <div key={key} className='watch-provider'>
          <h3 className='provider-category'>{label}</h3>
          <ul className='provider-list'>
            {availability?.[key]?.map((provider) => <li key={`${provider.provider_id}-${provider.logo_path}`}>
              <WatchProviderBadge provider={provider} />
            </li>)}
          </ul>
        </div>)}
        {availability?.link && <Button className='mt-6' variant='outline' asChild><a href={availability.link} target='_blank' rel='noopener noreferrer'>See watch options on TMDB<ArrowUpRight size={13} /></a></Button>}
        <p className='mt-5 text-sm leading-relaxed text-muted-foreground'>Availability from JustWatch via TMDB. Availability and prices may change.</p>
      </section>
    </div>
  );
}
