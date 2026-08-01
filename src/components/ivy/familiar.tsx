import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Section, Sticker } from "@/components/ivy/primitives";
import { discover } from "@/lib/discoveries";
import { projectConfig } from "@/config/project";
import portraitAsset from "@/assets/ivy-card-portrait.jpg.asset.json";
import {
  CARD_SET,
  RARITY_ODDS,
  isSolanaAddress,
  isSummonable,
  maskAddress,
  rarityRing,
  shareText,
  summonFamiliar,
  type Familiar,
} from "@/lib/familiar";
import { CARD_H, CARD_W, drawFamiliarCard } from "@/lib/familiar-card";

/**
 * The Frog Familiar Foundry — Ivy's trading card press.
 *
 * One line of text in, one card out — the same card forever, on every device,
 * for that exact text. That determinism is the whole system: the card is not
 * rolled and stored somewhere you have to trust, it is *derived*, so anyone can
 * re-derive it from the same seed and check the sigil printed on the card.
 * Paste a Solana address and the card is bound to that address as a read-only
 * seed — nothing is signed, no approval is requested, no wallet is connected.
 *
 * The card renders locally as a real image you can save or post, which is the
 * entire advertisement: people share the artefact, the artefact hands out the
 * address of the pond.
 */

const SUGGESTIONS = ["frogqueenivy", "ivyvibing", "short spine gang", "pond enjoyer"];

const RECENT_KEY = "ivy-familiar-last";
const BINDER_KEY = "ivy-familiar-binder";
const BINDER_MAX = 12;

function playCroak(semitone: number) {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const freq = 146.83 * Math.pow(2, semitone / 12); // D3 home key, same as the pond
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq * 0.94, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.12);
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = freq * 2;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.05, now + 0.16);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    shimmer.connect(shimmerGain).connect(ctx.destination);
    osc.start(now);
    shimmer.start(now + 0.05);
    osc.stop(now + 1.2);
    shimmer.stop(now + 1.2);
    window.setTimeout(() => void ctx.close(), 1600);
  } catch {
    /* audio is a garnish, never a requirement */
  }
}

