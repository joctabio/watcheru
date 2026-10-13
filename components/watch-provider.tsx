'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { WatchProvider } from '@/app/definitions';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export default function WatchProviderBadge({ provider, logoOnly = false }: { provider: WatchProvider; logoOnly?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasLogo = Boolean(provider.logo_path) && !imageFailed;
  const initials = provider.provider_name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

  return (
    <div className='provider-badge'>
      <Popover>
        <PopoverTrigger asChild>
          <button type='button' className='provider-logo-trigger' aria-label={provider.provider_name}>
            <span className={`provider-logo${hasLogo ? '' : ' provider-monogram'}`} aria-hidden='true'>
              {hasLogo ? <Image
                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                alt=''
                width={44}
                height={44}
                sizes='44px'
                onError={() => setImageFailed(true)}
              /> : <span>{initials || '?'}</span>}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side='top'
          sideOffset={8}
          className='w-auto max-w-64 px-3 py-2 text-sm'
          aria-label={provider.provider_name}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {provider.provider_name}
        </PopoverContent>
      </Popover>
      {!logoOnly && <span className='provider-name'>{provider.provider_name}</span>}
    </div>
  );
}
