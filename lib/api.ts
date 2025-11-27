export default async function fetchTmdbApi(
  endpoint: string,
  options?: RequestInit
) {
  const url = `${process.env.TMDB_API_URL || ''}${endpoint}`;

  const finalOptions = {
    ...options,
    headers: {
      ...(options?.headers || {}),
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN || ''}`
    }
  };

  return fetch(url, finalOptions);
}
