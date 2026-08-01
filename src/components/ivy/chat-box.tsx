/**
 * Pond Chat — the community chat box.
 *
 * Wallet holders sign a one-time challenge with their Solana wallet, so every
 * message is provably from that address. Only masked addresses ever come back
 * from the server.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import bs58 from "bs58";
import { Section } from "@/components/ivy/primitives";
import { Button } from "@/components/ui/button";
import { getChat, sendChatMessage, startChatMessage } from "@/lib/chat.functions";
import { discover } from "@/lib/discoveries";

const MAX_LENGTH = 240;

interface SolanaProvider {
  publicKey?: { toString(): string } | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array }>;
}

function getProvider(): SolanaProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { solana?: SolanaProvider; solflare?: SolanaProvider };
  return w.solana ?? w.solflare ?? null;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function PondChat() {
  const fetchChat = useServerFn(getChat);
  const beginMessage = useServerFn(startChatMessage);
  const postMessage = useServerFn(sendChatMessage);
  const queryClient = useQueryClient();

  const [wallet, setWallet] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const chatQuery = useQuery({
    queryKey: ["pond-chat"],
    queryFn: () => fetchChat(),
    refetchInterval: 12_000,
    staleTime: 8_000,
  });

  const messages = useMemo(() => chatQuery.data ?? [], [chatQuery.data]);

  // Reconnect silently when the wallet already trusts this site.
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;
    void provider
      .connect({ onlyIfTrusted: true })
      .then((res) => setWallet(res.publicKey.toString()))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setStatus("No Solana wallet found. Install Phantom or Solflare, then reload.");
      return;
    }
    try {
      const res = await provider.connect();
      setWallet(res.publicKey.toString());
      setStatus(null);
    } catch {
      setStatus("Wallet connection was cancelled.");
    }
  }, []);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const provider = getProvider();
      if (!wallet || !provider) throw new Error("Connect a Solana wallet first.");
      const { nonce } = await beginMessage({});
      const message = [
        "ivy vibing — Pond Chat",
        "Signing this only proves you own this wallet. It never moves funds.",
        `Wallet: ${wallet}`,
        `Message: ${body}`,
        `Nonce: ${nonce}`,
      ].join("\n");
      const signed = await provider.signMessage(new TextEncoder().encode(message), "utf8");
      return postMessage({
        data: { wallet, body, nonce, signature: bs58.encode(signed.signature) },
      });
    },
    onSuccess: (result) => {
      if (!result.accepted) {
        setStatus(result.reason ?? "That message was not accepted.");
        return;
      }
      setDraft("");
      setStatus(null);
      discover("chatter");
      void queryClient.invalidateQueries({ queryKey: ["pond-chat"] });
    },
    onError: (error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Could not send that message.");
    },
  });

  // The signed message must match exactly what the server re-derives, so the
  // draft is normalised the same way before signing.
  const cleaned = draft.replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH);
  const canSend = Boolean(wallet) && cleaned.length > 0 && !send.isPending;

  return (
    <Section
      id="pond-chat"
      tone="leaf"
      eyebrow="Pond chat"
      title="The Lily Pad Chat"
      intro="Bring a Solana wallet, sign one harmless message, and your ribbit joins the pond. Signing never moves funds and only your shortened address is ever shown."
    >
      <div className="rounded-3xl border-[3px] border-charcoal bg-card p-3 shadow-[0_10px_0_0_var(--charcoal)] sm:p-5">
        <div
          ref={listRef}
          className="h-80 overflow-y-auto rounded-2xl bg-background/70 p-3 sm:h-96 sm:p-4"
          aria-live="polite"
          aria-label="Community chat messages"
        >
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm opacity-70">
              {chatQuery.isLoading ? "Listening to the pond…" : "Quiet pond. Say the first ribbit."}
            </p>
          ) : (
            <ul className="space-y-2">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className="rounded-2xl border-2 border-charcoal/15 bg-card px-3 py-2"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs font-bold text-ivy">{message.wallet}</span>
                    <span className="text-[11px] opacity-60">{timeAgo(message.createdAt)}</span>
                  </div>
                  <p className="mt-1 break-words text-sm leading-relaxed">{message.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          className="mt-3 flex flex-col gap-2 pr-16 sm:flex-row sm:pr-0"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) send.mutate(cleaned);
          }}
        >
          <label className="sr-only" htmlFor="pond-chat-input">
            Your message
          </label>
          <input
            id="pond-chat-input"
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={wallet ? "Say something to the pond…" : "Connect a wallet to chat"}
            disabled={!wallet || send.isPending}
            className="min-h-12 flex-1 rounded-full border-[3px] border-charcoal bg-background px-4 text-base outline-none placeholder:opacity-60 focus-visible:ring-4 focus-visible:ring-frog/50 disabled:opacity-60"
          />
          {wallet ? (
            <Button
              type="submit"
              disabled={!canSend}
              className="min-h-12 rounded-full bg-frog px-6 font-display text-charcoal pop hover:bg-frog"
            >
              {send.isPending ? "Signing…" : "Ribbit"}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={connect}
              className="min-h-12 rounded-full bg-pink px-6 font-display text-charcoal pop hover:bg-pink"
            >
              Connect wallet
            </Button>
          )}
        </form>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pr-16 text-xs opacity-80 sm:pr-0">
          <span>
            {wallet
              ? `Signed in as ${wallet.slice(0, 4)}…${wallet.slice(-4)} · ${MAX_LENGTH - cleaned.length} characters left`
              : "Read-only until a wallet is connected. Ivy's owner can remove any message."}
          </span>
          <span>Be kind. Keep it Ivy-friendly.</span>
        </div>

        {status ? (
          <p role="status" className="mt-2 rounded-xl bg-yellow px-3 py-2 text-sm text-charcoal">
            {status}
          </p>
        ) : null}
      </div>
    </Section>
  );
}
