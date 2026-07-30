import { createFileRoute, redirect } from "@tanstack/react-router";

/** Friendly alias for the canonical /legal/cookies policy page. */
export const Route = createFileRoute("/cookies")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "cookies" } });
  },
});
