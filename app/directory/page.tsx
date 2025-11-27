'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { IconLayoutGrid, IconList } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { fetchMoviesByTitle } from '@/app/queries';
import { useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { Movie } from '@/app/definitions';
import Image from 'next/image';
import { useState } from 'react';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle
} from '@/components/ui/item';
import Link from 'next/link';

export default function Home() {
  return (
    <div className='flex flex-col gap-4'>
      <SearchResults />
    </div>
  );
}

function SearchResults() {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const searchParams = useSearchParams();
  const searchText = searchParams.get('search');

  const { isFetching, data, error } = useQuery({
    queryKey: ['movies', searchText],
    queryFn: () => fetchMoviesByTitle(searchText || ''),
    enabled: !!searchText
  });

  if (!searchText) {
    return null;
  }

  if (isFetching) {
    return (
      <div className='flex w-full items-center justify-center h-[500px]'>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  console.log('data', data);

  return (
    <div className='max-w-xl mx-auto w-full px-6 py-4 flex flex-col gap-4'>
      <div className='flex align-middle justify-between'>
        <h4>Search Results</h4>
        <ButtonGroup>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setLayoutMode('grid')}
            title='Grid View'
          >
            <IconLayoutGrid />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setLayoutMode('list')}
            title='List View'
          >
            <IconList />
          </Button>
        </ButtonGroup>
      </div>

      <ItemGroup
        className={`${layoutMode === 'grid' ? 'grid grid-cols-3' : ''} gap-4`}
      >
        {data?.Search?.map((movie: Movie) => (
          <Item key={movie.imdbID} variant='outline' className='p-0' asChild>
            <Link href={`/movie/${movie.imdbID}`} title={movie.Title}>
              {/* {movie.Poster !== 'N/A' && ( */}
              <ItemHeader>
                <Image
                  src={
                    movie.Poster !== 'N/A'
                      ? movie.Poster
                      : '/no-image-available.png'
                  }
                  alt={`${movie.Title} Poster`}
                  width={128}
                  height={250}
                  className={'object-cover aspect-auto w-full rounded-sm'}
                />
              </ItemHeader>
              {/* )} */}
              <ItemContent>
                <ItemTitle>{movie.Title}</ItemTitle>
                <ItemDescription>{movie.Year}</ItemDescription>
              </ItemContent>
            </Link>
          </Item>
        )) || <p>No results found.</p>}
      </ItemGroup>
    </div>
  );
}
