-- QuickQueue schema v5: persistent per-club player roster
create table if not exists public.club_players (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  gender text,
  level integer,
  format_req text default 'any',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_club_players_host on public.club_players(host_id);

alter table public.club_players enable row level security;

create policy "club_players_own" on public.club_players
  for all using (host_id = auth.uid()) with check (host_id = auth.uid());
