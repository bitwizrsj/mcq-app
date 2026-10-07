-- QuizMaster Pro schema
-- Run this in the Supabase SQL Editor if tables are missing.

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mcq_sets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  topic text not null,
  level text not null,
  count integer not null default 0,
  share_pin text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.mcq_sets(id) on delete cascade,
  text text not null,
  options jsonb not null default '[]'::jsonb,
  correct_option_index integer not null default 0,
  solution text not null default '',
  notes text not null default ''
);

create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.mcq_sets(id) on delete cascade,
  nickname text not null,
  score integer not null default 0,
  total_count integer not null default 0,
  completed_at timestamptz not null default now()
);

create index if not exists mcq_sets_project_id_idx on public.mcq_sets(project_id);
create index if not exists mcq_sets_share_pin_idx on public.mcq_sets(share_pin);
create index if not exists questions_set_id_idx on public.questions(set_id);
create index if not exists leaderboard_set_id_idx on public.leaderboard(set_id);

-- Allow the anon/publishable key to use these tables (dev-friendly RLS)
alter table public.projects enable row level security;
alter table public.mcq_sets enable row level security;
alter table public.questions enable row level security;
alter table public.leaderboard enable row level security;

drop policy if exists "Allow all on projects" on public.projects;
create policy "Allow all on projects" on public.projects
  for all using (true) with check (true);

drop policy if exists "Allow all on mcq_sets" on public.mcq_sets;
create policy "Allow all on mcq_sets" on public.mcq_sets
  for all using (true) with check (true);

drop policy if exists "Allow all on questions" on public.questions;
create policy "Allow all on questions" on public.questions
  for all using (true) with check (true);

drop policy if exists "Allow all on leaderboard" on public.leaderboard;
create policy "Allow all on leaderboard" on public.leaderboard
  for all using (true) with check (true);

notify pgrst, 'reload schema';
