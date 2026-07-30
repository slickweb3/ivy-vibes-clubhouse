/**
 * Public, unauthenticated read of the unified approved-media model.
 * Safe for SSR and prerender: it only exposes approved, visible, active rows.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SiteMedia } from "@/types/media";

export const getSiteMedia = createServerFn({ method: "GET" }).handler(async (): Promise<SiteMedia> => {
  const { readSiteMedia } = await import("@/lib/media-read.server");
  return readSiteMedia();
});
