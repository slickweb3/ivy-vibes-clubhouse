import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin/admin-nav";
import { StatusChip } from "@/components/ivy/primitives";
import {
  disconnectPlatform,
  getAdminStatus,
  getConnectionCards,
  listSyncRuns,
  refreshSocialFeed,
  type ConnectionCard,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/connections")({
  head: () => ({
    meta: [
      { title: "Connections — IvyVibing admin" },
      { name: "description", content: "Authorize Ivy's official Instagram and TikTok accounts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const fetchStatus = useServerFn(getAdminStatus);
  const fetchCards = useServerFn(getConnectionCards);
  const fetchRuns = useServerFn(listSyncRuns);
  const runRefresh = useServerFn(refreshSocialFeed);
  const runDisconnect = useServerFn(disconnectPlatform);

  const statusQuery = useQuery({ queryKey: ["admin", "status"], queryFn: () => fetchStatus() });
  const isAdmin = statusQuery.data?.isAdmin ?? false;

  const cardsQuery = useQuery({
    queryKey: ["admin", "connections"],
    queryFn: () => fetchCards(),
    enabled: isAdmin,
  });
  const runsQuery = useQuery({
    queryKey: ["admin", "sync-runs"],
    queryFn: () => fetchRuns(),
    enabled: isAdmin,
  });

  return (
    <AdminShell
      title="Platform connections"
      intro="Official Instagram and TikTok APIs only — nothing here scrapes. A connection is only reported as connected after Ivy's owner completes the authorization flow."
    >
      {!isAdmin ? (
        <div className="rounded-2xl bg-yellow p-5 pop-static">
          <h2 className="font-display text-lg text-charcoal">Administrator role required</h2>
          <p className="mt-2 text-sm text-charcoal/85">
            You can inspect this screen, but connection controls stay disabled until an
            administrator role is granted to your account.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {(cardsQuery.data ?? placeholderCards()).map((card) => (
          <article key={card.platform} className="rounded-2xl bg-cream p-5 pop-static">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl text-charcoal capitalize">{card.platform}</h2>
              <StatusChip
                status={card.connected ? "ok" : "off"}
                label={card.connected ? "Connected" : "Disconnected"}
              />
            </div>

            <dl className="mt-4 space-y-1.5 text-sm">
              <Row label="Official account" value={`@${card.officialHandle}`} />
              <Row label="Connected account" value={card.accountName ? `@${card.accountName}` : "—"} />
              <Row label="External account ID" value={card.externalAccountId ?? "—"} />
              <Row
                label="Auto-publish eligible"
                value={card.verified ? "Yes — verified account ID matched" : "No"}
              />
              <Row label="Last successful sync" value={formatDate(card.lastSyncAt) ?? "Never"} />
              <Row label="Renewal" value={card.tokenRenewal} />
              <Row label="Scopes" value={card.scopes.join(", ")} />
              <Row label="Redirect URI" value={card.redirectUri ?? "Not configured"} />
            </dl>

            {!card.credentialsConfigured ? (
              <div className="mt-4 rounded-xl bg-yellow p-4 text-sm text-charcoal">
                <p className="font-display">Setup required</p>
                <p className="mt-1">
                  Missing environment variables: {card.missingEnvVars.join(", ") || "none"}.
                </p>
                <a
                  className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4"
                  href={card.setupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Platform setup documentation
                </a>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                asChild={card.credentialsConfigured && isAdmin}
                disabled={!card.credentialsConfigured || !isAdmin}
                className="min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog disabled:opacity-70"
              >
                {card.credentialsConfigured && isAdmin ? (
                  <a href={card.authorizeUrl}>{card.connected ? "Re-authorize" : "Connect"}</a>
                ) : (
                  <span>Connect</span>
                )}
              </Button>
              <Button
                disabled={!card.connected || !isAdmin}
                onClick={async () => {
                  await runRefresh();
                  cardsQuery.refetch();
                  runsQuery.refetch();
                }}
                className="min-h-11 rounded-full bg-card px-5 font-display text-charcoal pop hover:bg-card disabled:opacity-70"
              >
                Refresh now
              </Button>
              <Button
                disabled={!card.connected || !isAdmin}
                onClick={async () => {
                  await runDisconnect({ data: { platform: card.platform } });
                  cardsQuery.refetch();
                }}
                className="min-h-11 rounded-full bg-pink px-5 font-display text-charcoal pop hover:bg-pink disabled:opacity-70"
              >
                Disconnect
              </Button>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-2xl bg-cream p-5 pop-static">
        <h2 className="font-display text-lg text-charcoal">Sync history</h2>
        <p className="mt-1 text-sm text-charcoal/80">
          Sanitized counts only. If an upstream request fails, the last successful public feed is
          kept exactly as it was.
        </p>
        {(runsQuery.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-charcoal/70">No sync has run yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {(runsQuery.data ?? []).map((run) => (
              <li key={run.id} className="rounded-xl bg-card p-3">
                <span className="font-display capitalize">{run.platform}</span> · {run.status} ·{" "}
                {run.items_fetched} fetched · {run.items_upserted} updated ·{" "}
                {run.items_marked_unavailable} marked unavailable
                <span className="block text-charcoal/70">{formatDate(run.started_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-charcoal/70">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-display text-charcoal">{value}</dd>
    </div>
  );
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

/** Honest, disabled cards shown while the caller has no administrator role. */
function placeholderCards(): ConnectionCard[] {
  return (["instagram", "tiktok"] as const).map((platform) => ({
    platform,
    connected: false,
    accountName: null,
    externalAccountId: null,
    officialHandle: platform === "instagram" ? "frogqueenivy" : "ivyvibing",
    officialUrl:
      platform === "instagram"
        ? "https://www.instagram.com/frogqueenivy/"
        : "https://www.tiktok.com/@ivyvibing",
    verified: false,
    lastSyncAt: null,
    lastSyncStatus: null,
    tokenRenewal: "Not configured",
    credentialsConfigured: false,
    missingEnvVars: [],
    setupUrl: "https://developers.facebook.com/docs/instagram-platform",
    redirectUri: null,
    scopes: [],
    authorizeUrl: `/api/public/oauth/${platform}/authorize`,
  }));
}
