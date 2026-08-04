/**
 * "How to buy $ivy" — a two-tab, step-by-step guide.
 *
 * Honest by construction: every link and the mint address come from
 * `projectConfig`. Nothing is rendered if the contract is not verified, so this
 * section can never invite anyone to buy an address that does not exist.
 */
import { useState } from "react";
import { Section, Sticker } from "@/components/ivy/primitives";
import { projectConfig, hasVerifiedContract } from "@/config/project";

type TabId = "pumpfun" | "phantom";

interface Step {
  title: string;
  body: string;
}

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: "pumpfun", label: "Buy on pump.fun", blurb: "The fastest route — buy straight on the launch platform." },
  { id: "phantom", label: "Buy in Phantom", blurb: "Swap inside the Phantom wallet app on your phone or browser." },
];

function buildSteps(coinUrl: string, mint: string): Record<TabId, Step[]> {
  return {
    pumpfun: [
      {
        title: "Install a Solana wallet",
        body: "Get Phantom (phantom.com) or Solflare from the official site or your app store. Save your recovery phrase offline — never share it with anyone, ever.",
      },
      {
        title: "Add some SOL",
        body: "Buy SOL inside the wallet or send it from an exchange. Keep a little extra (about 0.02 SOL) for network fees.",
      },
      {
        title: "Open the official $ivy page",
        body: `Go to ${coinUrl} — or tap the button below. Always compare the mint address on the page with the one published on this site.`,
      },
      {
        title: "Connect your wallet",
        body: "Hit “Connect wallet” on pump.fun and approve the connection request in your wallet. pump.fun never needs your seed phrase.",
      },
      {
        title: "Enter an amount and buy",
        body: "Type how much SOL you want to spend, set slippage if you like (1–3% is normal), press Buy and approve the transaction.",
      },
      {
        title: "Check it landed",
        body: "Your $ivy shows up in your wallet's token list within seconds. Welcome to the pond.",
      },
    ],
    phantom: [
      {
        title: "Open Phantom and fund it",
        body: "Install Phantom from phantom.com, create or import a wallet, then top it up with SOL.",
      },
      {
        title: "Tap Swap",
        body: "In the Phantom app choose Swap, then set the “you pay” token to SOL.",
      },
      {
        title: "Paste the $ivy mint address",
        body: `In the “you receive” field, search or paste the official mint: ${mint}. Copy it from this page — never from a DM.`,
      },
      {
        title: "Review the quote",
        body: "Check the amount and price impact. On a small, young market, keeping slippage around 1–3% helps the swap go through.",
      },
      {
        title: "Confirm the swap",
        body: "Press Swap, approve the transaction and wait a few seconds for confirmation.",
      },
      {
        title: "Track it here",
        body: "Come back to the live $ivy tracker on this page for price, market cap, liquidity and volume straight from the on-chain pair.",
      },
    ],
  };
}

export function HowToBuy() {
  const [tab, setTab] = useState<TabId>("pumpfun");
  const [copied, setCopied] = useState(false);
  const mint = projectConfig.contractAddress;

  if (!hasVerifiedContract() || !mint) return null;

  const coinUrl = projectConfig.tokenomicsUrl ?? "https://pump.fun";
  const steps = buildSteps(coinUrl, mint)[tab];
  const active = TABS.find((entry) => entry.id === tab)!;

  const copyMint = async () => {
    try {
      await navigator.clipboard.writeText(mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Section
      id="how-to-buy"
      eyebrow="How to buy"
      title="Hop in: buying $ivy step by step"
      intro="Two routes, both official. Follow the steps in order and verify the mint address before every purchase."
      tone="leaf"
    >
      <div
        role="tablist"
        aria-label="Ways to buy $ivy"
        className="flex flex-wrap gap-2 rounded-full bg-card/70 p-1.5 pop-static sm:inline-flex"
      >
        {TABS.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            type="button"
            id={`buy-tab-${entry.id}`}
            aria-selected={tab === entry.id}
            aria-controls={`buy-panel-${entry.id}`}
            onClick={() => setTab(entry.id)}
            className={`min-h-11 flex-1 rounded-full px-5 font-display text-sm transition-colors sm:flex-none ${
              tab === entry.id
                ? "bg-frog text-charcoal pop-static"
                : "text-charcoal/75 hover:bg-card"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`buy-panel-${tab}`}
        aria-labelledby={`buy-tab-${tab}`}
        className="mt-6"
      >
        <p className="measure font-display text-base text-charcoal/85">{active.blurb}</p>

        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-2xl bg-card p-4 pop-static sm:p-5"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow font-display text-sm text-charcoal"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="font-display text-base text-charcoal">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed break-words text-charcoal/80">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 rounded-2xl bg-card p-4 pop-static sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Sticker tone="lavender">Official $ivy mint</Sticker>
          <span className="text-xs text-charcoal/70">{projectConfig.blockchain}</span>
        </div>
        <p className="mt-3 font-mono text-xs break-all text-charcoal/90 sm:text-sm">{mint}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyMint}
            className="inline-flex min-h-11 items-center rounded-full bg-lavender px-5 font-display text-sm text-charcoal pop"
          >
            {copied ? "Copied ✓" : "Copy mint address"}
          </button>
          <a
            href={coinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full bg-frog px-5 font-display text-sm text-charcoal pop"
          >
            Buy on pump.fun ↗
          </a>
          <a
            href="https://phantom.com/download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full bg-yellow px-5 font-display text-sm text-charcoal pop"
          >
            Get Phantom ↗
          </a>
        </div>
      </div>

      <p className="mt-5 rounded-xl bg-pink p-4 font-display text-sm text-charcoal pop-static">
        Nothing here is financial advice. Only ever buy the mint address published on this site,
        never one sent to you in a DM, and never share your recovery phrase.
      </p>
    </Section>
  );
}
