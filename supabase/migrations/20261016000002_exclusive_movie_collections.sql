-- Apply after the previous migrations. Older duplicate memberships prefer Watched.
begin;
lock table public.movie_library in share row exclusive mode;

delete from public.movie_library saved
using public.movie_library watched
where saved.user_id = watched.user_id and saved.movie_id = watched.movie_id
  and saved.collection = 'saved' and watched.collection = 'watched';

alter table public.movie_library
  add constraint movie_library_one_collection unique (user_id, movie_id);

-- Runs before movie_library_limit. Deleting the old membership and inserting
-- the new one share a transaction; any validation/limit failure rolls back both.
create function public.move_movie_collection()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.user_id is distinct from auth.uid() then
    raise exception 'Not authorized';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.user_id::text, 0));
  delete from public.movie_library
    where user_id = new.user_id and movie_id = new.movie_id
      and collection <> new.collection;
  return new;
end;
$$;
revoke all on function public.move_movie_collection() from public;
create trigger movie_library_exclusive before insert on public.movie_library
  for each row execute function public.move_movie_collection();
commit;
