'use client';

import { useState } from 'react';
import { Film } from 'lucide-react';
import Image from 'next/image';

const loadedPosters = new Set<string>();

export default function MoviePoster({ path, title }: { path: string | null; title: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(() => path && loadedPosters.has(path) ? 'ready' : 'loading');

  return (
    <div className='feature-poster' data-poster-state={path ? status : 'missing'}>
      {path && status !== 'error' ? <>
        {status === 'loading' && <div className='poster-loading skeleton-surface' aria-hidden='true' />}
        <Image
          src={`https://image.tmdb.org/t/p/w500${path}`}
          alt={`${title} poster`}
          width={300}
          height={450}
          sizes='(max-width: 767px) 260px, (max-width: 1023px) 280px, 320px'
          loading='eager'
          fetchPriority='high'
          decoding='async'
          className='poster-image'
          onLoad={() => { if (path) loadedPosters.add(path); setStatus('ready'); }}
          onError={() => setStatus('error')}
        />
      </> : <div className='poster-placeholder'>
        <Film size={32} strokeWidth={1} aria-hidden='true' />
        <span>No poster available</span>
      </div>}
    </div>
  );
}
