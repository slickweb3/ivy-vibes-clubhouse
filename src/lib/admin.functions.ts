/**
 * Protected admin server functions.
 *
 * Every function requires an authenticated caller and re-checks the caller's
 * role in the database. Nothing here returns a token, a secret or a raw
 * provider payload.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Placement } from "@/types/media";

export interface AdminStatus {
  signedIn: boolean;
  email: string | null;
  roles: string[];
  isStaff: boolean;
  isAdmin: boolean;
  setupRequired: boolean;
  canBootstrap: boolean;
}

/** Reports the caller's role. `setupRequired` means no role has been granted yet. */
export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStatus> => {
    const { supabase, userId, claims } = context;
    const { rolesFor } = await import("@/lib/admin-guard.server");
    const roles = await rolesFor(supabase, userId);
    const isStaff = roles.includes("admin") || roles.includes("editor");

    // Bootstrap is only offered while no role exists anywhere in the project.
    const { count } = await supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true });

    return {
      signedIn: true,
      email: (claims as { email?: string } | null)?.email ?? null,
      roles,
      isStaff,
      isAdmin: roles.includes("admin"),
      setupRequired: !isStaff,
      canBootstrap: !isStaff && (count ?? 0) === 0,
    };
  });

/** Safe first-owner bootstrap. Succeeds only while the project has no roles. */
export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("bootstrap_first_admin");
    if (error) throw new Error("Bootstrap unavailable.");
    return { granted: data === true };
  });

/* ------------------------------------------------------------ connections */

export interface ConnectionCard {
  platform: "instagram" | "tiktok";
  connected: boolean;
  accountName: string | null;
  externalAccountId: string | null;
  officialHandle: string;
  officialUrl: string;
  verified: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  tokenRenewal: string;
  credentialsConfigured: boolean;
  missingEnvVars: string[];
  setupUrl: string;
  redirectUri: string | null;
  scopes: string[];
  authorizeUrl: string;
}

/** Connection cards for the admin dashboard. Honest, never optimistic. */
export const getConnectionCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConnectionCard[]> => {
    const { supabase, userId } = context;
    const { requireAdmin } = await import("@/lib/admin-guard.server");
    await requireAdmin(supabase, userId);

    const { allProviderStatuses, OFFICIAL_ACCOUNTS } = await import("@/lib/social-oauth.server");
    const { data } = await supabase
      .from("social_connections")
      .select(
        "platform, account_name, is_connected, last_sync_at, last_sync_status, token_expires_at, external_account_id",
      );

    const rows = (data ?? []) as Array<Record<string, unknown>>;

    return allProviderStatuses().map((status) => {
      const row = rows.find((r) => r.platform === status.platform);
      const official = OFFICIAL_ACCOUNTS[status.platform];
      const accountName = (row?.account_name as string | null) ?? null;
      const externalAccountId = (row?.external_account_id as string | null) ?? null;
      const connected = Boolean(row?.is_connected);
      const expires = (row?.token_expires_at as string | null) ?? null;

      return {
        platform: status.platform,
        connected,
        accountName,
        externalAccountId,
        officialHandle: official.handle,
        officialUrl: official.url,
        verified:
          connected &&
          Boolean(externalAccountId) &&
          accountName?.toLowerCase() === official.handle.toLowerCase(),
        lastSyncAt: (row?.last_sync_at as string | null) ?? null,
        lastSyncStatus: (row?.last_sync_status as string | null) ?? null,
        tokenRenewal: expires ? `Renews ${new Date(expires).toLocaleDateString()}` : "Not configured",
        credentialsConfigured: status.configured,
        missingEnvVars: status.missing,
        setupUrl: status.setupUrl,
        redirectUri: status.redirectUri,
        scopes: status.scopes,
        authorizeUrl: `/api/public/oauth/${status.platform}/authorize`,
      };
    });
  });

