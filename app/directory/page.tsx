import { Suspense } from 'react';
import SearchResults from './search-results';

export default function Home() {
  return (
    <Suspense>
      <div className='flex flex-col gap-4 pt-[68px]'>
        <SearchResults />
      </div>
    </Suspense>
  );
}
