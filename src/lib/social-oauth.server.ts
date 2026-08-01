/**
 * Server-only OAuth for Instagram and TikTok.
 *
 * OFFICIAL APIs ONLY. Nothing here scrapes. Nothing here logs a token.
 * Access/refresh tokens are encrypted (AES-256-GCM) before storage in
 * `social_connection_secrets`, which has no anon/authenticated grants.
 *
 * Required environment variables (none are set by default):
 *   INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_REDIRECT_URI
 *   TIKTOK_CLIENT_KEY,   TIKTOK_CLIENT_SECRET,    TIKTOK_REDIRECT_URI
 *   SOCIAL_TOKEN_ENCRYPTION_KEY, SOCIAL_SYNC_SECRET
 */
import type { SocialPlatform } from "@/types/social";
import { decryptSecret, encryptSecret } from "./crypto.server";

/** The only accounts eligible for verified auto-publication. */
export const OFFICIAL_ACCOUNTS: Record<SocialPlatform, { handle: string; url: string }> = {
  instagram: { handle: "frogqueenivy", url: "https://www.instagram.com/frogqueenivy/" },
  tiktok: { handle: "ivyvibing", url: "https://www.tiktok.com/@ivyvibing" },
};

export interface ProviderStatus {
  platform: SocialPlatform;
  configured: boolean;
  missing: string[];
  setupUrl: string;
  redirectUri: string | null;
  scopes: string[];
}

const PROVIDER_ENV: Record<
  SocialPlatform,
  { vars: string[]; setupUrl: string; redirectVar: string; scopes: string[] }
> = {
  instagram: {
    vars: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET", "INSTAGRAM_REDIRECT_URI"],
    setupUrl:
      "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login",
    redirectVar: "INSTAGRAM_REDIRECT_URI",
    scopes: ["instagram_business_basic"],
  },
  tiktok: {
    vars: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_REDIRECT_URI"],
    setupUrl: "https://developers.tiktok.com/doc/login-kit-web",
    redirectVar: "TIKTOK_REDIRECT_URI",
    scopes: ["user.info.basic", "video.list"],
  },
};

export function providerStatus(platform: SocialPlatform): ProviderStatus {
  const { vars, setupUrl, redirectVar, scopes } = PROVIDER_ENV[platform];
  const missing = vars.filter((name) => !process.env[name]);
  if (!process.env.SOCIAL_TOKEN_ENCRYPTION_KEY) missing.push("SOCIAL_TOKEN_ENCRYPTION_KEY");
  return {
    platform,
    configured: missing.length === 0,
    missing,
    setupUrl,
    redirectUri: process.env[redirectVar] ?? null,
    scopes,
  };
}

export function allProviderStatuses(): ProviderStatus[] {
  return (Object.keys(PROVIDER_ENV) as SocialPlatform[]).map(providerStatus);
}

/* ------------------------------------------------------------ responses */

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/** Uniform, sanitized "setup required" reply. */
export function notConfiguredResponse(status: ProviderStatus): Response {
  return jsonResponse(
    {
      ok: false,
      platform: status.platform,
      error: "not_configured",
      message: `${status.platform} is not connected. Add the required credentials before using this endpoint.`,
      missingEnvVars: status.missing,
      setupUrl: status.setupUrl,
    },
    503,
  );
}

export function sanitizedError(message: string, status = 400): Response {
  return jsonResponse({ ok: false, error: "request_failed", message }, status);
}

/* --------------------------------------------------------- admin client */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ------------------------------------------------------------ CSRF state */

export async function createState(
  platform: SocialPlatform,
  redirectUri: string,
  createdBy: string,
): Promise<string> {
  const db = await admin();
  const state = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  await db
    .from("oauth_states")
    .insert({ state, platform, redirect_uri: redirectUri, created_by: createdBy });
  return state;
}

export async function consumeState(
  platform: SocialPlatform,
  state: string | null,
): Promise<boolean> {
  if (!state) return false;
  const db = await admin();
  const { data } = await db
    .from("oauth_states")
    .select("id, platform, expires_at, consumed_at, created_by")
    .eq("state", state)
    .maybeSingle();

  const row = data as {
    id: string;
    platform: string;
    expires_at: string;
    consumed_at: string | null;
    created_by: string | null;
  } | null;
  if (!row || row.platform !== platform || row.consumed_at) return false;
  // The handshake must have been started by a signed-in admin.
  if (!row.created_by) return false;
  if (Date.parse(row.expires_at) < Date.now()) return false;

  await db.from("oauth_states").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);
  return true;
}

/* ------------------------------------------------------- token storage */

export async function storeTokens(
  platform: SocialPlatform,
  tokens: { accessToken: string; refreshToken?: string | null; expiresAt?: string | null },
): Promise<void> {
  const db = await admin();
  await db.from("social_connection_secrets").upsert(
    {
      platform,
      access_token_cipher: await encryptSecret(tokens.accessToken),
      refresh_token_cipher: tokens.refreshToken ? await encryptSecret(tokens.refreshToken) : null,
      expires_at: tokens.expiresAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "platform" },
  );
}

export async function loadAccessToken(platform: SocialPlatform): Promise<string | null> {
  const db = await admin();
  const { data } = await db
    .from("social_connection_secrets")
    .select("access_token_cipher")
    .eq("platform", platform)
    .maybeSingle();
  return decryptSecret(
    (data as { access_token_cipher: string | null } | null)?.access_token_cipher ?? null,
  );
}

