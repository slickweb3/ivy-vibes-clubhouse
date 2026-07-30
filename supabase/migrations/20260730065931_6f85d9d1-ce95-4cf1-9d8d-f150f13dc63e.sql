ALTER TABLE public.project_config
  ADD COLUMN IF NOT EXISTS dev_wallet_address text,
  ADD COLUMN IF NOT EXISTS pair_address text,
  ADD COLUMN IF NOT EXISTS chart_provider text NOT NULL DEFAULT 'dexscreener',
  ADD COLUMN IF NOT EXISTS market_data_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS launch_platform text,
  ADD COLUMN IF NOT EXISTS launch_platform_url text;

UPDATE public.project_config
  SET launch_platform = COALESCE(launch_platform, 'pump.fun'),
      launch_platform_url = COALESCE(launch_platform_url, 'https://pump.fun');