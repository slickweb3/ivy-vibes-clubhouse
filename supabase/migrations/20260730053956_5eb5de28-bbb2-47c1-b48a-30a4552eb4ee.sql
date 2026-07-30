-- ============================================================
-- Ivy Social Pipeline: unified approved-media model
-- ============================================================

do $$ begin create type public.media_source as enum ('upload','social'); exception when duplicate_object then null; end $$;
do $$ begin create type public.media_placement as enum ('hero','fresh_posts','ivy_tv','hall_of_fame','meme_machine'); exception when duplicate_object then null; end $$;

-- ---------- social_posts -------------------------------------------------
alter table public.social_posts
  add column if not exists source_account_id text,
  add column if not exists is_active boolean not null default true,
  add column if not exists allow_community_reuse boolean not null default false,
  add column if not exists approved_at timestamp with time zone,
  add column if not exists approval_source text,
  add column if not exists hashtags text[] not null default '{}',
  add column if not exists unavailable_at timestamp with time zone;

comment on column public.social_posts.caption is 'Ivy''s ORIGINAL platform caption, stored verbatim. Never overwritten by admins.';
comment on column public.social_posts.custom_caption is 'Optional website-only caption override. Never replaces the original caption.';
comment on column public.social_posts.source_account_id is 'Exact external platform account id. Auto-publish eligibility is matched on this, not on handle text.';

create unique index if not exists social_posts_platform_post_key
  on public.social_posts (platform, platform_post_id);
create index if not exists social_posts_published_idx
  on public.social_posts (published_at desc nulls last);
create index if not exists social_posts_public_idx
  on public.social_posts (approval_status, is_visible, is_active);

-- ---------- media_items --------------------------------------------------
alter table public.media_items
  add column if not exists caption text,
  add column if not exists permalink text,
  add column if not exists is_pinned boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists allow_autoplay boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists published_at timestamp with time zone;

-- ---------- social_connections ------------------------------------------
alter table public.social_connections
  add column if not exists external_account_id text,
  add column if not exists connected_at timestamp with time zone,
  add column if not exists scopes text[] not null default '{}',
  add column if not exists last_error text;

create unique index if not exists social_connections_platform_key
  on public.social_connections (platform);

comment on table public.social_connections is 'Non-sensitive connection metadata only. Raw tokens live in social_connection_secrets and are never exposed to the browser.';

-- ---------- project_config: automation settings --------------------------
alter table public.project_config
  add column if not exists auto_publish_verified_posts boolean not null default true,
  add column if not exists auto_categorize_verified_posts boolean not null default true,
  add column if not exists default_community_reuse boolean not null default false,
  add column if not exists automation_paused boolean not null default false;