export async function loadRefreshToken(platform: SocialPlatform): Promise<string | null> {
  const db = await admin();
  const { data } = await db
    .from("social_connection_secrets")
    .select("refresh_token_cipher")
    .eq("platform", platform)
    .maybeSingle();
  return decryptSecret(
    (data as { refresh_token_cipher: string | null } | null)?.refresh_token_cipher ?? null,
  );
}

export async function clearTokens(platform: SocialPlatform): Promise<void> {
  const db = await admin();
  await db.from("social_connection_secrets").delete().eq("platform", platform);
}

export async function upsertConnection(
  platform: SocialPlatform,
  patch: Record<string, unknown>,
): Promise<void> {
  const db = await admin();
  await db
    .from("social_connections")
    .upsert(
      { platform, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "platform" },
    );
}

/* ---------------------------------------------------------- authorize */

export function authorizeUrl(platform: SocialPlatform, state: string): string | null {
  const status = providerStatus(platform);
  if (!status.configured || !status.redirectUri) return null;

  if (platform === "instagram") {
    const params = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      redirect_uri: status.redirectUri,
      response_type: "code",
      scope: status.scopes.join(","),
      state,
    });
    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: status.scopes.join(","),
    response_type: "code",
    redirect_uri: status.redirectUri,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

/* ------------------------------------------------------ token exchange */

export interface ExchangeResult {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  externalAccountId: string | null;
  accountName: string | null;
}

function expiryFromSeconds(seconds: unknown): string | null {
  return typeof seconds === "number" ? new Date(Date.now() + seconds * 1000).toISOString() : null;
}

export async function exchangeCode(
  platform: SocialPlatform,
  code: string,
): Promise<ExchangeResult> {
  const status = providerStatus(platform);
  if (!status.configured || !status.redirectUri) throw new Error("not_configured");

  if (platform === "instagram") {
    const body = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: status.redirectUri,
      code,
    });
    const res = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body,
    });
    if (!res.ok) throw new Error("token_exchange_failed");
    const short = (await res.json()) as { access_token?: string; user_id?: number | string };
    if (!short.access_token) throw new Error("token_exchange_failed");

    // Upgrade to a long-lived (60 day) token immediately.
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
        process.env.INSTAGRAM_CLIENT_SECRET!,
      )}&access_token=${encodeURIComponent(short.access_token)}`,
    );
    const long = longRes.ok
      ? ((await longRes.json()) as { access_token?: string; expires_in?: number })
      : {};
    const accessToken = long.access_token ?? short.access_token;

    const profile = await fetchInstagramProfile(accessToken);
    return {
      accessToken,
      refreshToken: null,
      expiresAt: expiryFromSeconds(long.expires_in),
      externalAccountId: profile.id ?? (short.user_id ? String(short.user_id) : null),
      accountName: profile.username ?? null,
    };
  }

  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
    redirect_uri: status.redirectUri,
  });
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("token_exchange_failed");
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    open_id?: string;
  };
  if (!json.access_token) throw new Error("token_exchange_failed");

  const profile = await fetchTikTokProfile(json.access_token);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: expiryFromSeconds(json.expires_in),
    externalAccountId: profile.openId ?? json.open_id ?? null,
    accountName: profile.username ?? null,
  };
}

export async function refreshTokens(platform: SocialPlatform): Promise<ExchangeResult | null> {
  const status = providerStatus(platform);
  if (!status.configured) return null;

  if (platform === "instagram") {
    const token = await loadAccessToken("instagram");
    if (!token) return null;
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) return null;
    const profile = await fetchInstagramProfile(json.access_token);
    return {
      accessToken: json.access_token,
      refreshToken: null,
      expiresAt: expiryFromSeconds(json.expires_in),
      externalAccountId: profile.id ?? null,
      accountName: profile.username ?? null,
    };
  }

  const refresh = await loadRefreshToken("tiktok");
  if (!refresh) return null;
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refresh,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    open_id?: string;
  };
  if (!json.access_token) return null;
  const profile = await fetchTikTokProfile(json.access_token);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refresh,
    expiresAt: expiryFromSeconds(json.expires_in),
    externalAccountId: profile.openId ?? json.open_id ?? null,
    accountName: profile.username ?? null,
  };
}

/* -------------------------------------------------------------- profiles */

export async function fetchInstagramProfile(
  accessToken: string,
): Promise<{ id: string | null; username: string | null }> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!res.ok) return { id: null, username: null };
    const json = (await res.json()) as { id?: string; username?: string };
    return { id: json.id ?? null, username: json.username ?? null };
  } catch {
    return { id: null, username: null };
  }
}

export async function fetchTikTokProfile(
  accessToken: string,
): Promise<{ openId: string | null; username: string | null }> {
  try {
    const res = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return { openId: null, username: null };
    const json = (await res.json()) as {
      data?: { user?: { open_id?: string; username?: string; display_name?: string } };
    };
    const user = json.data?.user;
    return {
      openId: user?.open_id ?? null,
      username: user?.username ?? user?.display_name ?? null,
    };
  } catch {
    return { openId: null, username: null };
  }
}
