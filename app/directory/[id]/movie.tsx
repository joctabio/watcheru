'use client';

import { Genre, Movie } from '@/app/definitions';
import SpinnerMirage from '@/components/ui/spinner-mirage';
import { Badge } from '@/components/ui/badge';
import {
  IconStarFilled,
  IconTrendingUp,
  IconUsersGroup
} from '@tabler/icons-react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { fetchMovieById, fetchMovieGenres } from '@/app/queries';

export default function MovieDisplay({ id }: { id: string }) {
  const { data, isFetching, error } = useQuery<Movie>({
    queryKey: ['movie', id],
    queryFn: () => fetchMovieById(id)
  });

  const { data: genres } = useQuery<Array<Genre>>({
    queryKey: ['genres'],
    queryFn: () => fetchMovieGenres()
  });

  if (isFetching) {
    return (
      <div className={'flex flex-1 items-center justify-center gap-3 mb-10'}>
        <SpinnerMirage size={'120'} />
      </div>
    );
  }

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  if (!data) return <div>No data found.</div>;

  return (
    <div className={'flex flex-1 items-center justify-center'}>
      <div className='flex flex-col items-start gap-10 sm:flex-row'>
        {data.poster_path && (
          <Image
            src={`https://image.tmdb.org/t/p/w400${data.poster_path}`}
            alt={data.title}
            width={300}
            height={400}
            loading='eager'
            priority
            className='flex-1 rounded-md shadow-lg w-full sm:w-[300px]'
          />
        )}

        <div className={'flex flex-1 flex-col gap-2 sm:mt-6'}>
          <Badge variant='outline'>
            {data.original_language.toUpperCase()}
          </Badge>
          <h1 className='text-left text-wrap max-w-md'>{data.title}</h1>
          <div className='flex gap-2 text-sm text-muted-foreground font-medium'>
            <span>{data.release_date?.split('-')[0]}</span>
            <span>&bull;</span>
            <span className={'flex items-center gap-1'}>
              <IconStarFilled size={14} color={'#f5c518'} />
              <span>{data.vote_average.toFixed(1)}/10</span>
            </span>
          </div>
          <p className='text-sm max-w-md mb-5 text-wrap'>{data.overview}</p>
          {genres?.length && (
            <div className={'flex gap-1'}>
              {data.genres.map((genre) => (
                <Badge key={genre?.id} variant={'secondary'}>
                  {genre?.name}
                </Badge>
              ))}
            </div>
          )}
          <div className={'flex items-center gap-2 text-sm font-bold mt-6'}>
            <IconTrendingUp size={16} color={'green'} />{' '}
            {data.popularity.toFixed(1)}{' '}
            <span className={'font-normal'}>Popularity Score</span>
          </div>
          <div className={'flex items-center gap-2 text-sm font-bold'}>
            <IconUsersGroup size={16} /> {data.vote_count.toLocaleString('en')}
            <span className={'font-normal'}>Reviews</span>
          </div>
        </div>
      </div>
    </div>
  );
}
