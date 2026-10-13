'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import CinemaBrand from './cinema-brand';
import { getMovieReturnDestination } from '@/lib/movie-navigation';
import { Button } from './ui/button';

const formSchema = z.object({ searchText: z.string().trim().min(1, 'Enter a movie title.') });

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const searchId = useId();
  const errorId = `${searchId}-error`;
  const searchText = searchParams.get('search') ?? getMovieReturnDestination(searchParams.get('from')).search;
  const { register, handleSubmit, reset, setFocus, clearErrors, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { searchText: searchText || '' }
  });

  useEffect(() => { reset({ searchText: searchText || '' }); }, [searchText, reset]);

  useEffect(() => {
    if (!searchOpen) {
      clearErrors();
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !searchRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSearchOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [searchOpen, clearErrors]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setSearchOpen(false);
    toggleRef.current?.focus();
    router.push(`/directory?${new URLSearchParams({ search: values.searchText })}`);
  }

  return (
    <header className='cinema-header' data-search-open={searchOpen}>
      <div className='header-inner'>
        <Link href='/' className='brand' aria-label='Watcheru home'><CinemaBrand /></Link>
        <nav className='header-nav' aria-label='Main navigation'>
          <Link href='/' aria-current={pathname === '/' ? 'page' : undefined}>Discover</Link>
          <Link href='/watchlist' aria-current={pathname === '/watchlist' ? 'page' : undefined}>Watchlist</Link>
        </nav>
        <div className='header-search' data-open={searchOpen} ref={searchRef} onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
        }}>
          <form id={searchId} inert={!searchOpen} aria-hidden={!searchOpen} onTransitionEnd={(event) => {
            if (searchOpen && event.target === event.currentTarget && event.propertyName === 'width' && document.activeElement === toggleRef.current) setFocus('searchText');
          }} onSubmit={(event) => { void handleSubmit(onSubmit)(event); }} className='header-search-panel' role='search'>
            <div className='search-shell'>
              <input {...register('searchText')} aria-label='Search movies by title' aria-invalid={!!errors.searchText} aria-describedby={errors.searchText ? errorId : undefined} autoComplete='off' placeholder='Search movies…' />
              <button type='submit' aria-label='Search movies'><ArrowRight size={18} aria-hidden='true' /></button>
            </div>
            {errors.searchText && <span id={errorId} role='alert' className='search-error'>{errors.searchText.message}</span>}
          </form>
          <Button ref={toggleRef} type='button' variant='ghost' size='icon-lg' className='header-search-toggle' aria-label={searchOpen ? 'Close movie search' : 'Open movie search'} aria-expanded={searchOpen} aria-controls={searchId} onClick={() => {
            if (searchOpen) {
              setSearchOpen(false);
              return;
            }
            // Focus within the tap gesture so iOS can open the keyboard.
            flushSync(() => setSearchOpen(true));
            setFocus('searchText');
          }}>
            <Search size={20} className='size-5' aria-hidden='true' />
          </Button>
        </div>
        <div className='header-theme'><ThemeToggle /></div>
      </div>
    </header>
  );
}
