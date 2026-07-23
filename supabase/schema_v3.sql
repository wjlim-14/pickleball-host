-- QuickQueue schema v3: admin insights aggregates
create or replace function public.admin_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select jsonb_build_object(
    'clubs_total',   (select count(*) from profiles where club_name is not null),
    'clubs_active',  (select count(*) from profiles where club_name is not null and activated),
    'clubs_pending', (select count(*) from profiles where club_name is not null and not activated),
    'sessions_total',(select count(*) from sessions),
    'sessions_30d',  (select count(*) from sessions where created_at > now() - interval '30 days'),
    'games_total',   (select count(*) from games),
    'games_30d',     (select count(*) from games where played_at > now() - interval '30 days'),
    'players_total', (select count(*) from session_players),
    'active_clubs_30d', (select count(distinct host_id) from sessions where created_at > now() - interval '30 days'),
    'format_mix', coalesce((select jsonb_object_agg(format, c) from (select format, count(*) c from games group by format) t), '{}'::jsonb),
    'meets_dist', coalesce((select jsonb_object_agg(coalesce(meets_per_week,'?'), c) from (select meets_per_week, count(*) c from profiles where club_name is not null group by meets_per_week) t), '{}'::jsonb),
    'participants_dist', coalesce((select jsonb_object_agg(coalesce(participants_range,'?'), c) from (select participants_range, count(*) c from profiles where club_name is not null group by participants_range) t), '{}'::jsonb),
    'gender_split', coalesce((select jsonb_object_agg(coalesce(gender,'?'), c) from (select gender, count(*) c from session_players group by gender) t), '{}'::jsonb),
    'top_clubs', coalesce((select jsonb_agg(row_to_json(x)) from (
        select p.club_name as club, count(g.id) as games, max(g.played_at) as last_played
        from profiles p left join games g on g.host_id = p.id
        where p.club_name is not null
        group by p.club_name order by count(g.id) desc limit 6) x), '[]'::jsonb),
    'reg_by_week', coalesce((select jsonb_agg(row_to_json(w)) from (
        select to_char(date_trunc('week', created_at), 'Mon DD') as wk, count(*) as c
        from profiles where club_name is not null and created_at > now() - interval '56 days'
        group by date_trunc('week', created_at) order by date_trunc('week', created_at)) w), '[]'::jsonb)
  ) into result;
  return result;
end; $$;
