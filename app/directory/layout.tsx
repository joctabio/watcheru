import Header from '@/components/header';
import CinemaHeaderFallback from '@/components/cinema-header-fallback';
import { Suspense } from 'react';

export default function DirectoryLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<CinemaHeaderFallback />}><Header /></Suspense>
      {children}
    </>
  );
}
