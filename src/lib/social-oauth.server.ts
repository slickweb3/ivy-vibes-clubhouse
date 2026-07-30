/**
 * OAuth configuration guards for Instagram and TikTok.
 *
 * Server-only. Nothing here performs a network call — these helpers just
 * report, honestly, whether credentials exist. No secret is ever returned to
 * a caller and no provider response is ever surfaced verbatim.
 *
 * Required environment variables (none are set by default):
 *   INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_REDIRECT_URI
 *   TIKTOK_CLIENT_KEY,   TIKTOK_CLIENT_SECRET,    TIKTOK_REDIRECT_URI
 *   SOCIAL_SYNC_SECRET   (shared secret for the scheduled sync endpoint)
 */
import type { SocialPlatform } from "@/types/social";

export interface ProviderStatus {
  platform: SocialPlatform;
  configured: boolean;
  missing: string[];
  /** Docs the operator needs in order to finish setup. */
  setupUrl: string;
}

const PROVIDER_ENV: Record<SocialPlatform, { vars: string[]; setupUrl: string }> = {
  instagram: {
    vars: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET", "INSTAGRAM_REDIRECT_URI"],
    setupUrl: "https://developers.facebook.com/docs/instagram-platform",
  },
  tiktok: {
    vars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REDIRECT_URI"],
    setupUrl: "https://developers.tiktok.com/doc/login-kit-web",
  },
};

export function providerStatus(platform: SocialPlatform): ProviderStatus {
  const { vars, setupUrl } = PROVIDER_ENV[platform];
  const missing = vars.filter((name) => !process.env[name]);
  return { platform, configured: missing.length === 0, missing, setupUrl };
}

export function allProviderStatuses(): ProviderStatus[] {
  return (Object.keys(PROVIDER_ENV) as SocialPlatform[]).map(providerStatus);
}

/** Uniform, sanitized "not configured" reply used by every OAuth stub. */
export function notConfiguredResponse(status: ProviderStatus): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      platform: status.platform,
      error: "not_configured",
      message: `${status.platform} is not connected. Add the required credentials before using this endpoint.`,
      missingEnvVars: status.missing,
      setupUrl: status.setupUrl,
    }),
    { status: 503, headers: { "content-type": "application/json; charset=utf-8" } },
  );
}

export function sanitizedError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, error: "request_failed", message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
