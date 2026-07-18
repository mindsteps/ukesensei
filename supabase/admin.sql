-- Admin layer — run after schema.sql (or via: yarn setup:db)

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Sign-in is anonymous, so there's no stable account to grant admin to by
-- hand once and be done — clearing local storage creates a brand new
-- anonymous identity. Instead, auto-promote any profile (new or re-onboarded)
-- whose contact_email matches the app owner's email, so admin access follows
-- the email you type into onboarding rather than a specific anonymous session.
create or replace function public.auto_grant_owner_admin()
returns trigger
language plpgsql
as $$
begin
  if lower(coalesce(new.contact_email, '')) = lower('hans@mindsteps.nl') then
    new.is_admin := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_grant_owner_admin on public.profiles;
create trigger trg_auto_grant_owner_admin
  before insert or update on public.profiles
  for each row execute procedure public.auto_grant_owner_admin();

update public.profiles set is_admin = true where lower(contact_email) = lower('hans@mindsteps.nl');

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

-- Overview counters for the admin dashboard
create or replace function public.admin_get_overview()
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result json;
begin
  if not public.is_admin_user() then
    raise exception 'Not authorized';
  end if;

  select json_build_object(
    'total_users', (select count(*)::int from public.profiles),
    'onboarded_users', (select count(*)::int from public.profiles where onboarding_complete),
    'total_sessions', (select count(*)::int from public.practice_sessions),
    'total_practice_sec', (select coalesce(round(sum(duration_sec))::int, 0) from public.practice_sessions),
    'logins_7d', (
      select count(*)::int from auth.users
      where last_sign_in_at > now() - interval '7 days'
    ),
    'logins_30d', (
      select count(*)::int from auth.users
      where last_sign_in_at > now() - interval '30 days'
    ),
    'new_users_7d', (
      select count(*)::int from public.profiles
      where created_at > now() - interval '7 days'
    ),
    'total_shared_links', (select count(*)::int from public.shared_links),
    'active_shared_links', (select count(*)::int from public.shared_links where revoked_at is null),
    'shared_link_views', (select coalesce(sum(view_count), 0)::int from public.shared_links)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_get_overview() from public;
grant execute on function public.admin_get_overview() to authenticated;

-- Top users by practice activity
create or replace function public.admin_get_top_users(row_limit int default 15)
returns table (
  user_id uuid,
  display_name text,
  preferred_key text,
  onboarding_complete boolean,
  session_count bigint,
  practice_sec numeric,
  lessons_completed bigint,
  last_sign_in timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    p.id as user_id,
    p.display_name,
    p.preferred_key,
    p.onboarding_complete,
    count(ps.id) as session_count,
    coalesce(sum(ps.duration_sec), 0)::numeric as practice_sec,
    (select count(*) from public.lesson_progress lp where lp.user_id = p.id) as lessons_completed,
    u.last_sign_in_at as last_sign_in,
    p.created_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join public.practice_sessions ps on ps.user_id = p.id
  group by p.id, p.display_name, p.preferred_key, p.onboarding_complete, p.created_at, u.last_sign_in_at
  order by session_count desc, practice_sec desc, p.created_at desc
  limit greatest(1, least(row_limit, 50));
end;
$$;

revoke all on function public.admin_get_top_users(int) from public;
grant execute on function public.admin_get_top_users(int) to authenticated;

-- Recent sign-ins
create or replace function public.admin_get_recent_logins(row_limit int default 20)
returns table (
  user_id uuid,
  email text,
  display_name text,
  last_sign_in timestamptz,
  created_at timestamptz,
  provider text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    u.id as user_id,
    u.email::text,
    p.display_name,
    u.last_sign_in_at as last_sign_in,
    u.created_at,
    coalesce(u.raw_app_meta_data->>'provider', 'email') as provider
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.last_sign_in_at is not null
  order by u.last_sign_in_at desc
  limit greatest(1, least(row_limit, 100));
end;
$$;

revoke all on function public.admin_get_recent_logins(int) from public;
grant execute on function public.admin_get_recent_logins(int) to authenticated;

-- All users list (lightweight)
create or replace function public.admin_list_users(row_limit int default 50)
returns table (
  user_id uuid,
  email text,
  display_name text,
  preferred_key text,
  is_admin boolean,
  onboarding_complete boolean,
  session_count bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    p.id as user_id,
    u.email::text,
    p.display_name,
    p.preferred_key,
    p.is_admin,
    p.onboarding_complete,
    (select count(*) from public.practice_sessions ps where ps.user_id = p.id) as session_count,
    p.created_at
  from public.profiles p
  left join auth.users u on u.id = p.id
  order by p.created_at desc
  limit greatest(1, least(row_limit, 200));
end;
$$;

revoke all on function public.admin_list_users(int) from public;
grant execute on function public.admin_list_users(int) to authenticated;

-- All share links, for tracking/moderation.
create or replace function public.admin_list_shared_links(row_limit int default 50)
returns table (
  link_id uuid,
  token text,
  owner_display_name text,
  session_label text,
  has_audio boolean,
  view_count integer,
  last_viewed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    sl.id as link_id,
    sl.token,
    p.display_name as owner_display_name,
    case when ps.scale_key = 'melody' then 'Song recording' else ps.root || ' ' || ps.scale_key end as session_label,
    ps.has_audio,
    sl.view_count,
    sl.last_viewed_at,
    sl.revoked_at,
    sl.created_at
  from public.shared_links sl
  join public.practice_sessions ps on ps.id = sl.session_id
  join public.profiles p on p.id = sl.user_id
  order by sl.created_at desc
  limit greatest(1, least(row_limit, 200));
end;
$$;

revoke all on function public.admin_list_shared_links(int) from public;
grant execute on function public.admin_list_shared_links(int) to authenticated;

-- Lets an admin kill any share link (e.g. abuse/moderation), regardless of owner.
create or replace function public.admin_revoke_shared_link(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Not authorized';
  end if;

  update public.shared_links set revoked_at = now()
  where id = p_link_id and revoked_at is null;
end;
$$;

revoke all on function public.admin_revoke_shared_link(uuid) from public;
grant execute on function public.admin_revoke_shared_link(uuid) to authenticated;

-- Needed by admin_reset_user_password below to hash passwords the same way
-- Supabase Auth does (bcrypt via crypt/gen_salt).
create extension if not exists pgcrypto with schema extensions;

-- Permanently deletes a user: the auth.users row (which cascades to
-- profiles, and from there to lesson_progress/practice_sessions/shared_links)
-- plus any Supabase Storage objects (avatar, session-audio recordings) —
-- Postgres refuses to delete a user that still owns Storage objects, so
-- those have to go first. Recordings kept in DigitalOcean Spaces instead of
-- Supabase Storage (see api/recordings/*) are intentionally left behind;
-- cleaning those up would mean this function reaching across to another
-- service, which is out of scope here.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  target_is_admin boolean;
begin
  if not public.is_admin_user() then
    raise exception 'Not authorized';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Cannot delete your own account';
  end if;

  select is_admin into target_is_admin from public.profiles where id = p_user_id;
  if target_is_admin is null then
    raise exception 'User not found';
  end if;
  if target_is_admin then
    raise exception 'Cannot delete an admin account';
  end if;

  delete from storage.objects
  where bucket_id in ('avatars', 'session-audio')
    and (storage.foldername(name))[1] = p_user_id::text;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- Sets a user's password directly (bypassing the normal "know your current
-- password" flow), for an admin helping someone who's locked out. Also
-- drops their existing sessions so the old password stops working
-- everywhere immediately rather than just on next natural expiry.
create or replace function public.admin_reset_user_password(p_user_id uuid, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Not authorized';
  end if;

  if length(coalesce(p_new_password, '')) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'User not found';
  end if;

  update auth.users
  set encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  where id = p_user_id;

  delete from auth.sessions where user_id = p_user_id;
end;
$$;

revoke all on function public.admin_reset_user_password(uuid, text) from public;
grant execute on function public.admin_reset_user_password(uuid, text) to authenticated;

-- Bulk-deletes abandoned sign-ups: profiles that never finished onboarding
-- (so they're not a "real" account anyone would recognize/miss) and are
-- older than the given age. Since sign-in is anonymous, these accumulate
-- from anyone who opened the app and never got past the name/password
-- step — this is the "clean users" button on the admin dashboard. Admin
-- accounts are never touched. Returns how many were deleted.
create or replace function public.admin_clean_users(p_max_age_hours int default 24)
returns int
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  deleted_count int;
begin
  if not public.is_admin_user() then
    raise exception 'Not authorized';
  end if;

  with targets as (
    select id from public.profiles
    where not onboarding_complete
      and not is_admin
      and created_at < now() - make_interval(hours => greatest(0, p_max_age_hours))
  ),
  cleared_storage as (
    delete from storage.objects
    where bucket_id in ('avatars', 'session-audio')
      and (storage.foldername(name))[1] in (select id::text from targets)
    returning 1
  ),
  removed as (
    delete from auth.users
    where id in (select id from targets)
    returning 1
  )
  select count(*) into deleted_count from removed;

  return deleted_count;
end;
$$;

revoke all on function public.admin_clean_users(int) from public;
grant execute on function public.admin_clean_users(int) to authenticated;
