-- QuickQueue schema + row-level security
-- Run this in the Supabase SQL editor.

-- ============ ADMIN HELPER ============
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'jaylim.wjie@gmail.com';
$$;

-- ============ TABLES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  activated boolean not null default false,
  activated_at timestamptz,
  plan text not null default 'beta',
  credits integer not null default 0,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.beta_codes (
  code text primary key,
  created_at timestamptz not null default now(),
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  note text
);

create table if not exists public.beta_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  club text,
  location text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  name text,
  date text,
  time text,
  location text,
  method text not null default 'requeue',
  courts jsonb not null default '[]'::jsonb,
  state jsonb,
  status text not null default 'created',
  games_count integer not null default 0,
  players_count integer not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  gender text,
  level integer,
  format_req text default 'any',
  games_played integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  host_id uuid not null references auth.users(id) on delete cascade,
  court text,
  format text,
  team1 jsonb,
  team2 jsonb,
  winner text,
  duration_seconds integer,
  played_at timestamptz not null default now()
);

create index if not exists idx_sessions_host on public.sessions(host_id);
create index if not exists idx_players_session on public.session_players(session_id);
create index if not exists idx_games_session on public.games(session_id);
create index if not exists idx_games_host on public.games(host_id);

-- ============ NEW-USER PROFILE TRIGGER ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ REDEEM CODE FUNCTION ============
create or replace function public.redeem_code(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return false; end if;
  update public.beta_codes
     set redeemed_by = v_uid, redeemed_at = now()
   where code = p_code and redeemed_by is null;
  if not found then return false; end if;
  update public.profiles set activated = true, activated_at = now() where id = v_uid;
  return true;
end; $$;

-- ============ ADMIN: GENERATE CODE ============
create or replace function public.generate_code(p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  v_code := 'QQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.beta_codes (code, note) values (v_code, p_note);
  return v_code;
end; $$;

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles        enable row level security;
alter table public.beta_codes      enable row level security;
alter table public.beta_requests   enable row level security;
alter table public.sessions        enable row level security;
alter table public.session_players enable row level security;
alter table public.games           enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- beta_codes (admin only; redemption happens via security-definer function)
create policy "codes_admin_all" on public.beta_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- beta_requests: any signed-in user may submit; only admin reads
create policy "requests_insert_authed" on public.beta_requests
  for insert with check (auth.uid() is not null);
create policy "requests_select_admin" on public.beta_requests
  for select using (public.is_admin());

-- sessions / players / games: host owns their rows
create policy "sessions_own" on public.sessions
  for all using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "players_own" on public.session_players
  for all using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy "games_own" on public.games
  for all using (host_id = auth.uid()) with check (host_id = auth.uid());
