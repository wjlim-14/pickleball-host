-- QuickQueue schema v2: club registration + per-account activation codes
alter table public.profiles
  add column if not exists club_name text,
  add column if not exists meets_per_week text,
  add column if not exists participants_range text,
  add column if not exists location text;

alter table public.beta_codes
  add column if not exists assigned_to uuid references auth.users(id);

create or replace function public.submit_registration(
  p_club text, p_meets text, p_participants text, p_location text
) returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_email text; v_code text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select email into v_email from auth.users where id = v_uid;
  insert into public.profiles (id, email, club_name, meets_per_week, participants_range, location)
  values (v_uid, v_email, p_club, p_meets, p_participants, p_location)
  on conflict (id) do update set
    club_name = excluded.club_name,
    meets_per_week = excluded.meets_per_week,
    participants_range = excluded.participants_range,
    location = excluded.location;
  if not exists (select 1 from public.beta_codes where assigned_to = v_uid and redeemed_by is null) then
    v_code := 'QQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    insert into public.beta_codes (code, assigned_to, note) values (v_code, v_uid, 'registration');
  end if;
end; $$;
