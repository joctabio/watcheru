'use client';

import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchRandomMovie } from './queries';
import { Spinner } from '@/components/ui/spinner';
import { useCallback } from 'react';
import Image from 'next/image';
import { Movie } from './definitions';
import { IconArrowRightDashed } from '@tabler/icons-react';
import Header from '@/components/header';

export default function Home() {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['random-movie'],
    queryFn: fetchRandomMovie,
    enabled: false
  });

  const handleRandomMovieClick = useCallback(() => {
    refetch();
  }, [refetch]);

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <div className='flex flex-col h-screen w-full justify-between gap-5 relative z-10'>
      <Header />
      <div className={'h-screen flex flex-col justify-between p-10 mt-[68px]'}>
        {!data ? <SplashScreen /> : <MovieDisplay data={data} />}
        <div className={'flex justify-end items-center gap-5'}>
          {!data && (
            <span className={'text-sm text-muted-foreground'}>
              Put the remote down now and let chaos decide
            </span>
          )}
          <Button
            onClick={handleRandomMovieClick}
            variant={'outline'}
            disabled={isFetching}
            className={'flex items-center justify-center'}
            title={'This is your SOS button for indecision.'}
          >
            {isFetching ? (
              <>
                <Spinner />
              </>
            ) : (
              <>
                <IconArrowRightDashed />
                {!data ? 'Generate' : 'Skip'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className={'flex-1 flex flex-col justify-start'}>
      <h1 className={'text-8xl text-left max-w-5xl'}>
        Can&apos;t decide what to watch?
        <br />
      </h1>
    </div>
  );
}

function MovieDisplay({ data }: { data: Movie }) {
  return (
    <div className='flex items-start gap-10 max-w-5xl mx-auto'>
      {data.poster_path && (
        <Image
          src={`https://image.tmdb.org/t/p/w200${data.poster_path}`}
          alt={data.title}
          width={300}
          height={400}
          objectFit='cover'
          loading='eager'
          priority
          className='rounded-md shadow-lg'
        />
      )}

      <div className={'flex flex-col gap-2 mt-10'}>
        <h1 className='text-left text-wrap'>{data.title}</h1>
        <div className='flex gap-2 text-sm text-muted-foreground'>
          <span>{data.release_date?.split('-')[0]}</span>
          <span>&bull;</span>
          <span>Rating: {data.vote_average}/10</span>
        </div>
        <p className='text-sm'>{data.overview}</p>
      </div>
    </div>
  );
}