-- ============================================================
-- Server-only secrets: encrypted tokens
-- ============================================================
create table if not exists public.social_connection_secrets (
  id uuid primary key default gen_random_uuid(),
  platform public.social_platform not null unique,
  access_token_cipher text,
  refresh_token_cipher text,
  cipher_alg text not null default 'aes-256-gcm',
  expires_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

comment on table public.social_connection_secrets is 'SERVER-ONLY. Access/refresh tokens encrypted by the application before insert (AES-256-GCM, key from SOCIAL_TOKEN_ENCRYPTION_KEY). No anon/authenticated grants. Tokens must never be logged or returned to a client.';

revoke all on public.social_connection_secrets from anon, authenticated;
grant all on public.social_connection_secrets to service_role;
alter table public.social_connection_secrets enable row level security;
-- Intentionally no policies: only service_role (which bypasses RLS) may read/write.

-- ============================================================
-- OAuth CSRF state
-- ============================================================
create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  platform public.social_platform not null,
  redirect_uri text not null,
  code_verifier text,
  expires_at timestamp with time zone not null default (now() + interval '10 minutes'),
  consumed_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

comment on table public.oauth_states is 'SERVER-ONLY short-lived OAuth anti-forgery state. No anon/authenticated grants.';

revoke all on public.oauth_states from anon, authenticated;
grant all on public.oauth_states to service_role;
alter table public.oauth_states enable row level security;

-- ============================================================
-- Multi-placement tags
-- ============================================================
create table if not exists public.media_placements (
  id uuid primary key default gen_random_uuid(),
  source_type public.media_source not null,
  source_id uuid not null,
  placement public.media_placement not null,
  is_auto boolean not null default true,
  created_at timestamp with time zone not null default now(),
  unique (source_type, source_id, placement)
);

create index if not exists media_placements_lookup_idx
  on public.media_placements (placement, source_type, source_id);

grant select on public.media_placements to anon;
grant select, insert, update, delete on public.media_placements to authenticated;
grant all on public.media_placements to service_role;
alter table public.media_placements enable row level security;

drop policy if exists media_placements_public_read on public.media_placements;
create policy media_placements_public_read on public.media_placements
  for select to anon, authenticated using (true);

drop policy if exists media_placements_staff_write on public.media_placements;
create policy media_placements_staff_write on public.media_placements
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- ============================================================
-- Audit logging: staff may write, admins may read
-- ============================================================
drop policy if exists audit_staff_insert on public.admin_audit_logs;
create policy audit_staff_insert on public.admin_audit_logs
  for insert to authenticated
  with check (public.is_staff(auth.uid()));
grant insert on public.admin_audit_logs to authenticated;
grant all on public.admin_audit_logs to service_role;
grant all on public.sync_runs to service_role;
grant all on public.social_posts to service_role;
grant all on public.social_connections to service_role;
grant all on public.media_items to service_role;
grant all on public.project_config to service_role;

-- ============================================================
-- Unified approved-media read model
-- ============================================================
drop view if exists public.unified_media;
create view public.unified_media
with (security_invoker = true) as
  select
    'social'::public.media_source            as source_type,
    sp.id                                    as source_id,
    sp.platform::text                        as platform,
    sp.platform_post_id                      as platform_post_id,
    sp.source_account_id                     as source_account_id,
    sp.account_name                          as account_name,
    sp.media_type                            as media_kind,
    sp.caption                               as original_caption,
    sp.custom_caption                        as website_caption,
    sp.hashtags                              as hashtags,
    sp.thumbnail_url                         as thumbnail_url,
    sp.fallback_thumbnail_url                as fallback_thumbnail_url,
    sp.media_url                             as media_url,
    sp.embed_url                             as embed_url,
    sp.permalink                             as permalink,
    sp.published_at                          as published_at,
    sp.duration                              as duration_seconds,
    sp.width                                 as width,
    sp.height                                as height,
    sp.alt_text                              as alt_text,
    sp.is_featured                           as is_featured,
    sp.is_pinned                             as is_pinned,
    sp.allow_autoplay                        as allow_autoplay,
    sp.allow_community_reuse                 as allow_community_reuse,
    0                                        as display_order,
    sp.approved_at                           as approved_at,
    sp.updated_at                            as updated_at
  from public.social_posts sp
  where sp.approval_status = 'approved'
    and sp.is_visible
    and sp.is_active
union all
  select
    'upload'::public.media_source,
    mi.id,
    null::text,
    null::text,
    null::text,
    mi.credit,
    mi.kind,
    coalesce(mi.caption, mi.title),
    null::text,
    '{}'::text[],
    coalesce(mi.thumbnail_url, mi.external_url),
    mi.thumbnail_url,
    mi.external_url,
    null::text,
    mi.permalink,
    coalesce(mi.published_at, mi.created_at),
    mi.duration_seconds,
    mi.width,
    mi.height,
    mi.alt_text,
    mi.is_featured,
    mi.is_pinned,
    mi.allow_autoplay,
    mi.usable_in_memes,
    mi.display_order,
    null::timestamp with time zone,
    mi.updated_at
  from public.media_items mi
  where mi.approval_status = 'approved'
    and mi.is_visible
    and mi.is_active;

comment on view public.unified_media is 'Single public read model combining approved+visible+active uploads and imported social posts. Original captions are preserved verbatim in original_caption; website_caption is an optional override.';

grant select on public.unified_media to anon, authenticated, service_role;

-- ============================================================
-- Safe first-owner bootstrap (no hard-coded credentials)
-- ============================================================
create or replace function public.bootstrap_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  existing integer;
begin
  if auth.uid() is null then
    return false;
  end if;
  select count(*) into existing from public.user_roles;
  if existing > 0 then
    return false;
  end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin')
    on conflict (user_id, role) do nothing;
  insert into public.admin_audit_logs (actor_id, action, entity_type, summary)
    values (auth.uid(), 'bootstrap_first_admin', 'user_roles', 'First owner claimed the admin role.');
  return true;
end;
$$;

revoke all on function public.bootstrap_first_admin() from public, anon;
grant execute on function public.bootstrap_first_admin() to authenticated;

-- ============================================================
-- Backfill placements for existing approved content
-- ============================================================
insert into public.media_placements (source_type, source_id, placement, is_auto)
select 'social'::public.media_source, sp.id,
       case when sp.media_type in ('video','reel') then 'ivy_tv'::public.media_placement
            else 'hall_of_fame'::public.media_placement end,
       true
from public.social_posts sp
where sp.approval_status = 'approved'
on conflict do nothing;

insert into public.media_placements (source_type, source_id, placement, is_auto)
select 'social'::public.media_source, sp.id, 'fresh_posts'::public.media_placement, true
from public.social_posts sp
where sp.approval_status = 'approved'
on conflict do nothing;

insert into public.media_placements (source_type, source_id, placement, is_auto)
select 'upload'::public.media_source, mi.id,
       case when mi.kind in ('video','reel') then 'ivy_tv'::public.media_placement
            else 'hall_of_fame'::public.media_placement end,
       true
from public.media_items mi
where mi.approval_status = 'approved'
on conflict do nothing;