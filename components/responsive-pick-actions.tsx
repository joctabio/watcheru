'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { subscribeToMobileKeyboard } from '@/lib/mobile-keyboard';

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

export default function ResponsivePickActions({ children, sticky }: { children: ReactNode; sticky: boolean }) {
  const isMobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (isMobile && sticky) return subscribeToMobileKeyboard(setKeyboardOpen);
  }, [isMobile, sticky]);

  // Keep viewport controls outside ancestors whose reveal transforms can
  // make fixed-position children scroll with the page on mobile browsers.
  return isMobile && sticky
    ? createPortal(
      <div className='mobile-pick-footer' data-keyboard-open={keyboardOpen} aria-hidden={keyboardOpen} inert={keyboardOpen}>
        {children}
      </div>,
      document.body
    )
    : children;
}
