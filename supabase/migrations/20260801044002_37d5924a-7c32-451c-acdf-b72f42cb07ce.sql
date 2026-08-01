ALTER TABLE public.game_scores
  ADD COLUMN IF NOT EXISTS total_score bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fair_play_score integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS flagged_runs integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_streak_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_play_date date,
  ADD COLUMN IF NOT EXISTS reward_eligible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.game_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  season text NOT NULL,
  score integer NOT NULL,
  coins integer NOT NULL DEFAULT 0,
  jumps integer NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL DEFAULT 0,
  confidence integer NOT NULL DEFAULT 100,
  accepted boolean NOT NULL DEFAULT true,
  reasons text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS game_runs_wallet_season_idx ON public.game_runs (wallet_address, season, created_at DESC);

GRANT ALL ON public.game_runs TO service_role;
ALTER TABLE public.game_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_runs_no_public_access" ON public.game_runs;
CREATE POLICY "game_runs_no_public_access" ON public.game_runs
  AS restrictive FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "game_runs_staff_read" ON public.game_runs;
CREATE POLICY "game_runs_staff_read" ON public.game_runs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
GRANT SELECT ON public.game_runs TO authenticated;

DROP FUNCTION IF EXISTS public.leaderboard_top(text, integer);
CREATE OR REPLACE FUNCTION public.leaderboard_top(_season text DEFAULT NULL::text, _limit integer DEFAULT 20)
 RETURNS TABLE(wallet_masked text, best_score integer, plays integer, last_played_at timestamptz,
               xp integer, level integer, streak_days integer, fair_play_score integer, reward_eligible boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    left(g.wallet_address, 4) || '…' || right(g.wallet_address, 4) as wallet_masked,
    g.best_score,
    g.plays,
    g.last_played_at,
    g.xp,
    greatest(1, floor(sqrt(greatest(g.xp, 0) / 250.0))::int + 1) as level,
    g.streak_days,
    g.fair_play_score,
    g.reward_eligible
  from public.game_scores g
  where _season is null or g.season = _season
  order by g.best_score desc, g.last_played_at asc
  limit least(coalesce(_limit, 20), 50)
$function$;

REVOKE ALL ON FUNCTION public.leaderboard_top(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leaderboard_top(text, integer) TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.player_card(text, text);
CREATE OR REPLACE FUNCTION public.player_card(_wallet text, _season text DEFAULT NULL::text)
 RETURNS TABLE(season text, best_score integer, plays integer, xp integer, level integer,
               coins integer, streak_days integer, best_streak_days integer, active_days integer,
               fair_play_score integer, reward_eligible boolean, rank integer,
               seasons_played integer, lifetime_best integer, lifetime_plays integer,
               last_played_at timestamptz)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with s as (
    select coalesce(_season, to_char(now() at time zone 'utc', 'YYYY-MM')) as season
  ), me as (
    select g.* from public.game_scores g, s
    where g.wallet_address = _wallet and g.season = s.season
  ), life as (
    select count(*)::int as seasons_played,
           coalesce(max(g.best_score), 0) as lifetime_best,
           coalesce(sum(g.plays), 0)::int as lifetime_plays
    from public.game_scores g where g.wallet_address = _wallet
  )
  select
    (select season from s),
    coalesce(r.best_score, 0),
    coalesce(r.plays, 0),
    coalesce(r.xp, 0),
    greatest(1, floor(sqrt(greatest(coalesce(r.xp, 0), 0) / 250.0))::int + 1),
    coalesce(r.coins, 0),
    coalesce(r.streak_days, 0),
    coalesce(r.best_streak_days, 0),
    coalesce(r.active_days, 0),
    coalesce(r.fair_play_score, 100),
    coalesce(r.reward_eligible, true),
    case when r.id is null then null else (
      select count(*)::int + 1 from public.game_scores g2
      where g2.season = r.season and g2.best_score > r.best_score
    ) end,
    l.seasons_played, l.lifetime_best, l.lifetime_plays,
    r.last_played_at
  from life l left join me r on true
$function$;

REVOKE ALL ON FUNCTION public.player_card(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.player_card(text, text) TO anon, authenticated, service_role;