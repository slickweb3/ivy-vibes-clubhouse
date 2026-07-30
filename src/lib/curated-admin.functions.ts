/**
 * Staff-only management of curated official social posts.
 *
 * Nothing here contacts Instagram or TikTok. Only the public post URL, the
 * derived post id and the platform's own embed URL are stored — never
 * captions, images, audio or video.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  CURATED_PLACEMENTS,
  parseCuratedUrl,
  type CuratedPlacement,
  type CuratedPost,
} from "@/types/curated";

const COLUMNS =
  "id, platform, original_post_url, platform_post_id, official_embed_url, admin_label, placements, is_visible, is_active, is_pinned, is_featured, display_order, source_account_handle, source_account_url";

type Row = Record<string, unknown>;
type CuratedPatch = Database["public"]["Tables"]["curated_social_posts"]["Update"];

function toPost(row: Row): CuratedPost {
  const placements = Array.isArray(row.placements) ? (row.placements as string[]) : [];
  return {
    id: String(row.id),
    platform: row.platform === "tiktok" ? "tiktok" : "instagram",
    originalPostUrl: String(row.original_post_url ?? ""),
    platformPostId: String(row.platform_post_id ?? ""),
    officialEmbedUrl: String(row.official_embed_url ?? ""),
    adminLabel: typeof row.admin_label === "string" && row.admin_label ? row.admin_label : null,
    placements: placements.filter((p): p is CuratedPlacement =>
      (CURATED_PLACEMENTS as string[]).includes(p),
    ),
    isVisible: row.is_visible !== false,
    isActive: row.is_active !== false,
    isPinned: row.is_pinned === true,
    isFeatured: row.is_featured === true,
    displayOrder: typeof row.display_order === "number" ? row.display_order : 0,
    sourceAccountHandle: String(row.source_account_handle ?? ""),
    sourceAccountUrl: String(row.source_account_url ?? ""),
  };
}

export const listCuratedPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CuratedPost[]> => {
    const { supabase, userId } = context;
    const { requireStaff } = await import("@/lib/admin-guard.server");
    await requireStaff(supabase, userId);

    const { data, error } = await supabase
      .from("curated_social_posts")
      .select(COLUMNS)
      .order("platform", { ascending: true })
      .order("display_order", { ascending: true });

    if (error) throw new Error("Could not load curated posts.");
    return (data as Row[]).map(toPost);
  });

export interface CuratedCreateInput {
  url: string;
  adminLabel?: string | null;
  placements?: CuratedPlacement[];
  displayOrder?: number;
  isPinned?: boolean;
  isFeatured?: boolean;
  /**
   * Instagram post URLs do not contain the account handle and this workflow
   * never scrapes or calls an API, so ownership cannot be verified in code.
   * Staff must explicitly confirm they opened the original post and saw that
   * it belongs to @frogqueenivy.
   */
  instagramOwnershipConfirmed?: boolean;
}

export const createCuratedPost = createServerFn({ method: "POST" })
  .inputValidator((data: CuratedCreateInput) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { requireStaff, audit } = await import("@/lib/admin-guard.server");
    await requireStaff(supabase, userId);

    const parsed = parseCuratedUrl(data.url ?? "");
    if ("error" in parsed) throw new Error(parsed.error);

    // TikTok handles are validated from the URL itself. Instagram cannot be,
    // so we require the admin's explicit ownership confirmation instead.
    if (parsed.platform === "instagram" && data.instagramOwnershipConfirmed !== true) {
      throw new Error(
        "Confirm you opened the original post and verified it belongs to @frogqueenivy.",
      );
    }

    const placements = (data.placements ?? []).filter((p) =>
      (CURATED_PLACEMENTS as string[]).includes(p),
    );

    const { error } = await supabase.from("curated_social_posts").insert({
      platform: parsed.platform,
      original_post_url: parsed.originalPostUrl,
      platform_post_id: parsed.platformPostId,
      official_embed_url: parsed.officialEmbedUrl,
      admin_label: data.adminLabel?.trim() || null,
      placements:
        placements.length > 0
          ? placements
          : parsed.platform === "tiktok"
            ? ["fresh_posts", "ivy_tv"]
            : ["fresh_posts", "hall_of_fame"],
      display_order: Number.isFinite(data.displayOrder) ? Number(data.displayOrder) : 0,
      is_pinned: data.isPinned === true,
      is_featured: data.isFeatured === true,
      source_account_handle: parsed.sourceAccountHandle,
      source_account_url: parsed.sourceAccountUrl,
    });

    if (error) {
      throw new Error(
        error.code === "23505"
          ? "That post is already curated."
          : "Could not save this curated post.",
      );
    }

    await audit(supabase, userId, {
      action: "curated_post_added",
      entityType: "curated_social_posts",
      entityId: parsed.platformPostId,
      summary:
        parsed.platform === "instagram"
          ? `Added Instagram post ${parsed.platformPostId} as an official embed. Ownership of @frogqueenivy was confirmed manually by staff (Instagram URLs carry no handle).`
          : `Added TikTok post ${parsed.platformPostId} as an official embed. Handle @${parsed.sourceAccountHandle} was validated from the URL.`,
    });

    return { ok: true };
  });

export interface CuratedUpdateInput {
  id: string;
  adminLabel?: string | null;
  placements?: CuratedPlacement[];
  isVisible?: boolean;
  isActive?: boolean;
  isPinned?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
}

export const updateCuratedPost = createServerFn({ method: "POST" })
  .inputValidator((data: CuratedUpdateInput) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { requireStaff, audit } = await import("@/lib/admin-guard.server");
    await requireStaff(supabase, userId);

    const patch: CuratedPatch = {};
    if (data.adminLabel !== undefined) patch.admin_label = data.adminLabel?.trim() || null;
    if (data.placements !== undefined) {
      patch.placements = data.placements.filter((p) =>
        (CURATED_PLACEMENTS as string[]).includes(p),
      );
    }
    if (data.isVisible !== undefined) patch.is_visible = data.isVisible;
    if (data.isActive !== undefined) patch.is_active = data.isActive;
    if (data.isPinned !== undefined) patch.is_pinned = data.isPinned;
    if (data.isFeatured !== undefined) patch.is_featured = data.isFeatured;
    if (data.displayOrder !== undefined) patch.display_order = Number(data.displayOrder) || 0;

    const { error } = await supabase
      .from("curated_social_posts")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error("Could not update this curated post.");

    await audit(supabase, userId, {
      action: "curated_post_updated",
      entityType: "curated_social_posts",
      entityId: data.id,
      summary: `Updated curated post ${data.id} (website presentation only).`,
    });

    return { ok: true };
  });

export const deleteCuratedPost = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { requireStaff, audit } = await import("@/lib/admin-guard.server");
    await requireStaff(supabase, userId);

    const { error } = await supabase.from("curated_social_posts").delete().eq("id", data.id);
    if (error) throw new Error("Could not remove this curated post.");

    await audit(supabase, userId, {
      action: "curated_post_removed",
      entityType: "curated_social_posts",
      entityId: data.id,
      summary: `Removed curated post ${data.id} from the website. The platform post is untouched.`,
    });

    return { ok: true };
  });

/** Small counter used by the connections screen. */
export const countCuratedPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { requireStaff } = await import("@/lib/admin-guard.server");
    await requireStaff(supabase, userId);

    const { count } = await supabase
      .from("curated_social_posts")
      .select("id", { count: "exact", head: true })
      .eq("is_visible", true)
      .eq("is_active", true);

    return { active: count ?? 0 };
  });
