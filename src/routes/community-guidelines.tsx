import { createFileRoute, redirect } from "@tanstack/react-router";

/** Friendly alias for the canonical /legal/community-guidelines policy page. */
export const Route = createFileRoute("/community-guidelines")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "community-guidelines" } });
  },
});
