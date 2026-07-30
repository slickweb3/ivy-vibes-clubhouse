drop policy if exists "social_posts_public_read" on public.social_posts;
create policy "social_posts_public_read" on public.social_posts
  for select to anon, authenticated
  using (is_visible and approval_status = 'approved'::approval_status and is_active);

drop policy if exists "media_items_public_read" on public.media_items;
create policy "media_items_public_read" on public.media_items
  for select to anon, authenticated
  using (is_visible and approval_status = 'approved'::approval_status and is_active);

drop policy if exists "media_placements_public_read" on public.media_placements;
create policy "media_placements_public_read" on public.media_placements
  for select to anon, authenticated
  using (
    (source_type = 'social'::media_source and exists (
      select 1 from public.social_posts sp
      where sp.id = media_placements.source_id
        and sp.is_visible and sp.approval_status = 'approved'::approval_status and sp.is_active
    ))
    or
    (source_type = 'upload'::media_source and exists (
      select 1 from public.media_items mi
      where mi.id = media_placements.source_id
        and mi.is_visible and mi.approval_status = 'approved'::approval_status and mi.is_active
    ))
  );