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

alter table public.practice_sessions enable row level security;

drop policy if exists "practice_sessions_all_own" on public.practice_sessions;
create policy "practice_sessions_all_own" on public.practice_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
