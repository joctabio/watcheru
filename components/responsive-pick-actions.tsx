'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const mobileQuery = '(max-width: 767px)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(mobileQuery).matches;
}

function getServerSnapshot() {
  return false;
}

export default function ResponsivePickActions({ children }: { children: ReactNode }) {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep viewport controls outside ancestors whose reveal transforms can
  // make fixed-position children scroll with the page on mobile browsers.
  return isMobile
    ? createPortal(<div className='mobile-pick-footer'>{children}</div>, document.body)
    : children;
}
