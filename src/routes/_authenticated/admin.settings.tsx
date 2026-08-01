import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin/admin-nav";
import { StatusChip } from "@/components/ivy/primitives";
import {
  bootstrapFirstAdmin,
  getAdminStatus,
  getAutomationSettings,
  listAuditLog,
  updateAutomationSettings,
  type AutomationSettings,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Automation — ivy vibing admin" },
      {
        name: "description",
        content: "Control automatic publication of verified Ivy posts and review the audit log.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const TOGGLES: Array<{
  key: keyof AutomationSettings;
  label: string;
  help: string;
}> = [
  {
    key: "autoPublishVerifiedPosts",
    label: "Auto-publish verified posts",
    help: "Only posts whose external account ID matches Ivy's authorized account are published automatically. Everything else stays pending.",
  },
  {
    key: "autoCategorizeVerifiedPosts",
    label: "Auto-categorize verified posts",
    help: "Videos and reels go to Fresh Posts + Ivy TV; images and carousels go to Fresh Posts + Hall of Fame. Manual placements always win.",
  },
  {
    key: "defaultCommunityReuse",
    label: "Default community / meme reuse",
    help: "Off by default. Only items explicitly marked reusable may be shared for community reuse.",
  },
  {
    key: "automationPaused",
    label: "Emergency pause",
    help: "Stops all automatic publication immediately. Existing published items are untouched and sync keeps recording, but nothing new goes live on its own.",
  },
];

function SettingsPage() {
  const fetchStatus = useServerFn(getAdminStatus);
  const fetchSettings = useServerFn(getAutomationSettings);
  const saveSettings = useServerFn(updateAutomationSettings);
  const fetchAudit = useServerFn(listAuditLog);
  const claimAdmin = useServerFn(bootstrapFirstAdmin);
  const [busy, setBusy] = useState(false);

  const statusQuery = useQuery({ queryKey: ["admin", "status"], queryFn: () => fetchStatus() });
  const settingsQuery = useQuery({
    queryKey: ["admin", "automation"],
    queryFn: () => fetchSettings(),
    retry: false,
  });
  const auditQuery = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => fetchAudit(),
    retry: false,
  });

  const isAdmin = statusQuery.data?.isAdmin ?? false;
  const settings = settingsQuery.data;

  async function toggle(key: keyof AutomationSettings, value: boolean) {
    setBusy(true);
    try {
      await saveSettings({ data: { [key]: value } });
      await settingsQuery.refetch();
      await auditQuery.refetch();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell
      title="Automation & audit"
      intro="These settings decide what may go live without a human clicking approve. They only ever apply to Ivy's own verified accounts."
    >
      {!statusQuery.data?.isStaff ? (
        <section className="rounded-2xl bg-yellow p-5 pop-static">
          <h2 className="font-display text-lg text-charcoal">No role granted yet</h2>
          <p className="mt-2 text-sm text-charcoal/85">
            If this is a brand-new clubhouse and no administrator exists, the first signed-in
            account can claim the owner role once.
          </p>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await claimAdmin();
                await statusQuery.refetch();
              } finally {
                setBusy(false);
              }
            }}
            className="mt-3 min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog"
          >
            Claim owner role
          </Button>
        </section>
      ) : null}

      <section className="rounded-2xl bg-card p-5 pop-static">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg text-charcoal">Automatic publication</h2>
          <StatusChip
            status={settings?.automationPaused ? "off" : "ok"}
            label={settings?.automationPaused ? "Paused" : "Active"}
          />
        </div>
        <ul className="mt-4 space-y-4">
          {TOGGLES.map((toggleDef) => {
            const value = settings?.[toggleDef.key] ?? false;
            return (
              <li key={toggleDef.key} className="rounded-xl bg-card p-4">
                <label className="flex min-h-11 items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5"
                    checked={value}
                    disabled={!isAdmin || busy || !settings}
                    onChange={(event) => toggle(toggleDef.key, event.target.checked)}
                  />
                  <span>
                    <span className="font-display text-charcoal">{toggleDef.label}</span>
                    <span className="mt-1 block text-sm text-charcoal/80">{toggleDef.help}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {!isAdmin ? (
          <p className="mt-3 text-sm text-charcoal/70">
            Administrator role required to change these settings.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-5 pop-static">
        <h2 className="font-display text-lg text-charcoal">Audit log</h2>
        <p className="mt-1 text-sm text-charcoal/80">
          Every approval, placement change and automation rule application is recorded.
        </p>
        {(auditQuery.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-charcoal/70">No activity recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {(auditQuery.data ?? []).map((entry) => (
              <li key={entry.id} className="rounded-xl bg-card p-3">
                <span className="font-display">{entry.action}</span>
                {entry.summary ? (
                  <span className="block text-charcoal/85">{entry.summary}</span>
                ) : null}
                <span className="block text-charcoal/60">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
