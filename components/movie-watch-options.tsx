'use client';

import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import type { WatchAvailability } from '@/app/definitions';
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

export default function MovieWatchOptions({ movieId }: { movieId: number }) {
  const id = useId();
  const [region, setRegion] = useState('PH');
  const providers = useQuery({ queryKey: ['providers', String(movieId)], queryFn: () => fetchMovieProviders(String(movieId)) });
  const availability = providers.data?.[region];
  const groups = categories.filter(([key]) => availability?.[key]?.length);

  return (
    <section className='movie-watch-options' aria-labelledby={`${id}-heading`}>
      <div className='watch-options-heading'>
        <h2 id={`${id}-heading`}>Where to watch</h2>
        <label className='watch-region' htmlFor={`${id}-region`}>Region
          <select id={`${id}-region`} value={region} onChange={(event) => setRegion(event.target.value)} className='cinema-field'>
            {regions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
      </div>
      {providers.isPending && <div className='watch-options-status' role='status'><Spinner size={16} aria-hidden />Loading watch options…</div>}
      {providers.error && <RequestError error={providers.error} isRetrying={providers.isFetching} onRetry={() => { void providers.refetch(); }} />}
      {providers.data && groups.length === 0 && <p className='watch-options-status' role='status'>No availability is listed for this region. Try another region.</p>}
      <div className='watch-options-groups'>
        {groups.map(([key, label]) => <div key={key} className='watch-provider'>
          <h3 className='provider-category'>{label}</h3>
          <ul className='provider-list'>
            {availability?.[key]?.map((provider) => <li key={`${provider.provider_id}-${provider.logo_path}`}>
              <WatchProviderBadge provider={provider} />
            </li>)}
          </ul>
        </div>)}
      </div>
      {availability?.link && (
        <Button className='mt-6' variant='outline' asChild><a href={availability.link} target='_blank' rel='noopener noreferrer'>See watch options on TMDB<ArrowUpRight size={13} aria-hidden='true' /></a></Button>
      )}
      <p className='watch-options-credit'>Availability from JustWatch via TMDB. Availability and prices may change.</p>
    </section>
  );
}
