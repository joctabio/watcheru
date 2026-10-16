import Link from 'next/link';
import { Search } from 'lucide-react';
import CinemaBrand from './cinema-brand';

export default function CinemaHeaderFallback() {
  return (
    <header className='cinema-header'>
      <div className='header-inner'>
        <Link href='/' className='brand' aria-label='Watcheru home'><CinemaBrand /></Link>
        <nav className='header-nav' aria-label='Main navigation'>
          <Link href='/'>Discover</Link>
          <Link href='/watchlist'>Watchlist</Link>
        </nav>
        <div className='header-search'>
          <button type='button' className='header-search-toggle' disabled aria-label='Loading movie search'><Search size={20} aria-hidden='true' /></button>
        </div>
        <div className='header-account size-10' aria-hidden='true' />
      </div>
    </header>
  );
}
