/**
 * Same-origin image proxy for the Ivy Meme Machine.
 *
 * The meme editor draws official platform poster images into a <canvas>. A
 * cross-origin image taints the canvas, which blocks the user from exporting
 * their own meme, so the browser fetches the poster through this route instead.
 *
 * Nothing is stored or re-hosted: the bytes are streamed straight through for
 * the duration of the request, and only the official platform CDN hosts that
 * serve TikTok's own oEmbed posters are allowed.
 */
import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOST_SUFFIXES = [
  ".tiktokcdn.com",
  ".tiktokcdn-us.com",
  ".tiktokcdn-eu.com",
  ".ibyteimg.com",
  ".cdninstagram.com",
  ".fbcdn.net",
];

function isAllowed(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  const ok = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host.endsWith(suffix) || host === suffix.slice(1),
  );
  return ok ? url : null;
}

export const Route = createFileRoute("/api/public/meme-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const src = new URL(request.url).searchParams.get("src") ?? "";
        const target = isAllowed(src);
        if (!target) return new Response("Unsupported image source", { status: 400 });

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
          const upstream = await fetch(target.toString(), {
            signal: controller.signal,
            headers: { accept: "image/*" },
          });
          if (!upstream.ok || !upstream.body) {
            return new Response("Poster unavailable", { status: 502 });
          }
          const type = upstream.headers.get("content-type") ?? "image/jpeg";
          if (!type.startsWith("image/")) {
            return new Response("Poster unavailable", { status: 502 });
          }
          return new Response(upstream.body, {
            headers: {
              "content-type": type,
              "cache-control": "public, max-age=3600",
            },
          });
        } catch {
          return new Response("Poster unavailable", { status: 504 });
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
