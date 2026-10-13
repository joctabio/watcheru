type ReturnDestination = { href: string; label: string; search?: string };

export function searchResultsHref(search: string, page: number, view: 'grid' | 'list') {
  const params = new URLSearchParams({ search, page: String(page) });
  if (view === 'list') params.set('view', 'list');
  return `/directory?${params}`;
}

export function movieDetailsHref(id: number, returnTo?: string) {
  const destination = `/directory/${id}`;
  return returnTo ? `${destination}?${new URLSearchParams({ from: returnTo })}` : destination;
}

// Detail URLs can be opened directly or shared. Only known app destinations
// are accepted, so the return link never depends on an external referrer.
export function getMovieReturnDestination(from: string | string[] | undefined | null): ReturnDestination {
  const fallback = { href: '/', label: 'Back to discover' };
  if (typeof from !== 'string') return fallback;
  if (from === '/watchlist') return { href: '/watchlist', label: 'Back to saved movies' };
  if (!from.startsWith('/directory?')) return fallback;

  const params = new URLSearchParams(from.slice('/directory?'.length));
  const search = params.get('search')?.trim();
  if (!search) return fallback;
  const requestedPage = Number(params.get('page') || 1);
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 500 ? requestedPage : 1;
  const view = params.get('view') === 'list' ? 'list' : 'grid';
  return { href: searchResultsHref(search, page, view), label: 'Back to search results', search };
}
