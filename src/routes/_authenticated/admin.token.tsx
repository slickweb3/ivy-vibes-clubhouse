import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AdminShell } from "@/components/admin/admin-nav";
import { StatusChip } from "@/components/ivy/primitives";
import {
  getTokenSettings,
  updateTokenSettings,
  type TokenRecordSettings,
} from "@/lib/admin.functions";
import { getMarketSnapshot } from "@/lib/market.functions";

export const Route = createFileRoute("/_authenticated/admin/token")({
  head: () => ({
    meta: [
      { title: "Token & chart — ivy vibing admin" },
      {
        name: "description",
        content:
          "Publish the verified $ivy mint address and creator wallet, and switch on live Dexscreener market data.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TokenPage,
});

const FIELDS: Array<{
  key: keyof TokenRecordSettings;
  label: string;
  help: string;
  placeholder: string;
}> = [
  {
    key: "contractAddress",
    label: "Contract / mint address",
    help: "The single switch. Once this is saved, the tracker, the chart and the token record all go live automatically.",
    placeholder: "Leave empty until the mint exists",
  },
  {
    key: "devWalletAddress",
    label: "Creator (dev) wallet",
    help: "Stored for verification and for watching the launch wallet. It never fabricates a market — only the mint address does that.",
    placeholder: "Creator wallet address",
  },
  {
    key: "pairAddress",
    label: "Preferred pair address (optional)",
    help: "Pins the chart to one pool. Left empty, the deepest-liquidity pair is used.",
    placeholder: "Auto-selected",
  },
  { key: "blockchain", label: "Blockchain", help: "e.g. Solana.", placeholder: "Solana" },
  {
    key: "launchPlatform",
    label: "Launch platform",
    help: "e.g. pump.fun.",
    placeholder: "pump.fun",
  },
  {
    key: "launchPlatformUrl",
    label: "Launch platform link",
    help: "The official launch page, once it exists.",
    placeholder: "https://pump.fun/...",
  },
  {
    key: "launchDate",
    label: "Launch date",
    help: "YYYY-MM-DD. Empty stays Coming Soon.",
    placeholder: "YYYY-MM-DD",
  },
  {
    key: "tokenSupply",
    label: "Total supply",
    help: "Shown verbatim on the token record.",
    placeholder: "1,000,000,000 $ivy",
  },
];

function TokenPage() {
  const fetchSettings = useServerFn(getTokenSettings);
  const saveSettings = useServerFn(updateTokenSettings);
  const fetchMarket = useServerFn(getMarketSnapshot);
  const [draft, setDraft] = useState<Partial<TokenRecordSettings>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["admin", "token"],
    queryFn: () => fetchSettings(),
    retry: false,
  });
  const marketQuery = useQuery({
    queryKey: ["admin", "market"],
    queryFn: () => fetchMarket(),
    retry: false,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (settingsQuery.data) setDraft(settingsQuery.data);
  }, [settingsQuery.data]);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await saveSettings({ data: draft });
      await settingsQuery.refetch();
      await marketQuery.refetch();
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  const snapshot = marketQuery.data;

  return (
    <AdminShell
      title="Token & chart"
      intro="Nothing about the token is published until you type it here. Saving a mint address is what turns the public tracker and the Dexscreener chart on."
    >
      <section className="rounded-2xl bg-card p-5 pop-static">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg text-charcoal">Live feed status</h2>
          <StatusChip
            status={
              snapshot?.status === "live"
                ? "ok"
                : snapshot?.status === "disabled"
                  ? "off"
                  : "pending"
            }
            label={snapshot?.status ? snapshot.status.replace(/_/g, " ") : "checking"}
          />
        </div>
        <p className="mt-2 text-sm text-charcoal/85">
          {snapshot?.message ?? "Reading Dexscreener for the configured mint address."}
        </p>
        {snapshot?.status === "live" ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              ["Price", snapshot.priceUsd],
              ["Market cap", snapshot.marketCapUsd ?? snapshot.fdvUsd],
              ["Liquidity", snapshot.liquidityUsd],
              ["24h volume", snapshot.volume24hUsd],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-card p-3">
                <dt className="font-display text-xs uppercase text-charcoal/70">{label}</dt>
                <dd className="font-display text-lg text-charcoal">
                  {typeof value === "number" ? `$${value.toLocaleString("en-US")}` : "—"}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {snapshot?.pairUrl ? (
          <a
            href={snapshot.pairUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center font-display text-sm underline underline-offset-4"
          >
            Open the pair on Dexscreener
          </a>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-5 pop-static">
        <h2 className="font-display text-lg text-charcoal">Verified token record</h2>
        <p className="mt-1 text-sm text-charcoal/80">
          Every empty field renders as “Coming Soon” on the public site.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="font-display text-sm text-charcoal">{field.label}</span>
              <Input
                value={(draft[field.key] as string | null) ?? ""}
                placeholder={field.placeholder}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                className="mt-1 min-h-11 rounded-xl border-2 border-charcoal bg-card"
              />
              <span className="mt-1 block text-xs text-charcoal/70">{field.help}</span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-card p-4">
          <div>
            <p className="font-display text-sm text-charcoal">Live market data</p>
            <p className="text-xs text-charcoal/70">
              Turn off to hide all live figures and the chart without deleting the mint address.
            </p>
          </div>
          <Switch
            checked={draft.marketDataEnabled ?? true}
            onCheckedChange={(value) => setDraft((prev) => ({ ...prev, marketDataEnabled: value }))}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            disabled={busy}
            onClick={save}
            className="min-h-11 rounded-full bg-frog px-5 font-display text-charcoal pop hover:bg-frog"
          >
            {busy ? "Saving…" : "Publish token record"}
          </Button>
          {saved ? <StatusChip status="ok" label="Saved" /> : null}
          {settingsQuery.isError ? (
            <StatusChip status="pending" label="Admin role required" />
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
