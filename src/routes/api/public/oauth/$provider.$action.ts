/**
 * OAuth stubs: /api/public/oauth/$provider/$action
 *
 * Actions: authorize | callback | refresh | disconnect
 *
 * Every action is guarded by an environment check. Until credentials exist
 * each returns an honest 503 "not configured" payload. No provider response is
 * ever forwarded to the client and no secret is ever echoed.
 */
import { createFileRoute } from "@tanstack/react-router";
import type { SocialPlatform } from "@/types/social";

const PROVIDERS = new Set(["instagram", "tiktok"]);
const ACTIONS = new Set(["authorize", "callback", "refresh", "disconnect"]);

export const Route = createFileRoute("/api/public/oauth/$provider/$action")({
  server: {
    handlers: {
      GET: ({ params }) => handle(params.provider, params.action),
      POST: ({ params }) => handle(params.provider, params.action),
    },
  },
});

async function handle(provider: string, action: string): Promise<Response> {
  const { providerStatus, notConfiguredResponse, sanitizedError } = await import(
    "@/lib/social-oauth.server"
  );

  if (!PROVIDERS.has(provider)) return sanitizedError("Unknown provider.", 404);
  if (!ACTIONS.has(action)) return sanitizedError("Unknown action.", 404);

  const status = providerStatus(provider as SocialPlatform);
  if (!status.configured) return notConfiguredResponse(status);

  // Once credentials exist, implement per action:
  //  authorize  -> 302 to the provider consent screen with a signed state value
  //  callback   -> verify state, exchange the code, store ONLY a token
  //                reference server-side, update social_connections
  //  refresh    -> exchange the long-lived token, update expiry
  //  disconnect -> revoke, clear the token reference, mark disconnected
  return new Response(
    JSON.stringify({
      ok: false,
      error: "not_implemented",
      message: `Credentials for ${provider} are present but the ${action} flow has not been enabled yet.`,
    }),
    { status: 501, headers: { "content-type": "application/json; charset=utf-8" } },
  );
}
