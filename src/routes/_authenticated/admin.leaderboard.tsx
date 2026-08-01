import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin/admin-nav";
import { StatusChip } from "@/components/ivy/primitives";
import { getAdminLeaderboard } from "@/lib/game-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/leaderboard")({
  head: () => ({
    meta: [
      { title: "Game leaderboard — ivy vibing admin" },
      {
        name: "description",
        content: "Verified Lily Pad Leap scores by Solana wallet, ready for the monthly airdrop.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const fetchBoard = useServerFn(getAdminLeaderboard);
  const [season, setSeason] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "leaderboard", season ?? "current"],
    queryFn: () => fetchBoard({ data: season ? { season } : {} }),
    retry: false,
  });

  const board = query.data;
  const winner = board?.rows[0];

  async function copyCsv() {
    if (!board) return;
    const csv = [
      "rank,wallet,score,plays,last_played_at",
      ...board.rows.map(
        (row, i) => `${i + 1},${row.wallet},${row.score},${row.plays},${row.lastPlayedAt}`,
      ),
    ].join("\n");
    await navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <AdminShell
      title="Game leaderboard"
      intro="Every row here is a wallet-signed score from Lily Pad Leap. Each month the top wallet receives the 50,000 $ivy airdrop."
    >
      <section className="rounded-2xl bg-card p-5 pop-static">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg text-charcoal">Season</h2>
          <select
            value={season ?? board?.season ?? ""}
            onChange={(event) => setSeason(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-charcoal bg-card px-3 font-display text-sm text-charcoal"
          >
            {(board?.seasons ?? []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <Button
            onClick={copyCsv}
            disabled={!board || board.rows.length === 0}
            className="min-h-11 rounded-full bg-frog px-4 font-display text-charcoal pop hover:bg-frog"
          >
            {copied ? "Copied" : "Copy CSV"}
          </Button>
          {query.isError ? <StatusChip status="pending" label="Staff role required" /> : null}
        </div>

        {winner ? (
          <p className="mt-3 rounded-xl bg-yellow p-3 text-sm text-charcoal">
            Current leader: <span className="font-mono">{winner.wallet}</span> with {winner.score}{" "}
            points — airdrop {board?.prizeTokens.toLocaleString("en-US")} $ivy at month end.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-5 pop-static">
        {board && board.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="font-display text-xs uppercase text-charcoal/70">
                  <th className="py-2">#</th>
                  <th className="py-2">Wallet</th>
                  <th className="py-2">Best score</th>
                  <th className="py-2">Plays</th>
                  <th className="py-2">Last played (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {board.rows.map((row, index) => (
                  <tr key={row.wallet} className="border-t border-charcoal/15">
                    <td className="py-2 font-display">{index + 1}</td>
                    <td className="py-2 font-mono text-xs break-all">{row.wallet}</td>
                    <td className="py-2 font-display">{row.score}</td>
                    <td className="py-2">{row.plays}</td>
                    <td className="py-2 text-charcoal/80">
                      {new Date(row.lastPlayedAt).toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-charcoal/80">
            {query.isLoading ? "Loading scores…" : "No verified scores for this season yet."}
          </p>
        )}
      </section>
    </AdminShell>
  );
}
