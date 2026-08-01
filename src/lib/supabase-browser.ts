/**
 * Lazy accessor for the Supabase browser client.
 *
 * Importing `@/integrations/supabase/client` at module scope from a route file
 * pins the auth + realtime clients (~100 kB gzipped) into the bundle every
 * visitor downloads, because route configuration is never code-split. Admin and
 * auth screens call this instead so that weight loads only when someone
 * actually signs in.
 */
export async function getSupabaseBrowserClient() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}
