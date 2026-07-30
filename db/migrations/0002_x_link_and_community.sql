-- Update Ivy's X profile link and add the official X community.
-- Static site config and the Royal Court are the source of truth visitors see;
-- this migration keeps the database project_config row consistent.

alter table public.project_config add column if not exists community_url text;

update public.project_config
set
  x_url = 'https://x.com/Ivyvibing',
  community_url = 'https://x.com/i/communities/1930581728466202736',
  updated_at = now()
where x_url = 'https://x.com/ivyvibing' or x_url is null;
