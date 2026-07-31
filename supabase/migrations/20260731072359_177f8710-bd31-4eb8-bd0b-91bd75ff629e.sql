CREATE TABLE public.game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  season text NOT NULL,
  best_score integer NOT NULL DEFAULT 0,
  plays integer NOT NULL DEFAULT 0,
  last_played_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_address, season)
);

GRANT SELECT ON public.game_scores TO anon;
GRANT SELECT ON public.game_scores TO authenticated;
GRANT ALL ON public.game_scores TO service_role;

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_scores_public_read" ON public.game_scores
  FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER game_scores_set_updated_at
  BEFORE UPDATE ON public.game_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX game_scores_season_rank_idx ON public.game_scores (season, best_score DESC);

CREATE TABLE public.game_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text NOT NULL UNIQUE,
  wallet_address text,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.game_nonces TO service_role;

ALTER TABLE public.game_nonces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_nonces_no_public_access" ON public.game_nonces
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);