/** Manual refresh trigger for administrators. Sanitized results only. */
export const refreshSocialFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { requireAdmin, audit } = await import("@/lib/admin-guard.server");
    await requireAdmin(supabase, userId);

    const { runScheduledSync } = await import("@/lib/social-sync.server");
    const results = await runScheduledSync();
    await audit(supabase, userId, {
      action: "manual_sync",
      entityType: "social_posts",
      summary: "Administrator triggered Refresh Now.",
    });
    return { ranAt: new Date().toISOString(), results };
  });

/** Disconnect a platform: revokes local storage of the token reference. */
export const disconnectPlatform = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { platform: "instagram" | "tiktok" }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { requireAdmin, audit } = await import("@/lib/admin-guard.server");
    await requireAdmin(supabase, userId);

    const oauth = await import("@/lib/social-oauth.server");
    await oauth.clearTokens(data.platform);
    await oauth.upsertConnection(data.platform, {
      is_connected: false,
      token_ref: null,
      token_expires_at: null,
      external_account_id: null,
    });
    await audit(supabase, userId, {
      action: "disconnect_platform",
      entityType: "social_connections",
      entityId: data.platform,
      summary: `Disconnected ${data.platform}. Imported posts were kept.`,
    });
    return { ok: true };
  });

/* -------------------------------------------------------------- settings */

export interface AutomationSettings {
  autoPublishVerifiedPosts: boolean;
  autoCategorizeVerifiedPosts: boolean;
  defaultCommunityReuse: boolean;
  automationPaused: boolean;
}

export const getAutomationSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AutomationSettings> => {
    const { supabase, userId } = context;
    const { requireStaff } = await import("@/lib/admin-guard.server");
    await requireStaff(supabase, userId);

    const { data } = await supabase
      .from("project_config")
      .select(
        "auto_publish_verified_posts, auto_categorize_verified_posts, default_community_reuse, automation_paused",
      )
      .limit(1)
      .maybeSingle();

    const row = (data ?? {}) as Record<string, boolean | undefined>;
    return {
      autoPublishVerifiedPosts: row.auto_publish_verified_posts ?? true,
      autoCategorizeVerifiedPosts: row.auto_categorize_verified_posts ?? true,
      defaultCommunityReuse: row.default_community_reuse ?? false,
      automationPaused: row.automation_paused ?? false,
    };
  });

export const updateAutomationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<AutomationSettings>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { requireAdmin, audit } = await import("@/lib/admin-guard.server");
    await requireAdmin(supabase, userId);

    const patch: Record<string, boolean> = {};
    if (data.autoPublishVerifiedPosts !== undefined)
      patch.auto_publish_verified_posts = data.autoPublishVerifiedPosts;
    if (data.autoCategorizeVerifiedPosts !== undefined)
      patch.auto_categorize_verified_posts = data.autoCategorizeVerifiedPosts;
    if (data.defaultCommunityReuse !== undefined)
      patch.default_community_reuse = data.defaultCommunityReuse;
    if (data.automationPaused !== undefined) patch.automation_paused = data.automationPaused;

    const { data: row } = await supabase.from("project_config").select("id").limit(1).maybeSingle();
    if (row)
      await supabase
        .from("project_config")
        .update(patch as never)
        .eq("id", (row as { id: string }).id);

    await audit(supabase, userId, {
      action: "update_automation_settings",
      entityType: "project_config",
      summary: `Automation settings updated: ${Object.keys(patch).join(", ")}.`,
    });
    return { ok: true };
  });

/* ------------------------------------------------------------ media admin */

export interface AdminMediaRow {
  sourceType: "social" | "upload";
  sourceId: string;
  platform: string | null;
  platformPostId: string | null;
  sourceAccountId: string | null;
  accountName: string | null;
  mediaKind: string;
  /** Read-only: Ivy's original caption, verbatim. */
  originalCaption: string | null;
  websiteCaption: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  fallbackThumbnailUrl: string | null;
  altText: string;
  approvalStatus: string;
  isVisible: boolean;
  isActive: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  allowAutoplay: boolean;
  allowCommunityReuse: boolean;
  publishedAt: string | null;
  approvedAt: string | null;
  approvalSource: string | null;
  placements: Placement[];
}

