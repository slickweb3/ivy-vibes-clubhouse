import { createFileRoute } from "@tanstack/react-router";
import { IvyNotFound } from "@/components/ivy/not-found";

const TITLE = "Page not found — ivy vibing";
const DESCRIPTION =
  "This page isn't part of Ivy's clubhouse. Head back to the front pond or play Lily Pad Leap.";

/** Catch-all page so unknown URLs get honest, indexable-safe metadata. */
export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IvyNotFound,
});
