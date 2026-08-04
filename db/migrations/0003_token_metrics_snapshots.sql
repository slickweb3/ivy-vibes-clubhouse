-- Historical token metric snapshots.
-- Dexscreener gives us "now"; nothing gives us "then". To honestly report a
-- holder-count change over 1h / 6h / 24h / 7d / 30d we have to record our own
-- timeline. Rows are written server-side only (service role) and read publicly.

create table if not exists public.token_metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  mint text not null,
  holders integer,
  holder_accounts integer,
  top10_percent numeric,
  price_usd numeric,
  market_cap_usd numeric,
  liquidity_usd numeric,
  volume_24h_usd numeric,
  buys_24h integer,
  sells_24h integer,
  captured_at timestamptz not null default now()
);

create index if not exists token_metrics_snapshots_mint_time_idx
  on public.token_metrics_snapshots (mint, captured_at desc);

grant select on public.token_metrics_snapshots to anon;
grant select on public.token_metrics_snapshots to authenticated;
grant all on public.token_metrics_snapshots to service_role;

alter table public.token_metrics_snapshots enable row level security;

-- Public read of aggregate market history (no wallets, no PII).
drop policy if exists "Anyone can read token metric history" on public.token_metrics_snapshots;
create policy "Anyone can read token metric history"
on public.token_metrics_snapshots
for select
to anon, authenticated
using (true);

-- No insert/update/delete policies: only the service role writes snapshots.
