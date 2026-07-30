import { createFileRoute, redirect } from "@tanstack/react-router";

/** Friendly alias for the canonical /legal/media-usage policy page. */
export const Route = createFileRoute("/media-usage")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "media-usage" } });
  },
});
