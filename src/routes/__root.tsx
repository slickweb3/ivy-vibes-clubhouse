import { IvyHopSticker } from "@/components/ivy/hop-sticker";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "$ivy — The Official ivy vibing Meme Coin" },
      {
        name: "description",
        content:
          "Meet Ivy, the internet's Short Spine Queen and Frog Queen. Explore her story, watch official Ivy videos and follow the upcoming $ivy community project.",
      },
      { name: "theme-color", content: "#83D94E" },
      { property: "og:site_name", content: "ivy vibing" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "$ivy — The Official ivy vibing Meme Coin" },
      { name: "twitter:title", content: "$ivy — The Official ivy vibing Meme Coin" },
      { property: "og:description", content: "Meet Ivy, the internet's Short Spine Queen and Frog Queen. Explore her story, watch official Ivy videos and follow the upcoming $ivy community project." },
      { name: "twitter:description", content: "Meet Ivy, the internet's Short Spine Queen and Frog Queen. Explore her story, watch official Ivy videos and follow the upcoming $ivy community project." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Warm up the official embed hosts so TikTok/Instagram players start faster.
      { rel: "preconnect", href: "https://www.tiktok.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://www.instagram.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://p16-sign-va.tiktokcdn.com" },
      { rel: "dns-prefetch", href: "https://lf16-tiktok-web.tiktokcdn-us.com" },
      { rel: "dns-prefetch", href: "https://scontent.cdninstagram.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Nunito:wght@400;600;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ivy vibing",
          url: "https://ivyvibing.com",
          logo: "https://ivyvibing.com/favicon.png",
          description:
            "The internet clubhouse for Ivy, the Short Spine Queen and Frog Queen, and the $ivy community project.",
          sameAs: [
            "https://www.instagram.com/frogqueenivy/",
            "https://www.tiktok.com/@ivyvibing",
            "https://x.com/Ivyvibing",
            "https://t.me/frogqueenivy",
            "https://linktr.ee/ivyvibing",
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "ivy vibing",
          url: "https://ivyvibing.com",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <IvyHopSticker />
    </QueryClientProvider>
  );
}
