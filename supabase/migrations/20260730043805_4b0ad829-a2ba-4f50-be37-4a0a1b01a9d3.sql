-- ============ enums ============
create type public.app_role as enum ('admin', 'editor', 'viewer');
create type public.social_platform as enum ('instagram', 'tiktok');
create type public.media_kind as enum ('image', 'video', 'carousel', 'reel');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.sync_source as enum ('manual', 'api');

-- ============ shared trigger ============
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============ roles ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','editor'))
$$;

create policy "user_roles_select_own" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "user_roles_admin_all" on public.user_roles for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ============ project config ============
create table public.project_config (
  id uuid primary key default gen_random_uuid(),
  project_name text not null default 'IvyVibing',
  ticker text not null default '$IVY',
  blockchain text,
  contract_address text,
  launch_date date,
  token_supply text,
  tokenomics_url text,
  explorer_url text,
  instagram_url text,
  tiktok_url text,
  x_url text,
  telegram_url text,
  discord_url text,
  contact_email text,
  instagram_enabled boolean not null default false,
  tiktok_enabled boolean not null default false,
  posts_per_platform integer not null default 3,
  sync_interval_hours integer not null default 12,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.project_config to anon, authenticated;
grant insert, update, delete on public.project_config to authenticated;
grant all on public.project_config to service_role;
alter table public.project_config enable row level security;
create policy "project_config_public_read" on public.project_config for select to anon, authenticated using (is_published);
create policy "project_config_staff_write" on public.project_config for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create trigger project_config_updated_at before update on public.project_config for each row execute function public.set_updated_at();

-- ============ content blocks ============
create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  section text not null default 'general',
  heading text,
  body text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.content_blocks to anon, authenticated;
grant insert, update, delete on public.content_blocks to authenticated;
grant all on public.content_blocks to service_role;
alter table public.content_blocks enable row level security;
create policy "content_blocks_public_read" on public.content_blocks for select to anon, authenticated using (is_visible);
create policy "content_blocks_staff_write" on public.content_blocks for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create index content_blocks_section_idx on public.content_blocks (section, display_order);
create trigger content_blocks_updated_at before update on public.content_blocks for each row execute function public.set_updated_at();

-- ============ media library ============
create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind public.media_kind not null default 'image',
  storage_path text,
  external_url text,
  thumbnail_url text,
  alt_text text not null default '',
  credit text,
  width integer,
  height integer,
  duration_seconds integer,
  approval_status public.approval_status not null default 'pending',
  is_visible boolean not null default false,
  usable_in_memes boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.media_items to anon, authenticated;
grant insert, update, delete on public.media_items to authenticated;
grant all on public.media_items to service_role;
alter table public.media_items enable row level security;
create policy "media_items_public_read" on public.media_items for select to anon, authenticated using (is_visible and approval_status = 'approved');
create policy "media_items_staff_write" on public.media_items for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create index media_items_visible_idx on public.media_items (is_visible, approval_status, display_order);
create trigger media_items_updated_at before update on public.media_items for each row execute function public.set_updated_at();

-- ============ social connections (no raw tokens) ============
create table public.social_connections (
  id uuid primary key default gen_random_uuid(),
  platform public.social_platform not null unique,
  account_name text,
  is_connected boolean not null default false,
  -- NEVER store raw provider tokens here. Only an opaque reference to a
  -- server-side secret store / vault entry.
  token_ref text,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  last_sync_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.social_connections to authenticated;
grant all on public.social_connections to service_role;
alter table public.social_connections enable row level security;
create policy "social_connections_admin_only" on public.social_connections for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger social_connections_updated_at before update on public.social_connections for each row execute function public.set_updated_at();

-- ============ social posts cache ============
create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform public.social_platform not null,
  platform_post_id text not null,
  account_name text,
  media_type public.media_kind not null default 'image',
  caption text,
  custom_caption text,
  thumbnail_url text,
  fallback_thumbnail_url text,
  media_url text,
  embed_url text,
  permalink text,
  published_at timestamptz,
  duration integer,
  width integer,
  height integer,
  is_featured boolean not null default false,
  is_pinned boolean not null default false,
  is_visible boolean not null default true,
  allow_autoplay boolean not null default false,
  alt_text text not null default '',
  last_synced_at timestamptz,
  sync_source public.sync_source not null default 'manual',
  approval_status public.approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, platform_post_id)
);
grant select on public.social_posts to anon, authenticated;
grant insert, update, delete on public.social_posts to authenticated;
grant all on public.social_posts to service_role;
alter table public.social_posts enable row level security;
create policy "social_posts_public_read" on public.social_posts for select to anon, authenticated using (is_visible and approval_status = 'approved');
create policy "social_posts_staff_write" on public.social_posts for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create index social_posts_feed_idx on public.social_posts (platform, is_visible, approval_status, is_pinned desc, published_at desc);
create trigger social_posts_updated_at before update on public.social_posts for each row execute function public.set_updated_at();

