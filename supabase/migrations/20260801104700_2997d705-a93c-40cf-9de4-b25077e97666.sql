CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  hidden_at timestamptz,
  hidden_by uuid,
  hidden_reason text
);

CREATE INDEX chat_messages_recent_idx ON public.chat_messages (created_at DESC);
CREATE INDEX chat_messages_wallet_idx ON public.chat_messages (wallet_address, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Staff (admin/editor) moderate through the Data API; everyone else reads
-- only through the masked helper below, and writes only via the server.
CREATE POLICY "Staff read chat" ON public.chat_messages
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff moderate chat" ON public.chat_messages
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete chat" ON public.chat_messages
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.chat_recent(_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, wallet_masked text, body text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id,
         left(c.wallet_address, 4) || '…' || right(c.wallet_address, 4),
         c.body,
         c.created_at
  FROM public.chat_messages c
  WHERE c.hidden_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT least(coalesce(_limit, 50), 100)
$$;

REVOKE ALL ON FUNCTION public.chat_recent(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_recent(integer) TO anon, authenticated, service_role;