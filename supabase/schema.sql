-- Uke Sensei — run this in the Supabase SQL Editor (free tier).
-- Sign-in is anonymous (Authentication → Providers → Anonymous Sign-Ins),
-- so no OAuth provider setup is required.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  contact_email text,
  preferred_key text not null default 'C',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists contact_email text;

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.lesson_progress (
  user_id uuid references public.profiles on delete cascade not null,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

drop policy if exists "lesson_progress_all_own" on public.lesson_progress;
create policy "lesson_progress_all_own" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  created_at timestamptz not null default now(),
  scale_key text not null,
  root text not null,
  bpm integer not null default 0,
  tuning_key text not null,
  started_at bigint not null,
  ended_at bigint not null,
  duration_sec real not null,
  pitch_accuracy real not null default 0,
  timing_on_time_percent real not null default 0,
  overall_score real not null default 0,
  notes_json jsonb not null default '[]'::jsonb,
  has_audio boolean not null default false,
  audio_path text
);

-- 'supabase' = audio_path is a key in the session-audio Storage bucket.
-- 'spaces'   = audio_path is a key in the DigitalOcean Spaces bucket
--              (large/long recordings — see api/recordings/*).
alter table public.practice_sessions
  add column if not exists audio_provider text not null default 'supabase';

alter table public.practice_sessions enable row level security;

drop policy if exists "practice_sessions_all_own" on public.practice_sessions;
create policy "practice_sessions_all_own" on public.practice_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Share links let a user hand out a token that resolves (via a
-- security-definer RPC below) to a read-only view of one practice session,
-- without exposing the practice_sessions table to arbitrary readers.
create table if not exists public.shared_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  user_id uuid references public.profiles on delete cascade not null,
  session_id uuid references public.practice_sessions on delete cascade not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  view_count integer not null default 0,
  last_viewed_at timestamptz
);

create index if not exists shared_links_user_id_idx on public.shared_links (user_id);
create index if not exists shared_links_session_id_idx on public.shared_links (session_id);

alter table public.shared_links enable row level security;

drop policy if exists "shared_links_select_own" on public.shared_links;
create policy "shared_links_select_own" on public.shared_links
  for select using (auth.uid() = user_id);

drop policy if exists "shared_links_insert_own" on public.shared_links;
create policy "shared_links_insert_own" on public.shared_links
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.practice_sessions ps
      where ps.id = session_id and ps.user_id = auth.uid()
    )
  );

drop policy if exists "shared_links_update_own" on public.shared_links;
create policy "shared_links_update_own" on public.shared_links
  for update using (auth.uid() = user_id);

drop policy if exists "shared_links_delete_own" on public.shared_links;
create policy "shared_links_delete_own" on public.shared_links
  for delete using (auth.uid() = user_id);

-- Resolves a share token to the underlying session, for anyone holding the
-- link — including visitors with no account at all (anon role), which is
-- the whole point of a share link. Runs as security definer since the
-- normal RLS on practice_sessions/shared_links is owner-only.
create or replace function public.get_shared_session(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  update public.shared_links
    set view_count = view_count + 1, last_viewed_at = now()
    where token = p_token and revoked_at is null;

  if not found then
    raise exception 'Link not found or revoked';
  end if;

  select json_build_object(
    'session', json_build_object(
      'id', ps.id,
      'createdAt', ps.created_at,
      'scaleKey', ps.scale_key,
      'root', ps.root,
      'bpm', ps.bpm,
      'tuningKey', ps.tuning_key,
      'startedAt', ps.started_at,
      'endedAt', ps.ended_at,
      'durationSec', ps.duration_sec,
      'pitchAccuracy', ps.pitch_accuracy,
      'timingOnTimePercent', ps.timing_on_time_percent,
      'overallScore', ps.overall_score,
      'notes', ps.notes_json,
      'hasAudio', ps.has_audio,
      'audioPath', ps.audio_path,
      'audioProvider', ps.audio_provider
    ),
    'sharedBy', p.display_name
  ) into result
  from public.shared_links sl
  join public.practice_sessions ps on ps.id = sl.session_id
  join public.profiles p on p.id = sl.user_id
  where sl.token = p_token;

  return result;
end;
$$;

revoke all on function public.get_shared_session(text) from public;
grant execute on function public.get_shared_session(text) to anon, authenticated;

-- Lets the recordings API (api/recordings/download-url) confirm that a
-- share token grants access to a given DigitalOcean Spaces object key,
-- without exposing shared_links/practice_sessions to arbitrary readers.
-- Mirrors get_shared_session's security-definer pattern.
create or replace function public.verify_shared_audio_key(p_token text, p_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.shared_links sl
    join public.practice_sessions ps on ps.id = sl.session_id
    where sl.token = p_token
      and sl.revoked_at is null
      and ps.audio_path = p_key
      and ps.audio_provider = 'spaces'
  );
end;
$$;

revoke all on function public.verify_shared_audio_key(text, text) from public;
grant execute on function public.verify_shared_audio_key(text, text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('session-audio', 'session-audio', false)
on conflict (id) do nothing;

drop policy if exists "session_audio_insert_own" on storage.objects;
create policy "session_audio_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'session-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "session_audio_select_own" on storage.objects;
create policy "session_audio_select_own" on storage.objects
  for select using (
    bucket_id = 'session-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "session_audio_delete_own" on storage.objects;
create policy "session_audio_delete_own" on storage.objects
  for delete using (
    bucket_id = 'session-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Lets anyone holding a valid (non-revoked) share link fetch/sign the
-- underlying audio object for that one session — additive to (OR'd with)
-- the owner-only policy above, so it doesn't loosen access to anything else.
drop policy if exists "session_audio_select_shared" on storage.objects;
create policy "session_audio_select_shared" on storage.objects
  for select using (
    bucket_id = 'session-audio'
    and exists (
      select 1 from public.shared_links sl
      join public.practice_sessions ps on ps.id = sl.session_id
      where sl.revoked_at is null
        and ps.audio_path = storage.objects.name
    )
  );

-- Avatars are small, non-sensitive images shown throughout the UI, so the
-- bucket is public (readable without a signed URL) — only writes are
-- restricted to the owning user's own folder.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