-- ============ sync runs ============
create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  platform public.social_platform not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'pending',
  items_fetched integer not null default 0,
  items_upserted integer not null default 0,
  items_marked_unavailable integer not null default 0,
  -- sanitized message only; never raw provider payloads or tokens
  message text,
  created_at timestamptz not null default now()
);
grant select on public.sync_runs to authenticated;
grant all on public.sync_runs to service_role;
alter table public.sync_runs enable row level security;
create policy "sync_runs_admin_read" on public.sync_runs for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create index sync_runs_platform_idx on public.sync_runs (platform, started_at desc);

-- ============ audit log ============
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  summary text,
  created_at timestamptz not null default now()
);
grant select on public.admin_audit_logs to authenticated;
grant all on public.admin_audit_logs to service_role;
alter table public.admin_audit_logs enable row level security;
create policy "audit_admin_read" on public.admin_audit_logs for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

-- ============ editable public content ============
create table public.faq_entries (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.faq_entries to anon, authenticated;
grant insert, update, delete on public.faq_entries to authenticated;
grant all on public.faq_entries to service_role;
alter table public.faq_entries enable row level security;
create policy "faq_public_read" on public.faq_entries for select to anon, authenticated using (is_visible);
create policy "faq_staff_write" on public.faq_entries for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create index faq_entries_order_idx on public.faq_entries (display_order);
create trigger faq_entries_updated_at before update on public.faq_entries for each row execute function public.set_updated_at();

create table public.timeline_chapters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.timeline_chapters to anon, authenticated;
grant insert, update, delete on public.timeline_chapters to authenticated;
grant all on public.timeline_chapters to service_role;
alter table public.timeline_chapters enable row level security;
create policy "timeline_public_read" on public.timeline_chapters for select to anon, authenticated using (is_visible);
create policy "timeline_staff_write" on public.timeline_chapters for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create index timeline_chapters_order_idx on public.timeline_chapters (display_order);
create trigger timeline_chapters_updated_at before update on public.timeline_chapters for each row execute function public.set_updated_at();

create table public.ivy_tv_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'All',
  media_item_id uuid references public.media_items(id) on delete set null,
  external_url text,
  poster_url text,
  caption text,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.ivy_tv_items to anon, authenticated;
grant insert, update, delete on public.ivy_tv_items to authenticated;
grant all on public.ivy_tv_items to service_role;
alter table public.ivy_tv_items enable row level security;
create policy "ivy_tv_public_read" on public.ivy_tv_items for select to anon, authenticated using (is_visible);
create policy "ivy_tv_staff_write" on public.ivy_tv_items for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create index ivy_tv_items_order_idx on public.ivy_tv_items (category, display_order);
create trigger ivy_tv_items_updated_at before update on public.ivy_tv_items for each row execute function public.set_updated_at();

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  caption text not null,
  media_item_id uuid references public.media_items(id) on delete set null,
  rotation numeric not null default 0,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.gallery_items to anon, authenticated;
grant insert, update, delete on public.gallery_items to authenticated;
grant all on public.gallery_items to service_role;
alter table public.gallery_items enable row level security;
create policy "gallery_public_read" on public.gallery_items for select to anon, authenticated using (is_visible);
create policy "gallery_staff_write" on public.gallery_items for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create index gallery_items_order_idx on public.gallery_items (display_order);
create trigger gallery_items_updated_at before update on public.gallery_items for each row execute function public.set_updated_at();

create table public.meme_images (
  id uuid primary key default gen_random_uuid(),
  media_item_id uuid references public.media_items(id) on delete cascade,
  label text not null,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.meme_images to anon, authenticated;
grant insert, update, delete on public.meme_images to authenticated;
grant all on public.meme_images to service_role;
alter table public.meme_images enable row level security;
create policy "meme_images_public_read" on public.meme_images for select to anon, authenticated using (is_visible);
create policy "meme_images_staff_write" on public.meme_images for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create trigger meme_images_updated_at before update on public.meme_images for each row execute function public.set_updated_at();

create table public.meme_captions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.meme_captions to anon, authenticated;
grant insert, update, delete on public.meme_captions to authenticated;
grant all on public.meme_captions to service_role;
alter table public.meme_captions enable row level security;
create policy "meme_captions_public_read" on public.meme_captions for select to anon, authenticated using (is_visible);
create policy "meme_captions_staff_write" on public.meme_captions for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create index meme_captions_order_idx on public.meme_captions (display_order);
create trigger meme_captions_updated_at before update on public.meme_captions for each row execute function public.set_updated_at();

create table public.legal_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  body text not null,
  is_draft boolean not null default true,
  is_published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.legal_pages to anon, authenticated;
grant insert, update, delete on public.legal_pages to authenticated;
grant all on public.legal_pages to service_role;
alter table public.legal_pages enable row level security;
create policy "legal_public_read" on public.legal_pages for select to anon, authenticated using (is_published);
create policy "legal_staff_write" on public.legal_pages for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create trigger legal_pages_updated_at before update on public.legal_pages for each row execute function public.set_updated_at();

-- ============ safe seed data (no invented token/social facts) ============
insert into public.project_config (project_name, ticker) values ('IvyVibing', '$IVY');

insert into public.content_blocks (key, section, heading, body, display_order) values
  ('announcement', 'announcement', null, '$IVY is getting ready to hop online. Official links and contract address coming soon.', 0),
  ('hero.headline', 'hero', 'SHORT SPINE. BIG VIBES.', 'Meet Ivy—the internet''s beloved Frog Queen, professional grass roller and undisputed master of doing everything her own way. $IVY is a community meme coin celebrating the dog who proved that being built different is a superpower.', 1),
  ('meet.heading', 'meet-ivy', 'Built Different. Loved Everywhere.', 'Ivy lives life in a shape entirely her own. Her compact body means she sometimes moves through the world differently, but Ivy has never let that interfere with having fun. Whether she is rotating, rolling through the grass, hopping like a frog or staring directly into the camera, Ivy turns ordinary moments into internet history.', 2),
  ('owner.heading', 'owners-corner', 'Behind Every Queen Is a Very Dedicated Human', 'Ivy''s online story exists because someone has cared for her, understood her needs and shared her personality with the world. $IVY should always respect the bond at the centre of the project.', 3);

insert into public.timeline_chapters (title, display_order) values
  ('Ivy enters the world built completely different', 0),
  ('The Frog Queen personality emerges', 1),
  ('Ivy''s unusual movement captures the internet', 2),
  ('Grass rolling becomes a royal tradition', 3),
  ('The IvyVibing community grows', 4),
  ('The Short Spine Queen becomes an internet favourite', 5),
  ('$IVY begins its next chapter', 6);

insert into public.faq_entries (question, answer, display_order) values
  ('What is $IVY?', '$IVY is a community meme coin inspired by IvyVibing and created to celebrate Ivy, her owner and the community surrounding her.', 0),
  ('Is the token live?', 'Not yet. The official blockchain, launch date and verified contract address will be published on this website.', 1),
  ('Where can I find official links?', 'All official social links will be added directly to this website. Treat any other account or contract as unverified until then.', 2),
  ('Does buying $IVY guarantee a return?', 'No. Meme coins and digital assets are highly speculative and may lose some or all of their value.', 3),
  ('Does the project support Ivy?', 'The project states that creator rewards and specified proceeds are intended to benefit Ivy and her owners. Detailed allocation information should be published before launch.', 4),
  ('Is short spine syndrome a dog breed?', 'No. It is a condition, not a breed.', 5),
  ('Can I use Ivy''s photographs?', 'Only media specifically approved for community use may be reused.', 6),
  ('Are the Instagram and TikTok posts updated automatically?', 'When Ivy''s official accounts are connected, the website retrieves and displays the three most recent approved posts from each platform through a secure server-side synchronization system.', 7),
  ('Why is a recent post missing?', 'A post may be temporarily unavailable, private, unsupported, awaiting approval or manually hidden by the website administrator.', 8);

insert into public.gallery_items (caption, display_order) values
  ('An absolute unit of royalty.', 0),
  ('Frog mode activated.', 1),
  ('Built like a legend.', 2),
  ('No neck. No problem.', 3),
  ('Queen of the rotation.', 4),
  ('Grass inspection in progress.', 5),
  ('Main-character energy.', 6),
  ('The shape of greatness.', 7),
  ('Tiny spine. Massive presence.', 8),
  ('She came. She saw. She rotated.', 9),
  ('Royal business only.', 10),
  ('Vibing at maximum capacity.', 11);

insert into public.meme_captions (text, display_order) values
  ('Frog Mode Activated', 0),
  ('Short Spine Long Legacy', 1),
  ('Bow Before the Queen', 2),
  ('Built Different', 3),
  ('Vibing Is the Utility', 4),
  ('Stay Weird', 5),
  ('$IVY Energy', 6),
  ('Royal Behaviour', 7),
  ('Touch Grass With Ivy', 8),
  ('Queen of the Rotation', 9),
  ('Maximum Frog', 10),
  ('The Shape of Greatness', 11),
  ('Internet Royalty', 12),
  ('Long Live Ivy', 13);

insert into public.social_connections (platform, is_connected) values ('instagram', false), ('tiktok', false);

insert into public.legal_pages (slug, title, summary, body, display_order) values
  ('terms', 'Terms of Use', 'The rules for using the IvyVibing website.', 'DRAFT TEMPLATE — requires professional legal review before launch.', 0),
  ('privacy', 'Privacy Policy', 'What IvyVibing does and does not collect.', 'DRAFT TEMPLATE — requires professional legal review before launch.', 1),
  ('cookies', 'Cookie Policy', 'How optional cookies and third-party embeds are handled.', 'DRAFT TEMPLATE — requires professional legal review before launch.', 2),
  ('risk-disclosure', 'Risk Disclosure', 'Important risk information about $IVY.', 'DRAFT TEMPLATE — requires professional legal review before launch.', 3),
  ('media-usage', 'Media Usage Policy', 'How Ivy''s photographs and videos may be used.', 'DRAFT TEMPLATE — requires professional legal review before launch.', 4),
  ('community-guidelines', 'Community Guidelines', 'How the IvyVibing community treats Ivy and each other.', 'DRAFT TEMPLATE — requires review before launch.', 5),
  ('accessibility', 'Accessibility Statement', 'Our commitment to an accessible clubhouse.', 'DRAFT TEMPLATE — requires review before launch.', 6);