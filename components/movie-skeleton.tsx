export function MovieResultsSkeleton({ layout = 'grid', showActions = false, label = 'Loading search results' }: { layout?: 'grid' | 'list'; showActions?: boolean; label?: string }) {
  return (
    <div role='status' aria-label={label}>
      <ul className={layout === 'list' ? 'movie-rows' : 'movie-grid'} aria-hidden='true'>
        {Array.from({ length: layout === 'list' ? 4 : 10 }, (_, index) => (
          <li key={index}>
            <div className='poster-card'>
              <div className='poster-art skeleton-surface' />
              <div className='poster-info skeleton-copy'>
                <div className='skeleton-surface skeleton-line skeleton-title' />
                <div className='skeleton-surface skeleton-line skeleton-meta' />
                {layout === 'list' && <div className='skeleton-surface skeleton-line' />}
              </div>
            </div>
            {showActions && <div className='film-actions film-actions-watchlist'>
              <div className='skeleton-surface skeleton-action' />
              <div className='skeleton-surface skeleton-action' />
            </div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MovieCardSkeleton() {
  return <MovieDetailsSkeleton variant='card' />;
}

export function MovieDetailsSkeleton({ variant = 'detail' }: { variant?: 'card' | 'detail' } = {}) {
  return (
    <div className={variant === 'card' ? 'feature-presentation movie-card-skeleton' : 'feature-details'} role='status' aria-label={variant === 'card' ? 'Finding your next movie' : 'Loading movie details'}>
      <div className='feature-content' aria-hidden='true'>
        <div className='feature-poster skeleton-surface' />
        <div className='feature-copy'>
          <div className='film-heading'>
            <h1><span className='skeleton-surface skeleton-heading' /></h1>
          </div>
          <div className='film-meta'><div className='skeleton-surface skeleton-line skeleton-meta' /></div>
          <div className='film-genres'><div className='skeleton-surface skeleton-line' /></div>
          <div className='film-synopsis'>
            <div className='skeleton-surface skeleton-line' />
            <div className='skeleton-surface skeleton-line' />
            <div className='skeleton-surface skeleton-line skeleton-meta' />
          </div>
          <div className='film-summary'>
            <div className='film-stats'>
              {Array.from({ length: 3 }, (_, index) => (
                <div className='film-stat' key={index}>
                  <div className='skeleton-surface skeleton-line skeleton-value' />
                  <div className='skeleton-surface skeleton-line skeleton-caption' />
                </div>
              ))}
            </div>
            <div className='film-result-actions'>
              <div className='film-actions'>
                <div className='skeleton-surface skeleton-action' />
                <div className='skeleton-surface skeleton-action' />
              </div>
              {variant === 'card' && <div className='skeleton-surface skeleton-action film-more-info' />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
