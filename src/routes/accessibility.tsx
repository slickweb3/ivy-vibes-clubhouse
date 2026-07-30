import { createFileRoute, redirect } from "@tanstack/react-router";

/** Friendly alias for the canonical /legal/accessibility policy page. */
export const Route = createFileRoute("/accessibility")({
  beforeLoad: () => {
    throw redirect({ to: "/legal/$slug", params: { slug: "accessibility" } });
  },
});
