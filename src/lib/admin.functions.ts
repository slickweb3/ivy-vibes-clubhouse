/**
 * Protected admin server functions.
 *
 * Every function requires an authenticated caller and re-checks that the
 * caller holds an admin/editor role via the database. Nothing here returns a
 * secret, a token or a raw provider payload.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminStatus {
  signedIn: boolean;
  email: string | null;
  roles: string[];
  isStaff: boolean;
  setupRequired: boolean;
}

/** Reports the caller's role. `setupRequired` means no role has been granted yet. */
export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (data ?? []).map((row: { role: string }) => row.role);
    const isStaff = roles.includes("admin") || roles.includes("editor");

    const status: AdminStatus = {
      signedIn: true,
      email: (claims as { email?: string } | null)?.email ?? null,
      roles,
      isStaff,
      setupRequired: !isStaff,
    };
    return status;
  });

export interface ConnectionCard {
  platform: "instagram" | "tiktok";
  connected: boolean;
  accountName: string | null;
  lastSyncAt: string | null;
  tokenRenewal: string;
  credentialsConfigured: boolean;
  missingEnvVars: string[];
  setupUrl: string;
}

/** Connection cards for the admin dashboard. Honest, never optimistic. */
export const getConnectionCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (roleRows ?? []).map((row: { role: string }) => row.role);
    if (!roles.includes("admin")) throw new Error("Forbidden");

    const { allProviderStatuses } = await import("@/lib/social-oauth.server");
    const { data } = await supabase
      .from("social_connections")
      .select("platform, account_name, is_connected, last_sync_at, token_expires_at");

    const rows = (data ?? []) as Array<{
      platform: "instagram" | "tiktok";
      account_name: string | null;
      is_connected: boolean;
      last_sync_at: string | null;
      token_expires_at: string | null;
    }>;

    const cards: ConnectionCard[] = allProviderStatuses().map((status) => {
      const row = rows.find((r) => r.platform === status.platform);
      return {
        platform: status.platform,
        connected: Boolean(row?.is_connected),
        accountName: row?.account_name ?? null,
        lastSyncAt: row?.last_sync_at ?? null,
        tokenRenewal: row?.token_expires_at ? `Renews ${row.token_expires_at}` : "Not configured",
        credentialsConfigured: status.configured,
        missingEnvVars: status.missing,
        setupUrl: status.setupUrl,
      };
    });

    return cards;
  });

/** Manual refresh trigger for administrators. Sanitized results only. */
export const refreshSocialFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (roleRows ?? []).map((row: { role: string }) => row.role);
    if (!roles.includes("admin")) throw new Error("Forbidden");

    const { runScheduledSync } = await import("@/lib/social-sync.server");
    const results = await runScheduledSync();
    return { ranAt: new Date().toISOString(), results };
  });
