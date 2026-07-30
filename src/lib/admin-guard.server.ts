/**
 * Shared admin guards. Server-only.
 * Never returns secrets and never trusts client-supplied role claims.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Db = SupabaseClient<Database>;

export async function rolesFor(supabase: Db, userId: string): Promise<string[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((row) => row.role as string);
}

export async function requireStaff(supabase: Db, userId: string): Promise<string[]> {
  const roles = await rolesFor(supabase, userId);
  if (!roles.includes("admin") && !roles.includes("editor")) throw new Error("Forbidden");
  return roles;
}

export async function requireAdmin(supabase: Db, userId: string): Promise<string[]> {
  const roles = await rolesFor(supabase, userId);
  if (!roles.includes("admin")) throw new Error("Forbidden");
  return roles;
}

export async function audit(
  supabase: Db,
  userId: string,
  entry: { action: string; entityType?: string; entityId?: string; summary: string },
): Promise<void> {
  await supabase.from("admin_audit_logs").insert({
    actor_id: userId,
    action: entry.action,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    summary: entry.summary,
  });
}
