create table if not exists public.curated_social_posts (
  id uuid primary key default gen_random_uuid(),
  platform public.social_platform not null,
  original_post_url text not null,
  platform_post_id text not null,
  official_embed_url text not null,
  admin_label text,
  placements text[] not null default '{}'::text[],
  is_visible boolean not null default true,
  is_active boolean not null default true,
  is_pinned boolean not null default false,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  source_account_handle text not null,
  source_account_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curated_social_posts_platform_post_id_key unique (platform, platform_post_id)
);

grant select on public.curated_social_posts to anon;
grant select, insert, update, delete on public.curated_social_posts to authenticated;
grant all on public.curated_social_posts to service_role;

alter table public.curated_social_posts enable row level security;

drop policy if exists "curated_public_read" on public.curated_social_posts;
create policy "curated_public_read" on public.curated_social_posts
  for select to anon, authenticated
  using (is_visible = true and is_active = true);

drop policy if exists "curated_staff_manage" on public.curated_social_posts;
create policy "curated_staff_manage" on public.curated_social_posts
  for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop trigger if exists set_curated_social_posts_updated_at on public.curated_social_posts;
create trigger set_curated_social_posts_updated_at
  before update on public.curated_social_posts
  for each row execute function public.set_updated_at();

create index if not exists curated_social_posts_order_idx
  on public.curated_social_posts (display_order, created_at desc);

insert into public.curated_social_posts
  (platform, original_post_url, platform_post_id, official_embed_url, admin_label, placements,
   is_pinned, is_featured, display_order, source_account_handle, source_account_url)
values
  ('instagram','https://www.instagram.com/p/Co5DPaZOJfL/','Co5DPaZOJfL','https://www.instagram.com/p/Co5DPaZOJfL/embed/',null,array['hero','fresh_posts','hall_of_fame'],true,true,0,'frogqueenivy','https://www.instagram.com/frogqueenivy/'),
  ('instagram','https://www.instagram.com/p/CTDtZqNjK4w/','CTDtZqNjK4w','https://www.instagram.com/p/CTDtZqNjK4w/embed/',null,array['fresh_posts','hall_of_fame'],false,false,1,'frogqueenivy','https://www.instagram.com/frogqueenivy/'),
  ('instagram','https://www.instagram.com/p/CmuVtM9OWI9/','CmuVtM9OWI9','https://www.instagram.com/p/CmuVtM9OWI9/embed/',null,array['fresh_posts','hall_of_fame'],false,false,2,'frogqueenivy','https://www.instagram.com/frogqueenivy/'),
  ('instagram','https://www.instagram.com/p/Cm1i2Dpuw8A/','Cm1i2Dpuw8A','https://www.instagram.com/p/Cm1i2Dpuw8A/embed/',null,array['fresh_posts','hall_of_fame'],false,false,3,'frogqueenivy','https://www.instagram.com/frogqueenivy/'),
  ('instagram','https://www.instagram.com/p/CmZgAC3OGFg/','CmZgAC3OGFg','https://www.instagram.com/p/CmZgAC3OGFg/embed/',null,array['fresh_posts','hall_of_fame'],false,false,4,'frogqueenivy','https://www.instagram.com/frogqueenivy/'),
  ('tiktok','https://www.tiktok.com/@ivyvibing/video/7279071550781787438','7279071550781787438','https://www.tiktok.com/player/v1/7279071550781787438?description=1&music_info=1&autoplay=0&rel=0','I''m proud of my little lady',array['fresh_posts','ivy_tv'],false,true,0,'ivyvibing','https://www.tiktok.com/@ivyvibing'),
  ('tiktok','https://www.tiktok.com/@ivyvibing/video/7500005956563160366','7500005956563160366','https://www.tiktok.com/player/v1/7500005956563160366?description=1&music_info=1&autoplay=0&rel=0','Hi',array['fresh_posts','ivy_tv'],false,false,1,'ivyvibing','https://www.tiktok.com/@ivyvibing'),
  ('tiktok','https://www.tiktok.com/@ivyvibing/video/7442378479363951903','7442378479363951903','https://www.tiktok.com/player/v1/7442378479363951903?description=1&music_info=1&autoplay=0&rel=0','Someday',array['fresh_posts','ivy_tv'],false,false,2,'ivyvibing','https://www.tiktok.com/@ivyvibing'),
  ('tiktok','https://www.tiktok.com/@ivyvibing/video/7424127387199180063','7424127387199180063','https://www.tiktok.com/player/v1/7424127387199180063?description=1&music_info=1&autoplay=0&rel=0','Ivy time',array['fresh_posts','ivy_tv'],false,false,3,'ivyvibing','https://www.tiktok.com/@ivyvibing'),
  ('tiktok','https://www.tiktok.com/@ivyvibing/video/7371927518817045806','7371927518817045806','https://www.tiktok.com/player/v1/7371927518817045806?description=1&music_info=1&autoplay=0&rel=0','I pull up',array['fresh_posts','ivy_tv'],false,false,4,'ivyvibing','https://www.tiktok.com/@ivyvibing'),
  ('tiktok','https://www.tiktok.com/@ivyvibing/video/7352282047852842271','7352282047852842271','https://www.tiktok.com/player/v1/7352282047852842271?description=1&music_info=1&autoplay=0&rel=0','Does this song fit',array['fresh_posts','ivy_tv'],false,false,5,'ivyvibing','https://www.tiktok.com/@ivyvibing'),
  ('tiktok','https://www.tiktok.com/@ivyvibing/video/7345601688486579487','7345601688486579487','https://www.tiktok.com/player/v1/7345601688486579487?description=1&music_info=1&autoplay=0&rel=0','Funky',array['fresh_posts','ivy_tv'],false,false,6,'ivyvibing','https://www.tiktok.com/@ivyvibing'),
  ('tiktok','https://www.tiktok.com/@ivyvibing/video/7340003586060848415','7340003586060848415','https://www.tiktok.com/player/v1/7340003586060848415?description=1&music_info=1&autoplay=0&rel=0','I don''t know',array['fresh_posts','ivy_tv'],false,false,7,'ivyvibing','https://www.tiktok.com/@ivyvibing')
on conflict (platform, platform_post_id) do nothing;