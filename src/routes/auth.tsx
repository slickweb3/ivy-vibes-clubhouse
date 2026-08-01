import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IvyWordmark, CrownDoodle } from "@/components/ivy/doodles";

const TITLE = "Team sign in — ivy vibing";
const DESCRIPTION =
  "Sign in to the ivy vibing admin area. Access is restricted to Ivy's owner and approved editors.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = await getSupabaseBrowserClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        setMessage(
          "Account created. Confirm your email, then ask an existing administrator to grant your role.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-leaf px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 pop-static">
        <Link to="/" aria-label="ivy vibing home">
          <IvyWordmark />
        </Link>
        <h1 className="mt-6 flex items-center gap-2 text-3xl text-charcoal">
          <CrownDoodle className="h-6 w-9 text-frog" />
          Team sign in
        </h1>
        <p className="mt-2 text-sm text-charcoal/80">
          This area is for Ivy's owner and approved editors. Roles are granted in the database —
          creating an account does not grant access on its own.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email" className="font-display">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 min-h-11 bg-card"
            />
          </div>
          <div>
            <Label htmlFor="password" className="font-display">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 min-h-11 bg-card"
            />
          </div>

          {message ? (
            <p role="status" className="rounded-xl bg-yellow p-3 text-sm text-charcoal">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-full bg-frog font-display text-charcoal pop hover:bg-frog"
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 min-h-11 font-display text-sm text-charcoal underline underline-offset-4"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
