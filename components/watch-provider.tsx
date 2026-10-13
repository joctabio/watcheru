'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { WatchProvider } from '@/app/definitions';

export default function WatchProviderBadge({ provider }: { provider: WatchProvider }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasLogo = Boolean(provider.logo_path) && !imageFailed;
  const initials = provider.provider_name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

  return (
    <div className='provider-badge'>
      <div className={`provider-logo${hasLogo ? '' : ' provider-monogram'}`} aria-hidden='true'>
        {hasLogo ? <Image
          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
          alt=''
          width={44}
          height={44}
          sizes='44px'
          onError={() => setImageFailed(true)}
        /> : <span>{initials || '?'}</span>}
      </div>
      <span className='provider-name'>{provider.provider_name}</span>
    </div>
  );
}
