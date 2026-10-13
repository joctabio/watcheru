import { Suspense } from 'react';
import SearchResults from './search-results';
import Loading from './loading';

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <main>
        <SearchResults />
      </main>
    </Suspense>
  );
}
