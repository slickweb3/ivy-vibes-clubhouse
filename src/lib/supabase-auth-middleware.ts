import { createMiddleware } from "@tanstack/react-start";

/**
 * Client-side bearer-token middleware for server functions.
 *
 * Replaces the generated `attachSupabaseAuth` for one reason: that version
 * statically imports the Supabase browser client, which drags the auth and
 * realtime clients (~100 kB gzipped) into the first bundle every visitor
 * downloads — even though only signed-in admins ever need a token.
 *
 * Here the client is imported lazily, and only when a Supabase session token
 * actually exists in storage. Signed-in users get exactly the same
 * `Authorization` header; anonymous visitors pay nothing.
 */
function hasStoredSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("sb-") && key.endsWith("-auth-token")) return true;
    }
    return false;
  } catch {
    // Storage blocked (private mode, hardened settings): be conservative and
    // let the Supabase client decide, so a real session is never dropped.
    return true;
  }
}

export const attachSupabaseAuthLazy = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (!hasStoredSession()) return next();
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
