import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { projectConfig } from "@/config/project";
import { getClientSession, ROLE_PERMISSIONS, type AdminSession, type AuditLogEntry } from "@/lib/auth";
import { manualFallbackFeed } from "@/data/social";
import { legalPages } from "@/data/content";

const TITLE = "Admin — IvyVibing";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: "Protected IvyVibing admin dashboard for media, content and sync management." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: "Protected IvyVibing admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const AUDIT_LOGS: AuditLogEntry[] = [];

function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  useEffect(() => setSession(getClientSession()), []);

  const authReady = projectConfig.features.authConfigured;

  if (!authReady || !session) {
    return (
      <main className="grid min-h-dvh place-items-center bg-cream px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl bg-card p-7 pop-static">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-yellow text-2xl pop-static">🔒</span>
          <h1 className="mt-5 text-3xl">Admin dashboard is locked</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Authentication is not configured, so no one can sign in — including you. This route is a scaffold
            only; it holds no live session, database connection or social credential.
          </p>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm">
            <li>Enable Lovable Cloud to provision the database and auth.</li>
            <li>Run the migrations in <code>db/migrations/</code>.</li>
            <li>
              Flip <code>features.authConfigured</code> in <code>src/config/project.ts</code> once sign-in works.
            </li>
            <li>Grant yourself the <code>owner</code> role in the <code>user_roles</code> table.</li>
          </ol>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-frog px-5 py-2.5 font-display text-sm pop">
            ← Back to the clubhouse
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-cream py-12">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 sm:px-6">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-3xl sm:text-4xl">Ivy admin</h1>
            <p className="truncate text-sm text-muted-foreground">
              {session.email} · {session.roles.join(", ")}
            </p>
          </div>
          <Link to="/" className="shrink-0 rounded-full bg-card px-4 py-2 font-display text-sm pop">
            View site
          </Link>
        </header>

        <AdminCard title="Social connections">
          <ul className="space-y-3 text-sm">
            {["instagram", "tiktok"].map((platform) => (
              <li key={platform} className="flex items-center justify-between gap-3 rounded-xl bg-cream p-3 ink-border">
                <span className="capitalize">{platform}</span>
                <span className="rounded-full bg-yellow px-3 py-1 font-display text-xs uppercase">Not connected</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Sync interval: every {projectConfig.syncIntervalHours} hours once connected.
          </p>
        </AdminCard>

        <AdminCard title="Fallback feed">
          <p className="text-sm text-muted-foreground">
            {manualFallbackFeed.length} owner-curated entries currently serving the public feed.
          </p>
        </AdminCard>

        <AdminCard title="Content & legal pages">
          <ul className="space-y-2 text-sm">
            {legalPages.map((p) => (
              <li key={p.slug} className="flex items-center justify-between gap-3">
                <span>{p.title}</span>
                <span className="text-muted-foreground">{p.updatedAt ?? "never edited"}</span>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard title="Roles & permissions">
          <ul className="space-y-2 text-sm">
            {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
              <li key={role}>
                <strong className="font-display capitalize">{role}</strong>: {perms.join(", ")}
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard title="Audit log">
          {AUDIT_LOGS.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries — the database is not connected.</p>
          ) : null}
        </AdminCard>
      </div>
    </main>
  );
}

function AdminCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card p-6 pop-static">
      <h2 className="text-xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
