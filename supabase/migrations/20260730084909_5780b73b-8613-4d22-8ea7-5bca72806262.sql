ALTER TABLE public.curated_social_posts
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS original_caption text,
  ADD COLUMN IF NOT EXISTS thumbnail_fetched_at timestamptz;