'use client';

import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchMovieGenres, fetchRandomMovie } from './queries';
import { Spinner } from '@/components/ui/spinner';
import { Suspense, useCallback } from 'react';
import Image from 'next/image';
import { Genres, Movie } from './definitions';
import {
  IconArrowRightDashed,
  IconArrowsShuffle,
  IconStarFilled,
  IconTrendingUp,
  IconUsersGroup
} from '@tabler/icons-react';
import Header from '@/components/header';
import { Badge } from '@/components/ui/badge';
import SpinnerMirage from '@/components/ui/spinner-mirage';

export default function Home() {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['random-movie'],
    queryFn: fetchRandomMovie,
    enabled: false
  });

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => fetchMovieGenres()
  });

  const handleRandomMovieClick = useCallback(() => {
    refetch();
  }, [refetch]);

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <Suspense>
      <div
        className={`flex flex-col ${
          !data ? 'h-full' : ''
        } sm:h-screen w-full justify-center sm:justify-between gap-5 relative z-10`}
      >
        <Header />
        <div
          className={
            'h-full sm:h-screen flex flex-col items-center justify-center px-10 pt-[108px] sm:pt-10 pb-10 sm:mt-[68px] gap-4'
          }
        >
          {isFetching ? (
            <SpinnerMirage size={'120'} />
          ) : !data ? (
            <>
              <SplashScreen />
              <div
                className={`flex justify-center items-center gap-5 flex-col sm:flex-row`}
              >
                <Button
                  onClick={handleRandomMovieClick}
                  variant={'outline'}
                  disabled={isFetching}
                  className={'flex items-center justify-center'}
                  title={'This is your SOS button for indecision.'}
                  size={'lg'}
                >
                  <IconArrowRightDashed />
                  Start
                </Button>
              </div>
            </>
          ) : (
            <>
              <MovieDisplay
                data={data}
                genres={genresData?.genres || []}
                loading={isFetching}
              />
              <div
                className={`flex justify-center items-center gap-5 flex-col sm:flex-row`}
              >
                <Button
                  onClick={handleRandomMovieClick}
                  variant={'outline'}
                  disabled={isFetching}
                  className={'flex items-center justify-center'}
                  title={'This is your SOS button for indecision.'}
                  size={'lg'}
                >
                  Skip <IconArrowRightDashed />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Suspense>
  );
}

function SplashScreen() {
  return (
    <div className={`flex flex-col justify-center items-center`}>
      <h1
        className={
          'text-4xl sm:text-5xl lg:text-6xl text-center max-w-md sm:max-w-xl lg:max-w-2xl'
        }
      >
        Can&apos;t decide what to watch?
      </h1>
      <p className={'text-muted-foreground text-center'}>
        Put the remote down and let chaos decide.
      </p>
    </div>
  );
}

function MovieDisplay({
  data,
  genres,
  loading
}: {
  data: Movie;
  genres: Genres;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className={'flex flex-1 items-center justify-center gap-3 mb-10'}>
        <SpinnerMirage size={'120'} />
      </div>
    );
  }

  return (
    <div className={'flex flex-1 items-center justify-center'}>
      <div className='flex flex-col items-start gap-10 sm:flex-row'>
        {data.poster_path && (
          <Image
            src={`https://image.tmdb.org/t/p/w200${data.poster_path}`}
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
          {genres.length && (
            <div className={'flex gap-1'}>
              {data.genre_ids.map((id) => {
                const genre = genres.find((genre) => genre.id === id);
                return (
                  <Badge key={genre?.id} variant={'secondary'}>
                    {genre?.name}
                  </Badge>
                );
              })}
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
