import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AdminShell } from "@/components/admin/admin-nav";
import { StatusChip } from "@/components/ivy/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMonthlyWinners,
  recordPayout,
  type SeasonWinners,
  type WinnerRow,
} from "@/lib/game-winners.functions";

export const Route = createFileRoute("/_authenticated/admin/winners")({
  head: () => ({
    meta: [
      { title: "Monthly winners — ivy vibing admin" },
      {
        name: "description",
        content:
          "Month-by-month Lily Pad Leap champions with full Solana wallets and airdrop payout tracking.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WinnersPage,
});

const PLACE_LABEL = ["1st", "2nd", "3rd"];

function WinnerCard({
  season,
  winner,
  defaultTokens,
}: {
  season: SeasonWinners;
  winner: WinnerRow;
  defaultTokens: number;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(recordPayout);
  const [tokens, setTokens] = useState(
    String(winner.tokens || (winner.place === 1 ? defaultTokens : 0)),
  );
  const [tx, setTx] = useState(winner.txSignature ?? "");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: (paid: boolean) =>
      save({
        data: {
          season: season.season,
          place: winner.place,
          wallet: winner.wallet,
          score: winner.score,
          tokens: Number(tokens) || 0,
          paid,
          txSignature: tx || undefined,
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "winners"] }),
  });

  return (
    <li className="rounded-2xl border-2 border-charcoal/15 bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-yellow px-3 py-1 font-display text-sm text-charcoal">
          {PLACE_LABEL[winner.place - 1]}
        </span>
        <span className="font-display text-sm text-charcoal">
          {winner.score.toLocaleString("en-US")} pts
        </span>
        <span className="text-sm text-charcoal/70">{winner.plays} plays</span>
        {winner.paidAt ? (
          <StatusChip status="ok" label={`Dropped ${winner.paidAt.slice(0, 10)}`} />
        ) : (
          <StatusChip status="pending" label="Not dropped yet" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="break-all rounded-xl bg-leaf px-3 py-2 font-mono text-xs text-charcoal">
          {winner.wallet}
        </code>
        <Button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(winner.wallet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="min-h-11 rounded-full bg-frog px-4 font-display text-charcoal pop hover:bg-frog"
        >
          {copied ? "Copied" : "Copy wallet"}
        </Button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
        <label className="text-sm text-charcoal/80">
          <span className="sr-only">Tokens for {PLACE_LABEL[winner.place - 1]} place</span>
          <Input
            inputMode="numeric"
            value={tokens}
            onChange={(event) => setTokens(event.target.value.replace(/[^\d]/g, ""))}
            placeholder="Tokens"
            className="min-h-11 border-2 border-charcoal bg-card font-mono text-sm"
          />
        </label>
        <label className="text-sm text-charcoal/80">
          <span className="sr-only">Transaction signature</span>
          <Input
            value={tx}
            onChange={(event) => setTx(event.target.value)}
            placeholder="Transaction signature (optional)"
            className="min-h-11 border-2 border-charcoal bg-card font-mono text-sm"
          />
        </label>
        <Button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(!winner.paidAt)}
          className="min-h-11 rounded-full bg-pink px-4 font-display text-charcoal pop hover:bg-pink"
        >
          {winner.paidAt ? "Mark as not dropped" : "Mark as dropped"}
        </Button>
      </div>
      {mutation.isError ? (
        <p className="mt-2 text-sm text-charcoal/80">Could not save — try again.</p>
      ) : null}
    </li>
  );
}

function WinnersPage() {
  const fetchWinners = useServerFn(getMonthlyWinners);
  const query = useQuery({
    queryKey: ["admin", "winners"],
    queryFn: () => fetchWinners(),
    retry: false,
  });

  const data = query.data;

  async function copyPayoutCsv() {
    if (!data) return;
    const csv = [
      "season,place,wallet,score,tokens,dropped_at,tx_signature",
      ...data.seasons.flatMap((season) =>
        season.winners.map((winner) =>
          [
            season.season,
            winner.place,
            winner.wallet,
            winner.score,
            winner.tokens,
            winner.paidAt ?? "",
            winner.txSignature ?? "",
          ].join(","),
        ),
      ),
    ].join("\n");
    await navigator.clipboard.writeText(csv);
  }

  return (
    <AdminShell
      title="Monthly winners"
      intro="Every month of Lily Pad Leap with its champions, full Solana wallets and a record of which airdrops you have already sent."
    >
      <section className="rounded-2xl bg-card p-5 pop-static">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-charcoal/85">
            Current month: <span className="font-display">{data?.currentSeason ?? "—"}</span> · top
            wallet receives {(data?.prizeTokens ?? 0).toLocaleString("en-US")} $ivy.
          </p>
          <Button
            type="button"
            onClick={copyPayoutCsv}
            disabled={!data || data.seasons.length === 0}
            className="min-h-11 rounded-full bg-frog px-4 font-display text-charcoal pop hover:bg-frog"
          >
            Copy payout CSV
          </Button>
          {query.isError ? <StatusChip status="pending" label="Staff role required" /> : null}
        </div>
      </section>

      {query.isLoading ? <p className="text-charcoal/80">Loading months…</p> : null}

      {data?.seasons.length === 0 ? (
        <section className="rounded-2xl bg-card p-5 pop-static">
          <p className="text-charcoal/85">
            No scores recorded yet. Winners appear here as soon as wallets play Lily Pad Leap.
          </p>
        </section>
      ) : null}

      {(data?.seasons ?? []).map((season) => (
        <section key={season.season} className="rounded-2xl bg-card p-5 pop-static">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg text-charcoal">{season.label}</h2>
            <StatusChip
              status={season.isComplete ? "ok" : "pending"}
              label={season.isComplete ? "Month closed" : "In progress"}
            />
            <span className="text-sm text-charcoal/70">{season.players} wallets</span>
          </div>
          <ul className="mt-4 space-y-3">
            {season.winners.map((winner) => (
              <WinnerCard
                key={`${season.season}-${winner.place}`}
                season={season}
                winner={winner}
                defaultTokens={data?.prizeTokens ?? 0}
              />
            ))}
          </ul>
        </section>
      ))}
    </AdminShell>
  );
}
