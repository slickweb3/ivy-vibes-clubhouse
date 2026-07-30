import { createFileRoute, redirect } from "@tanstack/react-router";

/** Friendly alias for the canonical /legal/risk-disclosure policy page. */
export const Route = createFileRoute("/risk-disclosure")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "risk-disclosure" } });
  },
});
