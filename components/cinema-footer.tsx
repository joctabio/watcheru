export default function CinemaFooter() {
  return (
    <footer className='cinema-footer'>
      <span>© {new Date().getFullYear()} Watcheru. All rights reserved.</span>
      <a href='https://www.themoviedb.org' target='_blank' rel='noopener noreferrer'>Movie data from TMDB ↗</a>
    </footer>
  );
}
