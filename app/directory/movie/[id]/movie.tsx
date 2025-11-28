'use client';

import { fetchMovieById } from '@/app/queries';
import { Button } from '@/components/ui/button';
import { Item, ItemTitle } from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function Movie({ id }: { id: string }) {
  const { data, isFetching } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => fetchMovieById(id)
  });

  if (isFetching) {
    return <Spinner />;
  }

  return (
    <div>
      <div>
        <Link href='/'>Back</Link>
      </div>
      <div className='flex items-center'>
        <div className='flex flex-col p-6 justify-start'>
          <h1 className='text-left'>{data.Title}</h1>
          <div className='flex text-muted-foreground font-medium text-sm gap-2'>
            <span>{data.Year}</span>
            <span>&bull;</span>
            <span>{data.Rated}</span>
            <span>&bull;</span>
            <span>{data.Runtime}</span>
          </div>
        </div>
        <div className='flex'>
          <div>{data.imdbRating}/10</div>
        </div>
      </div>
    </div>
  );
}