export const listAdminMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminMediaRow[]> => {
    const { supabase, userId } = context;
    const { requireStaff } = await import("@/lib/admin-guard.server");
    await requireStaff(supabase, userId);

    const [posts, uploads, placements] = await Promise.all([
      supabase
        .from("social_posts")
        .select(
          "id, platform, platform_post_id, source_account_id, account_name, media_type, caption, custom_caption, permalink, thumbnail_url, fallback_thumbnail_url, alt_text, approval_status, is_visible, is_active, is_pinned, is_featured, allow_autoplay, allow_community_reuse, published_at, approved_at, approval_source",
        )
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(200),
      supabase
        .from("media_items")
        .select(
          "id, kind, title, caption, alt_text, permalink, thumbnail_url, external_url, approval_status, is_visible, is_active, is_pinned, is_featured, allow_autoplay, usable_in_memes, published_at",
        )
        .order("display_order", { ascending: true })
        .limit(200),
      supabase.from("media_placements").select("source_type, source_id, placement").limit(2000),
    ]);

    const placementMap = new Map<string, Placement[]>();
    for (const row of (placements.data ?? []) as Array<Record<string, string>>) {
      const key = `${row.source_type}:${row.source_id}`;
      placementMap.set(key, [...(placementMap.get(key) ?? []), row.placement as Placement]);
    }

    const social: AdminMediaRow[] = ((posts.data ?? []) as Array<Record<string, unknown>>).map(
      (row) => ({
        sourceType: "social",
        sourceId: String(row.id),
        platform: (row.platform as string) ?? null,
        platformPostId: (row.platform_post_id as string) ?? null,
        sourceAccountId: (row.source_account_id as string) ?? null,
        accountName: (row.account_name as string) ?? null,
        mediaKind: (row.media_type as string) ?? "image",
        originalCaption: (row.caption as string) ?? null,
        websiteCaption: (row.custom_caption as string) ?? null,
        permalink: (row.permalink as string) ?? null,
        thumbnailUrl: (row.thumbnail_url as string) ?? null,
        fallbackThumbnailUrl: (row.fallback_thumbnail_url as string) ?? null,
        altText: (row.alt_text as string) ?? "",
        approvalStatus: (row.approval_status as string) ?? "pending",
        isVisible: Boolean(row.is_visible),
        isActive: Boolean(row.is_active),
        isPinned: Boolean(row.is_pinned),
        isFeatured: Boolean(row.is_featured),
        allowAutoplay: Boolean(row.allow_autoplay),
        allowCommunityReuse: Boolean(row.allow_community_reuse),
        publishedAt: (row.published_at as string) ?? null,
        approvedAt: (row.approved_at as string) ?? null,
        approvalSource: (row.approval_source as string) ?? null,
        placements: placementMap.get(`social:${row.id}`) ?? [],
      }),
    );

    const upload: AdminMediaRow[] = ((uploads.data ?? []) as Array<Record<string, unknown>>).map(
      (row) => ({
        sourceType: "upload",
        sourceId: String(row.id),
        platform: null,
        platformPostId: null,
        sourceAccountId: null,
        accountName: null,
        mediaKind: (row.kind as string) ?? "image",
        originalCaption: ((row.caption as string) ?? (row.title as string)) ?? null,
        websiteCaption: null,
        permalink: (row.permalink as string) ?? null,
        thumbnailUrl: ((row.thumbnail_url as string) ?? (row.external_url as string)) ?? null,
        fallbackThumbnailUrl: (row.thumbnail_url as string) ?? null,
        altText: (row.alt_text as string) ?? "",
        approvalStatus: (row.approval_status as string) ?? "pending",
        isVisible: Boolean(row.is_visible),
        isActive: Boolean(row.is_active),
        isPinned: Boolean(row.is_pinned),
        isFeatured: Boolean(row.is_featured),
        allowAutoplay: Boolean(row.allow_autoplay),
        allowCommunityReuse: Boolean(row.usable_in_memes),
        publishedAt: (row.published_at as string) ?? null,
        approvedAt: null,
        approvalSource: null,
        placements: placementMap.get(`upload:${row.id}`) ?? [],
      }),
    );

    return [...social, ...upload];
  });

