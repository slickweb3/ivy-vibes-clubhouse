import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CrownDoodle, PawDoodle, IvyWordmark } from "@/components/ivy/doodles";
import { Sticker } from "@/components/ivy/primitives";

const TITLE = "Admin sign-in — IvyVibing";
const DESCRIPTION =
  "Sign in to the IvyVibing administrator workspace to manage Ivy's approved media, copy and disclosures.";

export const Route = createFileRoute("/admin/sign-in")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSignIn,
});

function AdminSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) navigate({ to: "/admin" });
      setChecked(true);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate({ to: "/admin" });
  };

  return (
    <main id="main" className="min-h-dvh bg-background px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <Link to="/" className="self-start" aria-label="IvyVibing home">
          <IvyWordmark />
        </Link>

        <div className="rounded-3xl bg-card p-6 pop-static">
          <Sticker tone="yellow">Setup required</Sticker>
          <h1 className="mt-4 flex items-center gap-2 text-3xl text-charcoal">
            <CrownDoodle className="h-6 w-9 text-frog" aria-hidden />
            Admin sign-in
          </h1>
          <p className="mt-3 text-charcoal/85">
            Administrator accounts and roles are not configured yet. There are no demo or
            hard-coded credentials on this site—an owner-approved account must be created in the
            backend before anyone can sign in.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Work email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-11 rounded-xl border-[3px] border-charcoal bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-11 rounded-xl border-[3px] border-charcoal bg-card"
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-xl bg-pink p-3 text-sm text-charcoal">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={busy || !checked}
              className="min-h-11 w-full rounded-full bg-frog font-display text-charcoal pop hover:bg-frog"
            >
              {busy ? "Checking…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 flex items-start gap-2 text-sm text-charcoal/75">
            <PawDoodle className="mt-1 h-4 w-4 shrink-0 text-frog" aria-hidden />
            Signing in never exposes platform tokens. Instagram and TikTok credentials live in
            server-side secret storage only.
          </p>
        </div>

        <Link to="/" className="text-center font-display text-foreground underline underline-offset-4">
          Back to IvyVibing
        </Link>
      </div>
    </main>
  );
}
