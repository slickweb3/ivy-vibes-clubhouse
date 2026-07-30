import { createFileRoute, redirect } from "@tanstack/react-router";

/** Friendly alias for the canonical /legal/terms policy page. */
export const Route = createFileRoute("/terms")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "terms" } });
  },
});
