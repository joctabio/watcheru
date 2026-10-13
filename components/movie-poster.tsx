'use client';

import { useState } from 'react';
import { Film } from 'lucide-react';
import Image from 'next/image';

export default function MoviePoster({ path, title }: { path: string | null; title: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  return (
    <div className='feature-poster' data-poster-state={path ? status : 'missing'}>
      {path && status !== 'error' ? <>
        {status === 'loading' && <div className='poster-loading skeleton-surface' aria-hidden='true' />}
        <Image
          src={`https://image.tmdb.org/t/p/w500${path}`}
          alt={`${title} poster`}
          width={300}
          height={450}
          sizes='(max-width: 767px) 220px, (max-width: 1023px) 220px, 280px'
          loading='eager'
          fetchPriority='high'
          decoding='async'
          className='poster-image'
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('error')}
        />
      </> : <div className='poster-placeholder'>
        <Film size={32} strokeWidth={1} aria-hidden='true' />
        <span>No poster available</span>
      </div>}
    </div>
  );
}
