/**
 * Pond Chat — server-only logic for the community chat box.
 *
 * Anyone with a Solana wallet can post, but only after signing a one-time
 * challenge with that wallet, so a message can never be forged for someone
 * else's address. Public reads go through the masked `chat_recent` helper, so
 * full wallet addresses are never exposed to visitors.
 */
import { createClient } from "@supabase/supabase-js";
import { ed25519 } from "@noble/curves/ed25519.js";
import bs58 from "bs58";
import type { Database } from "@/integrations/supabase/types";

export const MAX_MESSAGE_LENGTH = 240;
/** One message per wallet per this many seconds. */
const COOLDOWN_SECONDS = 20;
/** Hard ceiling per wallet per rolling hour. */
const HOURLY_LIMIT = 15;
const NONCE_TTL_MS = 10 * 60 * 1000;

export interface ChatMessage {
  id: string;
  wallet: string;
  body: string;
  createdAt: string;
}

export interface PostResult {
  accepted: boolean;
  reason?: string;
}

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export function chatChallenge(input: { wallet: string; nonce: string; body: string }): string {
  return [
    "ivy vibing — Pond Chat",
    "Signing this only proves you own this wallet. It never moves funds.",
    `Wallet: ${input.wallet}`,
    `Message: ${input.body}`,
    `Nonce: ${input.nonce}`,
  ].join("\n");
}

/** Collapse whitespace and drop control characters; keeps emoji intact. */
export function cleanBody(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

export async function readChat(limit = 50): Promise<ChatMessage[]> {
  try {
    const { data, error } = await publicClient().rpc("chat_recent", { _limit: limit });
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>)
      .map((row) => ({
        id: String(row.id),
        wallet: String(row.wallet_masked ?? ""),
        body: String(row.body ?? ""),
        createdAt: String(row.created_at ?? new Date().toISOString()),
      }))
      .reverse();
  } catch {
    return [];
  }
}

export async function issueChatNonce(): Promise<{ nonce: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabaseAdmin
    .from("game_nonces")
    .insert({ nonce, expires_at: new Date(Date.now() + NONCE_TTL_MS).toISOString() });
  if (error) throw new Error("Could not open the chat right now.");
  return { nonce };
}

export function isSolanaAddress(value: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return false;
  try {
    return bs58.decode(value).length === 32;
  } catch {
    return false;
  }
}

export async function postChatMessage(input: {
  wallet: string;
  body: string;
  nonce: string;
  signature: string;
}): Promise<PostResult> {
  const wallet = input.wallet.trim();
  const body = cleanBody(input.body);

  if (!isSolanaAddress(wallet)) return { accepted: false, reason: "That is not a Solana address." };
  if (body.length === 0) return { accepted: false, reason: "Type something first." };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: nonceRow } = await supabaseAdmin
    .from("game_nonces")
    .select("id, expires_at, consumed_at")
    .eq("nonce", input.nonce)
    .maybeSingle();

  if (!nonceRow || nonceRow.consumed_at || new Date(nonceRow.expires_at) < new Date()) {
    return { accepted: false, reason: "That signing request expired. Try sending again." };
  }

  let verified = false;
  try {
    verified = ed25519.verify(
      bs58.decode(input.signature),
      new TextEncoder().encode(chatChallenge({ wallet, nonce: input.nonce, body })),
      bs58.decode(wallet),
    );
  } catch {
    verified = false;
  }
  if (!verified) return { accepted: false, reason: "Wallet signature did not check out." };

  await supabaseAdmin
    .from("game_nonces")
    .update({ consumed_at: new Date().toISOString(), wallet_address: wallet })
    .eq("id", nonceRow.id);

  // Rate limits are checked server-side against real rows, never the client.
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("chat_messages")
    .select("created_at, body")
    .eq("wallet_address", wallet)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: false })
    .limit(HOURLY_LIMIT + 1);

  const rows = recent ?? [];
  if (rows.length > 0) {
    const last = new Date(rows[0]!.created_at as string).getTime();
    const waited = (Date.now() - last) / 1000;
    if (waited < COOLDOWN_SECONDS) {
      return {
        accepted: false,
        reason: `Give the pond ${Math.ceil(COOLDOWN_SECONDS - waited)}s before the next ribbit.`,
      };
    }
    if (rows.length >= HOURLY_LIMIT) {
      return { accepted: false, reason: "That is plenty for one hour. Come back soon." };
    }
    if ((rows[0]!.body as string) === body) {
      return { accepted: false, reason: "You just said that." };
    }
  }

  const { error } = await supabaseAdmin
    .from("chat_messages")
    .insert({ wallet_address: wallet, body });
  if (error) return { accepted: false, reason: "The pond could not take that message." };

  return { accepted: true };
}
