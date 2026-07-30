create policy "oauth_states_no_client_access" on public.oauth_states
  as restrictive for all to anon, authenticated using (false) with check (false);

create policy "social_connection_secrets_no_client_access" on public.social_connection_secrets
  as restrictive for all to anon, authenticated using (false) with check (false);

revoke all on public.oauth_states from anon, authenticated;
revoke all on public.social_connection_secrets from anon, authenticated;

revoke execute on function public.bootstrap_first_admin() from anon;
revoke execute on function public.has_role(uuid, app_role) from anon;
revoke execute on function public.is_staff(uuid) from anon;