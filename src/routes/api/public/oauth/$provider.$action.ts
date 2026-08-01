/**
 * OAuth routes: /api/public/oauth/$provider/$action
 *
 * Actions: authorize | callback | refresh | disconnect
 *
 * Official APIs only. Every action is guarded by an environment check and, for
 * privileged actions, by the shared SOCIAL_SYNC_SECRET header. No provider
 * response is forwarded verbatim and no token is ever echoed or logged.
 *
 * Redirect URIs to register with the platforms:
 *   <site>/api/public/oauth/instagram/callback
 *   <site>/api/public/oauth/tiktok/callback
 */
import { createFileRoute } from "@tanstack/react-router";
import type { SocialPlatform } from "@/types/social";

const PROVIDERS = new Set(["instagram", "tiktok"]);
const ACTIONS = new Set(["authorize", "callback", "refresh", "disconnect"]);

export const Route = createFileRoute("/api/public/oauth/$provider/$action")({
  server: {
    handlers: {
      GET: ({ params, request }) => handle(params.provider, params.action, request),
      POST: ({ params, request }) => handle(params.provider, params.action, request),
    },
  },
});

function privileged(request: Request): boolean {
  const secret = process.env.SOCIAL_SYNC_SECRET;
  if (!secret) return false;
  const provided = request.headers.get("x-sync-secret") ?? "";
  return provided.length === secret.length && provided === secret;
}

async function handle(provider: string, action: string, request: Request): Promise<Response> {
  const oauth = await import("@/lib/social-oauth.server");
  const { providerStatus, notConfiguredResponse, sanitizedError, jsonResponse } = oauth;

  if (!PROVIDERS.has(provider)) return sanitizedError("Unknown provider.", 404);
  if (!ACTIONS.has(action)) return sanitizedError("Unknown action.", 404);

  const platform = provider as SocialPlatform;

  if (action === "authorize") {
    // Authorization may only be started by a signed-in admin, through the
    // protected admin server function. A public visitor must never be able to
    // connect their own account in place of Ivy's official one. This check runs
    // before any provider-configuration lookup so the public endpoint always
    // answers 401 instead of leaking configuration state (or a 503).
    return jsonResponse(
      { ok: false, error: "unauthorized", hint: "Start the connection from the admin area." },
      401,
    );
  }

  const status = providerStatus(platform);
  if (!status.configured) return notConfiguredResponse(status);

  try {
    if (action === "callback") {
      const url = new URL(request.url);
      const error = url.searchParams.get("error");
      if (error) return redirectToAdmin(platform, "denied");

      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code) return sanitizedError("Missing authorization code.", 400);
      if (!(await oauth.consumeState(platform, state))) {
        return sanitizedError("Invalid or expired authorization state.", 400);
      }

      const result = await oauth.exchangeCode(platform, code);
      await oauth.storeTokens(platform, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      });
      await oauth.upsertConnection(platform, {
        is_connected: true,
        account_name: result.accountName,
        external_account_id: result.externalAccountId,
        token_ref: `social_connection_secrets:${platform}`,
        token_expires_at: result.expiresAt,
        connected_at: new Date().toISOString(),
        scopes: status.scopes,
        last_error: null,
      });

      // Initial sync immediately after a successful handshake.
      const { syncPlatform } = await import("@/lib/social-sync.server");
      await syncPlatform(platform);

      return redirectToAdmin(platform, "connected");
    }

    if (!privileged(request)) return jsonResponse({ ok: false, error: "unauthorized" }, 401);

    if (action === "refresh") {
      const refreshed = await oauth.refreshTokens(platform);
      if (!refreshed) {
        await oauth.upsertConnection(platform, { last_error: "Token refresh failed." });
        return jsonResponse({ ok: false, error: "refresh_failed" }, 502);
      }
      await oauth.storeTokens(platform, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      });
      await oauth.upsertConnection(platform, {
        token_expires_at: refreshed.expiresAt,
        last_error: null,
      });
      return jsonResponse({ ok: true, platform, renewedAt: new Date().toISOString() });
    }

    // disconnect
    await oauth.clearTokens(platform);
    await oauth.upsertConnection(platform, {
      is_connected: false,
      token_ref: null,
      token_expires_at: null,
      external_account_id: null,
    });
    return jsonResponse({ ok: true, platform, disconnected: true });
  } catch {
    return sanitizedError("The authorization request could not be completed.", 502);
  }
}

function redirectToAdmin(platform: string, state: string): Response {
  return new Response(null, {
    status: 302,
    headers: { location: `/admin/connections?platform=${platform}&result=${state}` },
  });
}
