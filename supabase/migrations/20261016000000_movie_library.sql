-- Apply once in the Supabase SQL Editor, or with `supabase db push`.
create table public.movie_library (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null check (movie_id > 0),
  collection text not null check (collection in ('saved', 'watched')),
  movie jsonb not null check (
    jsonb_typeof(movie) = 'object'
    and movie ?& array['id', 'title', 'adult', 'backdrop_path', 'original_language',
      'original_title', 'overview', 'popularity', 'poster_path', 'release_date',
      'video', 'vote_average', 'vote_count']
    and jsonb_typeof(movie->'id') = 'number'
    and (movie->>'id')::numeric = movie_id
    and jsonb_typeof(movie->'title') = 'string'
    and octet_length(movie::text) <= 32768
  ),
  added_at timestamptz not null default now(),
  primary key (user_id, movie_id, collection)
);

create index movie_library_user_added_at on public.movie_library (user_id, added_at desc);

alter table public.movie_library enable row level security;
revoke all on public.movie_library from anon, authenticated;
grant select, insert, delete on public.movie_library to authenticated;

create policy "Read own movies" on public.movie_library
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own movies" on public.movie_library
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own movies" on public.movie_library
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Serialize inserts for each user so concurrent devices cannot exceed the limits.
create function public.enforce_movie_library_limit()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.user_id is distinct from auth.uid() then
    raise exception 'Not authorized';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 0));
  if exists (select 1 from public.movie_library
    where user_id = new.user_id and movie_id = new.movie_id and collection = new.collection) then
    return new;
  end if;
  if (select count(*) from public.movie_library
      where user_id = new.user_id and collection = new.collection)
      >= (case new.collection when 'saved' then 200 else 400 end) then
    raise exception 'Movie collection limit reached';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_movie_library_limit() from public;
create trigger movie_library_limit before insert on public.movie_library
  for each row execute function public.enforce_movie_library_limit();
