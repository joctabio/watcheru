'use server';

import fetchTmdbApi from '@/lib/api';

export async function fetchMoviesByTitle(name: string) {
  const url = `${process.env.API_URL}s=${name}`;

  const response = await fetch(url);
  const data = await response.json();

  return data;
}

export async function fetchMovieById(id: string) {
  const url = `${process.env.API_URL}i=${id}`;

  const response = await fetch(url);
  const data = await response.json();

  return data;
}

export async function fetchRandomMovie() {
  const page = Math.floor(Math.random() * 500) + 1;
  const response = await fetchTmdbApi(`/discover/movie?page=${page}`);
  const data = await response.json();

  const randomIndex = Math.floor(Math.random() * data.results.length);
  const randomMovie = data.results[randomIndex];
  return randomMovie;
}

export async function fetchRandomShow() {
  const page = Math.floor(Math.random() * 500) + 1;
  const response = await fetchTmdbApi(`/discover/tv?page=${page}`);
  const data = await response.json();

  const randomIndex = Math.floor(Math.random() * data.results.length);
  const randomMovie = data.results[randomIndex];
  return randomMovie;
}
