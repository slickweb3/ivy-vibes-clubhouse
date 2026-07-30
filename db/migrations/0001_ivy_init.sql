-- IvyVibing initial schema
-- PostgreSQL / Supabase. RLS enabled on every public table, with explicit
-- GRANTs (PostgREST does not grant public-schema privileges by default).
-- Apply this once Lovable Cloud is enabled.

-- ---------------------------------------------------------------- roles

create type public.app_role as enum ('owner', 'admin', 'editor', 'viewer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
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
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('owner', 'admin', 'editor')
  )
$$;

create policy "users read own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create policy "owners manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- ------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- -------------------------------------------------- social connections

create type public.social_platform as enum ('instagram', 'tiktok', 'manual');

create table public.social_connections (
  id uuid primary key default gen_random_uuid(),
  platform public.social_platform not null,
  account_handle text,
  -- tokens are service-role only; never exposed to anon/authenticated
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  connected_at timestamptz,
  last_synced_at timestamptz,
  sync_interval_hours integer not null default 12,
  is_active boolean not null default false,
  unique (platform, account_handle)
);

grant all on public.social_connections to service_role;

alter table public.social_connections enable row level security;
-- No anon/authenticated grants by design.

-- --------------------------------------------------------- social posts

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform public.social_platform not null,
  external_id text,
  permalink text,
  caption text not null default '',
  posted_at timestamptz,
  like_count integer,
  comment_count integer,
  is_fallback boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_id)
);

create index social_posts_published_idx
  on public.social_posts (is_published, posted_at desc nulls last);

grant select on public.social_posts to anon;
grant select, insert, update, delete on public.social_posts to authenticated;
grant all on public.social_posts to service_role;

alter table public.social_posts enable row level security;

create policy "public reads published posts"
  on public.social_posts for select to anon
  using (is_published = true);

create policy "staff read all posts"
  on public.social_posts for select to authenticated
  using (public.is_staff(auth.uid()) or is_published = true);

create policy "staff write posts"
  on public.social_posts for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- --------------------------------------------------------- social media

create type public.media_kind as enum ('image', 'video', 'carousel', 'placeholder');

create table public.social_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  kind public.media_kind not null default 'placeholder',
  url text,
  thumbnail_url text,
  alt_text text not null default '',
  width integer,
  height integer,
  duration_seconds integer,
  owner_approved boolean not null default false,
  sort_order integer not null default 0
);

create index social_media_post_idx on public.social_media (post_id, sort_order);

grant select on public.social_media to anon;
grant select, insert, update, delete on public.social_media to authenticated;
grant all on public.social_media to service_role;

alter table public.social_media enable row level security;

create policy "public reads approved media of published posts"
  on public.social_media for select to anon
  using (
    owner_approved = true
    and exists (
      select 1 from public.social_posts p
      where p.id = post_id and p.is_published = true
    )
  );

create policy "staff read all media"
  on public.social_media for select to authenticated
  using (public.is_staff(auth.uid()));

create policy "staff write media"
  on public.social_media for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- -------------------------------------------------------- content pages

create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  body jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

grant select on public.content_pages to anon;
grant select, insert, update, delete on public.content_pages to authenticated;
grant all on public.content_pages to service_role;

alter table public.content_pages enable row level security;

create policy "public reads published pages"
  on public.content_pages for select to anon
  using (is_published = true);

create policy "staff read all pages"
  on public.content_pages for select to authenticated
  using (public.is_staff(auth.uid()) or is_published = true);

create policy "staff write pages"
  on public.content_pages for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- ----------------------------------------------------------- audit logs

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);

grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;

alter table public.audit_logs enable row level security;

create policy "staff read audit logs"
  on public.audit_logs for select to authenticated
  using (public.is_staff(auth.uid()));

-- ---------------------------------------------------------- token record

create table public.token_record (
  id boolean primary key default true check (id),
  token_name text,
  ticker text default '$IVY',
  blockchain text,
  contract_address text,
  total_supply text,
  taxes text,
  liquidity text,
  launch_date text,
  explorer_url text,
  audit_status text,
  exchanges text[] not null default '{}',
  partnerships text[] not null default '{}',
  updated_at timestamptz not null default now()
);

grant select on public.token_record to anon;
grant select on public.token_record to authenticated;
grant all on public.token_record to service_role;

alter table public.token_record enable row level security;

create policy "public reads token record"
  on public.token_record for select to anon using (true);

create policy "authenticated reads token record"
  on public.token_record for select to authenticated using (true);

create policy "owners write token record"
  on public.token_record for all to authenticated
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- Single row; every unverified field stays NULL -> renders "Coming Soon".
insert into public.token_record (id, ticker) values (true, '$IVY')
on conflict (id) do nothing;