function readBinder(): string[] {
  try {
    const raw = window.localStorage.getItem(BINDER_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string").slice(0, BINDER_MAX);
  } catch {
    return [];
  }
}

export function FamiliarFoundry() {
  const [value, setValue] = useState("");
  const [familiar, setFamiliar] = useState<Familiar | null>(null);
  const [copied, setCopied] = useState(false);
  const [binder, setBinder] = useState<string[]>([]);
  const [portrait, setPortrait] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);

  // Ivy's artwork, loaded once from our own origin so the canvas stays clean
  // and every saved card is a real downloadable PNG.
  useEffect(() => {
    const img = new Image();
    img.decoding = "async";
    img.src = portraitAsset.url;
    const done = () => setPortrait(img);
    if (img.complete) done();
    else {
      img.addEventListener("load", done);
      img.addEventListener("error", () => setPortrait(null));
    }
    return () => img.removeEventListener("load", done);
  }, []);

  // Bring back the last card and the binder so returning collectors keep them —
  // but never clobber text the visitor typed before hydration finished.
  useEffect(() => {
    setBinder(readBinder());
    const typed = inputRef.current?.value ?? "";
    if (typed.trim()) {
      setValue(typed);
      return;
    }
    try {
      const last = window.localStorage.getItem(RECENT_KEY);
      if (last) {
        setValue(last);
        setFamiliar(summonFamiliar(last));
      }
    } catch {
      /* private mode — the foundry just starts empty */
    }
  }, []);

  useEffect(() => {
    if (familiar && canvasRef.current) drawFamiliarCard(canvasRef.current, familiar, portrait);
  }, [familiar, portrait]);

  const ready = isSummonable(value);

  const summon = useCallback((raw: string) => {
    if (!isSummonable(raw)) return;
    const next = summonFamiliar(raw);
    setFamiliar(next);
    setCopied(false);
    playCroak(next.croak.note);
    const trimmed = raw.trim();
    try {
      window.localStorage.setItem(RECENT_KEY, trimmed);
      const kept = [trimmed, ...readBinder().filter((entry) => entry !== trimmed)].slice(0, BINDER_MAX);
      window.localStorage.setItem(BINDER_KEY, JSON.stringify(kept));
      setBinder(kept);
    } catch {
      /* ignore */
    }
    discover("familiar");
    if (next.rarity === "Frog Queen's Own" || next.rarity === "Royal Court") discover("bloodline");
  }, []);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !familiar) return;
    const link = document.createElement("a");
    link.download = `${familiar.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-ivy-card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    discover("keepsake");
  }, [familiar]);

  const shareUrl = useMemo(() => {
    if (!familiar) return "#";
    const text = `${shareText(familiar)} https://ivyvibing.com/#familiar`;
    return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  }, [familiar]);

  const copyBrag = useCallback(async () => {
    if (!familiar) return;
    try {
      await navigator.clipboard.writeText(`${shareText(familiar)} https://ivyvibing.com/#familiar`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked — the X button still works */
    }
  }, [familiar]);

  // Gentle pointer tilt so foil cards catch the light like real ones do.
  const onTilt = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--card-rx", `${(-py * 9).toFixed(2)}deg`);
    el.style.setProperty("--card-ry", `${(px * 11).toFixed(2)}deg`);
    el.style.setProperty("--card-shine-x", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--card-shine-y", `${((py + 0.5) * 100).toFixed(1)}%`);
  }, []);

  const resetTilt = useCallback(() => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--card-rx", "0deg");
    el.style.setProperty("--card-ry", "0deg");
  }, []);

  const ring = familiar ? rarityRing(familiar.rarity) : "#83D94E";

  return (
    <Section
      id="familiar"
      tone="ivy"
      eyebrow="Pull a card"
      title="The Frog Familiar Foundry"
      intro="Ivy's trading card press. Every name, handle and wallet address in the world already has one card waiting in the pond — matte paper for the regulars, holographic foil for the rare ones, prismatic for the Frog Queen's Own. Type a seed, the press derives the card on the spot: same seed, same card, forever, on every device."
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        {/* ---- the press ------------------------------------------------ */}
        <div>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              summon(value);
            }}
          >
            <label className="sr-only" htmlFor="familiar-seed">
              A name, handle or Solana address to pull a card from
            </label>
            <input
              id="familiar-seed"
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={64}
              placeholder="name, handle or Solana address"
              autoComplete="off"
              spellCheck={false}
              className="min-h-12 flex-1 rounded-2xl border-2 border-cream/30 bg-cream/10 px-4 text-base text-cream placeholder:text-cream/50 focus:border-frog focus:outline-none"
            />
            <button
              type="submit"
              disabled={!ready}
              className="pop min-h-12 rounded-2xl bg-frog px-6 font-display text-lg text-charcoal disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pull the card
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-cream/70">Try:</span>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setValue(suggestion);
                  summon(suggestion);
                }}
                className="pop rounded-full border border-cream/25 px-3 py-1.5 text-sm text-cream/85"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <p className="mt-4 rounded-2xl border border-cream/20 bg-cream/[0.06] px-4 py-3 text-sm text-cream/80">
            <strong className="text-cream">Read-only by design.</strong> A wallet address is used only
            as text to derive from — no wallet connection, no signature, no approval, no transaction,
            and nothing you type is stored or sent anywhere. The press runs entirely in your browser.
            {isSolanaAddress(value) ? (
              <span className="mt-1 block text-frog">
                Solana address recognised · {maskAddress(value)} — this card is bound to that address.
              </span>
            ) : null}
          </p>

          {/* ---- record sheet ------------------------------------------- */}
          {familiar ? (
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <Sticker tone="yellow">{familiar.rarity}</Sticker>
                {familiar.prismatic ? (
                  <Sticker tone="lavender">Prismatic foil</Sticker>
                ) : familiar.foil ? (
                  <Sticker tone="pink">Holographic foil</Sticker>
                ) : (
                  <Sticker tone="leaf">Matte stock</Sticker>
                )}
                {familiar.walletBound ? <Sticker tone="frog">Wallet-bound</Sticker> : null}
              </div>
              <h3 className="mt-3 font-display text-3xl text-cream sm:text-4xl">{familiar.name}</h3>
              <p className="mt-1 text-cream/80 italic">{familiar.title}</p>
              <p className="measure mt-4 text-cream/90">{familiar.blessing}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {familiar.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-cream/20 bg-cream/[0.06] px-4 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-cream/75">
                        {stat.glyph} {stat.label}
                      </span>
                      <span className="font-display text-2xl text-cream">{stat.value}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream/15">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${stat.value}%`, background: ring }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {familiar.moves.map((move) => (
                  <div
                    key={move.name}
                    className="rounded-2xl border border-cream/20 bg-cream/[0.06] px-4 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-cream">
                        {move.cost} {move.name}
                      </span>
                      <span className="font-display text-xl text-cream">{move.power}</span>
                    </div>
                    <p className="mt-1 text-sm text-cream/75 italic">{move.effect}</p>
                  </div>
                ))}
              </div>

              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {familiar.traits.map((trait) => (
                  <div
                    key={trait.label}
                    className="rounded-2xl border border-cream/20 bg-cream/[0.06] px-4 py-3"
                  >
                    <dt className="text-xs tracking-widest text-cream/60 uppercase">{trait.label}</dt>
                    <dd className="mt-0.5 text-cream">{trait.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={download}
                  className="pop min-h-12 rounded-2xl bg-yellow px-5 font-display text-charcoal"
                >
                  Save the card
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => discover("herald")}
                  className="pop inline-flex min-h-12 items-center rounded-2xl bg-cream px-5 font-display text-charcoal"
                >
                  Post on X
                </a>
                <button
                  type="button"
                  onClick={() => void copyBrag()}
                  className="pop min-h-12 rounded-2xl border-2 border-cream/30 px-5 font-display text-cream"
                >
                  {copied ? "Copied!" : "Copy brag"}
                </button>
                <button
                  type="button"
                  onClick={() => playCroak(familiar.croak.note)}
                  className="pop min-h-12 rounded-2xl border-2 border-cream/30 px-5 font-display text-cream"
                >
                  Hear its croak
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* ---- the card ------------------------------------------------- */}
        <div className="lg:sticky lg:top-24">
          {familiar ? (
            <>
              <div
                ref={tiltRef}
                onPointerMove={onTilt}
                onPointerLeave={resetTilt}
                className={`card-tilt ${familiar.prismatic ? "card-prismatic" : familiar.foil ? "card-holo" : ""}`}
                style={{ ["--card-ring" as string]: ring }}
              >
                <canvas
                  ref={canvasRef}
                  width={CARD_W}
                  height={CARD_H}
                  className="block h-auto w-full rounded-[26px]"
                  aria-label={`${familiar.name}, ${familiar.rarity} card, power ${familiar.power}`}
                  role="img"
                />
                <span className="card-shine" aria-hidden="true" />
              </div>
              <p className="mt-3 text-center text-sm text-cream/65">
                {familiar.foil
                  ? "Tilt the card with your pointer — the foil moves with the light."
                  : "Matte stock: no foil, all personality."}{" "}
                Sigil <span className="text-cream">{familiar.sigil}</span>
              </p>
            </>
          ) : (
            <div className="rounded-[26px] border-2 border-dashed border-cream/25 bg-cream/[0.05] px-6 py-16 text-center">
              <p className="font-display text-2xl text-cream">The press is warm.</p>
              <p className="measure mx-auto mt-2 text-cream/75">
                Type a seed and Ivy stamps the card here — artwork, stats, two moves, print number and
                sigil, ready to save.
              </p>
            </div>
          )}

          {/* ---- binder ------------------------------------------------- */}
          {binder.length > 1 ? (
            <div className="mt-6 rounded-2xl border border-cream/20 bg-cream/[0.06] p-4">
              <h4 className="font-display text-lg text-cream">Your binder</h4>
              <p className="mt-1 text-sm text-cream/70">
                The last {BINDER_MAX} seeds you pulled, kept only on this device. Tap one to press the
                card again.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {binder.map((seed) => {
                  const card = summonFamiliar(seed);
                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => {
                        setValue(seed);
                        summon(seed);
                      }}
                      className="pop flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-cream"
                      style={{ borderColor: rarityRing(card.rarity) }}
                      title={`${card.name} · ${card.rarity}`}
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: rarityRing(card.rarity) }}
                      />
                      {isSolanaAddress(seed) ? maskAddress(seed) : seed}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ---- odds + how it works --------------------------------------- */}
      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-cream/20 bg-cream/[0.06] p-5">
          <h4 className="font-display text-2xl text-cream">Published pull rates</h4>
          <p className="mt-1 text-sm text-cream/70">
            The exact weights the press uses — {CARD_SET}, {familiar?.cardTotal ?? 250} card numbers.
          </p>
          <ul className="mt-4 space-y-2">
            {RARITY_ODDS.map((tier) => (
              <li
                key={tier.rarity}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-cream/15 bg-cream/[0.04] px-4 py-3"
              >
                <span
                  className="inline-block h-4 w-4 shrink-0 rounded-full"
                  style={{ background: tier.ring }}
                  aria-hidden="true"
                />
                <span className="font-display text-cream">{tier.rarity}</span>
                <span className="rounded-full bg-cream/15 px-2.5 py-0.5 text-sm text-cream">
                  {tier.chance} · 1 in {tier.oneIn}
                </span>
                {tier.foil ? (
                  <span className="rounded-full bg-pink/25 px-2.5 py-0.5 text-sm text-cream">foil</span>
                ) : null}
                <span className="w-full text-sm text-cream/70">{tier.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-cream/20 bg-cream/[0.06] p-5">
          <h4 className="font-display text-2xl text-cream">How a card holds up</h4>
          <ol className="mt-3 space-y-3 text-cream/85">
            <li>
              <strong className="text-cream">Derived, not rolled.</strong> Your seed goes through a
              fixed hash into a fixed generator. There is no server deciding what you get, and no way
              for anyone — including us — to hand out a rarer card to a friend.
            </li>
            <li>
              <strong className="text-cream">Checkable by anyone.</strong> Every card prints a sigil.
              Re-run the same seed anywhere and you get the same name, rarity, stats, moves, print
              number and sigil. A card that does not re-derive is a fake.
            </li>
            <li>
              <strong className="text-cream">One card per seed.</strong> A wallet address is a unique
              seed, so an address maps to exactly one card, permanently — that is what makes a
              wallet-bound card worth keeping.
            </li>
            <li>
              <strong className="text-cream">Read-only, always.</strong> The press never connects a
              wallet, never asks for a signature and never touches your funds. Treat any site that
              asks you to sign for an Ivy card as a scam.
            </li>
          </ol>
          <div className="mt-4 rounded-2xl border border-yellow/40 bg-yellow/10 p-4">
            <p className="font-display text-lg text-cream">Minting on Solana — Coming Soon</p>
            <p className="mt-1 text-sm text-cream/80">
              On-chain minting is not live and no mint has opened. When it is ready it will be
              announced only on Ivy's official channels, and the same derivation you can run right now
              is what a mint would carry on-chain. Until then, save and share the PNG — it costs
              nothing and no wallet interaction is ever required.
            </p>
            <a
              href={projectConfig.socials.community ?? projectConfig.socials.x ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="pop mt-3 inline-flex min-h-11 items-center rounded-2xl bg-cream px-4 font-display text-charcoal"
            >
              Show your pull in the community
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
