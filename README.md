# Watcheru

A Next.js app for choosing a movie, searching TMDB, and keeping a browser-local movie library.

## Setup

Requires Node.js 20.9 or newer.

```sh
npm install
cp .env.example .env.local
```

Set these server-side values in `.env.local`:

```dotenv
TMDB_API_URL=https://api.themoviedb.org/3
TMDB_ACCESS_TOKEN=your_tmdb_api_read_access_token
```

Use a TMDB API Read Access Token from your TMDB account settings. Keep the token out of source control and do not prefix it with `NEXT_PUBLIC_`.

```sh
npm run dev
```

Open http://localhost:3000.

## Features

- Random picks with optional genre, original language, release year, maximum runtime, and minimum rating preferences. Minimum ratings require at least 50 votes.
- Up to 100 recent picks per homepage session, with a Previous pick button. Recent picks and watched movies are excluded from new suggestions.
- Title search with URL-based pagination and grid/list views, result counts, empty states, and retry controls. Movie details link back to the original search title, page, and view; direct detail URLs return to Discover.
- Movie details with runtime, cast, YouTube trailer links, and regional watch availability from JustWatch via TMDB.
- Saved and watched collections at `/watchlist`. Stored in this browser using localStorage, with limits of 200 saved and 400 watched movies. Collections do not sync between devices and are lost if browser storage is cleared.
- Light, dark, and system themes.

The interface uses near-black surfaces, cool neutral accents, modern sans-serif typography, and poster-led browsing. It uses CSS and a small inline SVG wordmark with no extra UI dependencies. Light mode uses neutral surfaces, and motion respects the system's reduced-motion preference.

Discover uses a short entrance animation. Compact SVG spinners, loading skeletons, and button feedback provide progress without replacing the homepage content while a movie is selected.

Random discovery uses TMDB's reported page count, capped at 500. It samples up to three pages when excluding movies and may ask you to retry or broaden preferences if those pages have no eligible titles. It does not scan TMDB's entire catalog.

## Validation

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Tests use Node's built-in test runner and mock TMDB responses. They cover search encoding and validation, discovery page limits and filters, excluded movies, action error propagation, persisted library validation, and API failure handling. They do not require a live TMDB token.

The production build downloads the existing Geist fonts from Google Fonts and requires network access. Run `npm start` after a successful build.

## Data

This product uses the TMDB API but is not endorsed or certified by TMDB. Watch availability is supplied by JustWatch via TMDB; availability and prices may change. Watch options link to TMDB rather than directly to individual streaming services.