export interface MediaUpdateInput {
  sourceType: "social" | "upload";
  sourceId: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  isVisible?: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
  allowAutoplay?: boolean;
  allowCommunityReuse?: boolean;
  altText?: string;
  websiteCaption?: string | null;
  fallbackThumbnailUrl?: string | null;
  placements?: Placement[];
}

/**
 * Administrator edits. These change ONLY how an item appears on this website —
 * the original platform post is never modified.
 */
export const updateMediaItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: MediaUpdateInput) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { requireStaff, audit } = await import("@/lib/admin-guard.server");
    await requireStaff(supabase, userId);

    const patch: Record<string, unknown> = {};
    if (data.approvalStatus !== undefined) {
      patch.approval_status = data.approvalStatus;
      if (data.sourceType === "social") {
        patch.approved_at = data.approvalStatus === "approved" ? new Date().toISOString() : null;
        patch.approval_source = "manual:admin";
      }
    }
    if (data.isVisible !== undefined) patch.is_visible = data.isVisible;
    if (data.isPinned !== undefined) patch.is_pinned = data.isPinned;
    if (data.isFeatured !== undefined) patch.is_featured = data.isFeatured;
    if (data.allowAutoplay !== undefined) patch.allow_autoplay = data.allowAutoplay;
    if (data.altText !== undefined) patch.alt_text = data.altText;
    if (data.fallbackThumbnailUrl !== undefined)
      patch.fallback_thumbnail_url = data.fallbackThumbnailUrl;

    if (data.sourceType === "social") {
      if (data.websiteCaption !== undefined) patch.custom_caption = data.websiteCaption;
      if (data.allowCommunityReuse !== undefined)
        patch.allow_community_reuse = data.allowCommunityReuse;
      if (Object.keys(patch).length > 0) {
        await supabase.from("social_posts").update(patch as never).eq("id", data.sourceId);
      }
    } else {
      if (data.allowCommunityReuse !== undefined) patch.usable_in_memes = data.allowCommunityReuse;
      delete patch.fallback_thumbnail_url;
      if (Object.keys(patch).length > 0) {
        await supabase.from("media_items").update(patch as never).eq("id", data.sourceId);
      }
    }

    if (data.placements) {
      await supabase
        .from("media_placements")
        .delete()
        .eq("source_type", data.sourceType)
        .eq("source_id", data.sourceId);
      if (data.placements.length > 0) {
        await supabase.from("media_placements").insert(
          data.placements.map((placement) => ({
            source_type: data.sourceType,
            source_id: data.sourceId,
            placement,
            is_auto: false,
          })),
        );
      }
    }

    await audit(supabase, userId, {
      action: "update_media",
      entityType: data.sourceType === "social" ? "social_posts" : "media_items",
      entityId: data.sourceId,
      summary: "Website presentation updated. The original platform post was not modified.",
    });

    return { ok: true };
  });

/* ------------------------------------------------------------- audit log */

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { requireAdmin } = await import("@/lib/admin-guard.server");
    await requireAdmin(supabase, userId);

    const { data } = await supabase
      .from("admin_audit_logs")
      .select("id, action, entity_type, entity_id, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as Array<{
      id: string;
      action: string;
      entity_type: string | null;
      entity_id: string | null;
      summary: string | null;
      created_at: string;
    }>;
  });

export interface SyncRunRow {
  id: string;
  platform: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  items_fetched: number;
  items_upserted: number;
  items_marked_unavailable: number;
  message: string | null;
}

export const listSyncRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { requireAdmin } = await import("@/lib/admin-guard.server");
    await requireAdmin(supabase, userId);

    const { data } = await supabase
      .from("sync_runs")
      .select(
        "id, platform, status, started_at, finished_at, items_fetched, items_upserted, items_marked_unavailable, message",
      )
      .order("started_at", { ascending: false })
      .limit(20);
    return (data ?? []) as SyncRunRow[];
  });
