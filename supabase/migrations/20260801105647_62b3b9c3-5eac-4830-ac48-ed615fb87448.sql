CREATE TABLE public.game_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season text NOT NULL,
  place smallint NOT NULL,
  wallet_address text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  tokens integer NOT NULL DEFAULT 0,
  paid_at timestamptz,
  tx_signature text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season, place)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_payouts TO authenticated;
GRANT ALL ON public.game_payouts TO service_role;

ALTER TABLE public.game_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read payouts" ON public.game_payouts
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert payouts" ON public.game_payouts
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update payouts" ON public.game_payouts
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins can delete payouts" ON public.game_payouts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER game_payouts_updated_at
  BEFORE UPDATE ON public.game_payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();