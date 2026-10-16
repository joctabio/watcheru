# Watcheru

A Next.js app for choosing a movie, searching TMDB, and keeping a movie library with optional Supabase cloud sync.

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
- Up to 100 recent picks per app session, with a Previous pick button. More info reuses full movie details and watch availability loaded during the pick. Returning to Discover restores the selected pick, history, filter values, filter panel, and scroll position until a full reload. Recent picks and watched movies are excluded from new suggestions.
- Title search with URL-based pagination and grid/list views, result counts, empty states, and retry controls. Movie details link back to the original search title, page, and view; direct detail URLs return to Discover.
- Movie details with runtime, cast, YouTube trailer links, and regional watch availability from JustWatch via TMDB.
- Saved and watched collections at `/watchlist`, with limits of 200 saved and 400 watched movies. Guests use browser localStorage. Signed-in users sync through Supabase, with Google sign-in or email magic links.
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

Tests use Node's built-in test runner and mock TMDB responses. They cover Discover detail caching and return navigation, search encoding and validation, discovery page limits and filters, excluded movies, action error propagation, persisted library validation, and API failure handling. They do not require a live TMDB token.

The production build downloads the existing Geist fonts from Google Fonts and requires network access. Run `npm start` after a successful build.

## Data

This product uses the TMDB API but is not endorsed or certified by TMDB. Watch availability is supplied by JustWatch via TMDB; availability and prices may change. Watch options link to TMDB rather than directly to individual streaming services.

## Supabase cloud sync

Cloud sync is optional. Without the two Supabase environment variables, the app continues to work in guest mode.

1. Create a Supabase project. In its SQL Editor, run [`supabase/migrations/20261016000000_movie_library.sql`](supabase/migrations/20261016000000_movie_library.sql), then [`supabase/migrations/20261016000001_mark_movie_watched.sql`](supabase/migrations/20261016000001_mark_movie_watched.sql). Finally run [`supabase/migrations/20261016000002_exclusive_movie_collections.sql`](supabase/migrations/20261016000002_exclusive_movie_collections.sql). Only run migrations that have not already been applied, in filename order. If you use the Supabase CLI, link the project and apply the migration with `supabase db push` instead.
2. Copy the project URL and **publishable** key from Supabase into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
   ```

   These values are intentionally available to the browser. A legacy `anon` key also works in the publishable-key variable. Never use a secret or `service_role` key here. User access is enforced by database Row Level Security, not by hiding the public key.
3. In **Authentication → URL Configuration**, set the Site URL to your app URL. Add the exact callback URLs to the redirect allow list: `http://localhost:3000/auth/callback` for development and `https://your-domain/auth/callback` for production.
4. Enable the **Email** provider for passwordless email links. Keep Supabase's default magic-link template (the `{{ .ConfirmationURL }}` link). Configure custom SMTP before a public launch; the default email sender has restrictions and low rate limits.
5. For Google sign-in, create a Google OAuth web client in Google Cloud. Add the callback URL shown in Supabase's **Authentication → Providers → Google** settings (usually `https://your-project.supabase.co/auth/v1/callback`) as a Google authorized redirect URI. Enter the Google client ID and client secret in Supabase and enable Google. The Google client secret belongs in Supabase, never in the app's public environment variables.
6. Restart the dev server after setting the environment variables. For production, set them in your hosting provider and rebuild the app.

Open the account icon at the top right of the header and choose **Sign in**. The account dropdown shows your provider name/avatar, a **Theme** submenu (Light, Dark, System), and **Sign out** when signed in. Authentication is browser-side using Supabase's persisted sessions and automatic token refresh; no custom auth server or server-side session cookies are required. The `/auth/callback` page finishes the redirect and returns to the watchlist. Authenticated server routes added in the future must independently validate the user's session.

On sign-in, existing guest entries are imported without overwriting account entries. Guest storage is cleared only after a successful import. Entries beyond the account's collection limits remain in guest storage, with a message on the watchlist. Signing out returns to the separate guest library; account movies are not copied into guest storage. Cloud changes use optimistic updates with rollback on failure, and refresh when the app regains focus or reconnects. Changes in another open device appear on refresh/focus rather than through a realtime subscription. Offline cloud writes show an error and must be retried.

### Verify a connected project

- Save movies as a guest, sign in by email, and verify the movies appear in `movie_library` and on a second browser/device signed into the same account.
- Sign in with Google and verify the callback returns to `/watchlist`.
- Add/remove a movie, reload, and check that moving a movie between Saved and Watched removes it from the original collection.
- Sign out and sign in with a different account; confirm the first account's movies are absent.
- With two test users' authenticated clients, attempt to select, insert, and delete rows for the other user's ID. Select/delete must affect no rows; insert must fail. An unauthenticated client must have no access.
- Disconnect the network and try changing a movie; verify the optimistic change rolls back and an error appears.

Marking a movie as watched removes its saved membership and moves its row from Saved to Watched immediately. For signed-in users this uses the `mark_movie_watched` database function so both changes succeed or fail together. Direct removals remain visible for undo during the current watchlist visit; reloading or leaving and returning clears those rows.

Movies belong to one collection at a time. Saved rows offer **Mark as watched** and **Remove**; Watched rows offer **Add to watchlist** and **Remove**. Adding a watched movie to the watchlist moves it back to Saved immediately. After a direct removal, the retained row offers an action to restore its original membership. The exclusive-collections migration enforces this in the database and resolves older duplicate memberships in favor of Watched; guest libraries use the same conflict rule. Existing account membership takes precedence when importing guest movies.
