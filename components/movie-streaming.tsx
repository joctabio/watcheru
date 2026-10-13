'use client';

import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMovieProviders } from '@/app/queries';
import { Spinner } from './ui/spinner';
import { Button } from './ui/button';
import WatchProviderBadge from './watch-provider';
import { getStreamingPlatforms } from '@/lib/streaming-providers';

export default function MovieStreaming({ movieId }: { movieId: number }) {
  const id = useId();
  const providers = useQuery({ queryKey: ['providers', String(movieId)], queryFn: () => fetchMovieProviders(String(movieId)) });
  const platforms = getStreamingPlatforms(providers.data ?? {});

  return (
    <section className='movie-streaming' aria-labelledby={id} title='Streaming platforms across all regions'>
      <h2 id={id}>{platforms.length > 0 ? 'Watch On' : 'Streaming availability'}<span className='sr-only'> across all regions</span></h2>
      {providers.isPending && <div className='streaming-status' role='status'><Spinner size={14} aria-hidden />Checking availability…</div>}
      {providers.error && <div className='streaming-status' role='alert'>
        <span>Streaming availability could not be loaded.</span>
        <Button type='button' variant='ghost' size='sm' disabled={providers.isFetching} onClick={() => { void providers.refetch(); }}>Retry</Button>
      </div>}
      {providers.data && platforms.length === 0 && <p className='streaming-status' role='status'>No streaming options listed. Check More info for other watch options.</p>}
      {platforms.length > 0 && <ul className='streaming-logos'>
        {platforms.map((provider) => <li key={`${provider.provider_id}-${provider.logo_path}`}>
          <WatchProviderBadge provider={provider} logoOnly />
        </li>)}
      </ul>}
    </section>
  );
}
