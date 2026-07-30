/**
 * Auth / RBAC scaffolding.
 *
 * NOTHING here authenticates anyone yet. Once Lovable Cloud is enabled, wire
 * `getCurrentSession` to a `requireSupabaseAuth` server function and read roles
 * from the `user_roles` table (roles are NEVER stored on the profile row).
 */

export type AppRole = "owner" | "admin" | "editor" | "viewer";

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  owner: ["*"],
  admin: ["content:write", "media:approve", "social:sync", "audit:read", "users:manage"],
  editor: ["content:write", "media:approve"],
  viewer: ["content:read", "audit:read"],
};

export interface AdminSession {
  userId: string;
  email: string;
  roles: AppRole[];
}

export function hasPermission(session: AdminSession | null, permission: string): boolean {
  if (!session) return false;
  return session.roles.some((role) => {
    const perms = ROLE_PERMISSIONS[role] ?? [];
    return perms.includes("*") || perms.includes(permission);
  });
}

/** Audit log entry shape mirroring the `audit_logs` table in the migration. */
export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/** Placeholder: returns null until authentication is configured. */
export function getClientSession(): AdminSession | null {
  return null;
}
