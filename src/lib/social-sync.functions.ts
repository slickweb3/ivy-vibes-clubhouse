import { createServerFn } from "@tanstack/react-start";
import { projectConfig } from "@/config/project";

/**
 * Social sync stubs.
 *
 * NOTHING here is live. Each function reports its configuration state and
 * refuses to pretend a connection exists. Wire real OAuth + storage after
 * credentials are added in project settings.
 */

export type SyncStatus = {
  platform: "instagram" | "tiktok";
  configured: boolean;
  connected: boolean;
  lastSyncedAt: string | null;
  nextSyncDueAt: string | null;
  intervalHours: number;
  message: string;
};

export const getSyncStatus = createServerFn({ method: "GET" }).handler(async (): Promise<SyncStatus[]> => {
  const { features, syncIntervalHours } = projectConfig;
  return [
    {
      platform: "instagram",
      configured: features.instagramOAuthConfigured,
      connected: false,
      lastSyncedAt: null,
      nextSyncDueAt: null,
      intervalHours: syncIntervalHours,
      message: features.instagramOAuthConfigured
        ? "Credentials present. Authorize the account to begin syncing."
        : "Instagram OAuth is not configured. Add INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET.",
    },
    {
      platform: "tiktok",
      configured: features.tiktokOAuthConfigured,
      connected: false,
      lastSyncedAt: null,
      nextSyncDueAt: null,
      intervalHours: syncIntervalHours,
      message: features.tiktokOAuthConfigured
        ? "Credentials present. Authorize the account to begin syncing."
        : "TikTok OAuth is not configured. Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET.",
    },
  ];
});

/** Stub: begins an OAuth authorization flow once credentials exist. */
export const startOAuthConnect = createServerFn({ method: "POST" })
  .inputValidator((data: { platform: "instagram" | "tiktok" }) => data)
  .handler(async ({ data }) => {
    return {
      ok: false as const,
      platform: data.platform,
      authorizeUrl: null,
      message: `${data.platform} OAuth is not configured yet. No connection has been made.`,
    };
  });

/** Stub: the 12-hour scheduled sync. Writes to the post cache when live. */
export const runScheduledSync = createServerFn({ method: "POST" })
  .inputValidator((data: { platform?: "instagram" | "tiktok" } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    return {
      ok: false as const,
      platform: data.platform ?? "all",
      importedPosts: 0,
      intervalHours: projectConfig.syncIntervalHours,
      message:
        "Sync skipped: no social connection is configured. The public feed continues serving the owner-curated fallback.",
    };
  });
