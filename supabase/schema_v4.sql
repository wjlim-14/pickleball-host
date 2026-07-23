-- QuickQueue schema v4: per-host stats (scoped to the calling host)
create or replace function public.host_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); result jsonb;
begin
  if v_uid is null then return '{}'::jsonb; end if;
  select jsonb_build_object(
    'sessions_total', (select count(*) from sessions where host_id = v_uid),
    'sessions_30d',   (select count(*) from sessions where host_id = v_uid and created_at > now() - interval '30 days'),
    'games_total',    (select count(*) from games where host_id = v_uid),
    'checkins_total', (select count(*) from session_players where host_id = v_uid),
    'unique_players', (select count(distinct lower(name)) from session_players where host_id = v_uid),
    'avg_game_secs',  (select coalesce(round(avg(duration_seconds))::int, 0) from games where host_id = v_uid),
    'format_mix', coalesce((select jsonb_object_agg(format, c) from (select format, count(*) c from games where host_id = v_uid group by format) t), '{}'::jsonb),
    'gender_split', coalesce((select jsonb_object_agg(coalesce(gender,'?'), c) from (select gender, count(*) c from session_players where host_id = v_uid group by gender) t), '{}'::jsonb),
    'top_players', coalesce((select jsonb_agg(row_to_json(x)) from (
        select name, sum(games_played) as games, count(*) as sessions
        from session_players where host_id = v_uid
        group by name order by sum(games_played) desc, count(*) desc limit 8) x), '[]'::jsonb)
  ) into result;
  return result;
end; $$;
