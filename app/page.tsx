'use client';

import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchMovieGenres, fetchRandomMovie } from './queries';
import { Suspense, useCallback } from 'react';
import { IconArrowRightDashed } from '@tabler/icons-react';
import Header from '@/components/header';
import SpinnerMirage from '@/components/ui/spinner-mirage';
import MovieDisplay from '@/components/movie-display';

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
                genres={genresData}
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
