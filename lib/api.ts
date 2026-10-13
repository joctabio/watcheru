export default async function fetchTmdbApi<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (!process.env.TMDB_API_URL || !process.env.TMDB_ACCESS_TOKEN) {
    throw new Error('Movie service is not configured. Please try again later.');
  }
  const url = `${process.env.TMDB_API_URL.replace(/\/$/, '')}${endpoint}`;
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${process.env.TMDB_ACCESS_TOKEN}`);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, signal: options?.signal ?? AbortSignal.timeout(15_000) });
  } catch {
    throw new Error('Movie service could not be reached. Please try again.');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'status_message' in data &&
      typeof data.status_message === 'string'
        ? data.status_message
        : `TMDB request failed (${response.status})`;

    throw new Error(message);
  }

  if (data === null) throw new Error('Movie service returned an invalid response. Please try again.');

  return data as T;
}
