-- 1. Remove unconditional public read on game_scores
DROP POLICY IF EXISTS "game_scores_public_read" ON public.game_scores;
DROP POLICY IF EXISTS "Public can read game scores" ON public.game_scores;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='game_scores' AND cmd='SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.game_scores', p.policyname);
  END LOOP;
END $$;

REVOKE SELECT ON public.game_scores FROM anon, authenticated;
GRANT ALL ON public.game_scores TO service_role;

-- Staff may still inspect scores for airdrops
CREATE POLICY "game_scores_staff_read" ON public.game_scores
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

-- 2. Safe, capped leaderboard read with masked wallets
CREATE OR REPLACE FUNCTION public.leaderboard_top(_season text DEFAULT NULL, _limit int DEFAULT 20)
RETURNS TABLE (wallet_masked text, best_score int, plays int, last_played_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select
    left(g.wallet_address, 4) || '…' || right(g.wallet_address, 4) as wallet_masked,
    g.best_score,
    g.plays,
    g.last_played_at
  from public.game_scores g
  where _season is null or g.season = _season
  order by g.best_score desc, g.last_played_at asc
  limit least(coalesce(_limit, 20), 50)
$$;

REVOKE ALL ON FUNCTION public.leaderboard_top(text, int) FROM public;
GRANT EXECUTE ON FUNCTION public.leaderboard_top(text, int) TO anon, authenticated, service_role;