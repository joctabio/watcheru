-- Apply after 20261016000000_movie_library.sql.
-- Keep both membership changes atomic, including when the watched list is full.
create or replace function public.mark_movie_watched(movie_data jsonb, target_user_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  account_id uuid := auth.uid();
  film_id bigint := (movie_data->>'id')::bigint;
begin
  if account_id is null or account_id is distinct from target_user_id then
    raise exception 'Not authorized';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(account_id::text, 0));
  insert into public.movie_library (user_id, movie_id, collection, movie)
    values (account_id, film_id, 'watched', movie_data)
    on conflict (user_id, movie_id, collection) do nothing;
  delete from public.movie_library
    where user_id = account_id and movie_id = film_id and collection = 'saved';
end;
$$;

revoke all on function public.mark_movie_watched(jsonb, uuid) from public, anon;
grant execute on function public.mark_movie_watched(jsonb, uuid) to authenticated;
