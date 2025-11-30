'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { fetchMoviesByTitle } from '../queries';
import { Spinner } from '@/components/ui/spinner';
import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { IconLayoutGrid, IconList } from '@tabler/icons-react';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle
} from '@/components/ui/item';
import { Movie } from '../definitions';
import Link from 'next/link';
import Image from 'next/image';
import SpinnerMirage from '@/components/ui/spinner-mirage';

export default function SearchResults() {
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
        <SpinnerMirage size={'120'} />
      </div>
    );
  }

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <div className='w-full px-6 py-4 flex flex-col gap-4'>
      <div className='flex align-middle justify-between'>
        <h4>Showing results for &quot;{searchText}&quot;</h4>
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
        className={`${
          layoutMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6'
            : ''
        } gap-4`}
      >
        {data?.results?.map((movie: Movie) => (
          <Item key={movie.id} variant='default' className='p-0' asChild>
            <Link href={`/directory/${movie.id}`} title={movie.title}>
              <ItemHeader>
                <Image
                  src={
                    movie.poster_path !== 'N/A'
                      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                      : '/no-image-available.png'
                  }
                  alt={`${movie.title} Poster`}
                  width={200}
                  height={300}
                  className={'object-cover aspect-auto w-full rounded-sm'}
                />
              </ItemHeader>
              <ItemContent>
                <ItemTitle>{movie.title}</ItemTitle>
                <ItemDescription>
                  {movie.release_date.split('-')[0]}
                </ItemDescription>
              </ItemContent>
            </Link>
          </Item>
        )) || <p>No results found.</p>}
      </ItemGroup>
    </div>
  );
}
