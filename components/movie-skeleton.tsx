export function MovieResultsSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'list' }) {
  return (
    <div role='status' aria-label='Loading search results'>
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
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MovieDetailsSkeleton() {
  return (
    <div className='feature-details' role='status' aria-label='Loading movie details'>
      <div className='feature-content' aria-hidden='true'>
        <div className='feature-poster skeleton-surface' />
        <div className='feature-copy'>
          <h1><span className='skeleton-surface skeleton-heading' /></h1>
          <div className='film-meta'><div className='skeleton-surface skeleton-line skeleton-meta' /></div>
          <div className='film-genres'><div className='skeleton-surface skeleton-line' /></div>
          <div className='film-synopsis'>
            <div className='skeleton-surface skeleton-line' />
            <div className='skeleton-surface skeleton-line' />
            <div className='skeleton-surface skeleton-line skeleton-meta' />
          </div>
          <div className='film-stats'>
            {Array.from({ length: 3 }, (_, index) => (
              <div className='film-stat' key={index}>
                <div className='skeleton-surface skeleton-line skeleton-value' />
                <div className='skeleton-surface skeleton-line skeleton-caption' />
              </div>
            ))}
          </div>
          <div className='film-actions'>
            <div className='skeleton-surface skeleton-action' />
            <div className='skeleton-surface skeleton-action' />
          </div>
        </div>
      </div>
    </div>
  );
}
