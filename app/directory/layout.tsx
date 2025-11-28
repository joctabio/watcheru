import Header from '@/components/header';
import { Suspense } from 'react';

export default function DirectoryLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <div>
        <Header />
        {children}
      </div>
    </Suspense>
  );
}
