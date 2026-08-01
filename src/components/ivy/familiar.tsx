import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Section, Sticker } from "@/components/ivy/primitives";
import { discover } from "@/lib/discoveries";
import { projectConfig } from "@/config/project";
import {
  isSummonable,
  rarityRing,
  shareText,
  summonFamiliar,
  type Familiar,
} from "@/lib/familiar";
import { CARD_H, CARD_W, drawFamiliarCard } from "@/lib/familiar-card";

/**
 * The Frog Familiar Foundry.
 *
 * One line of text in, one creature out — the same creature forever, on every
 * device, for that exact text. The card renders locally as a real image you can
 * save or post, which is the entire advertisement: people share the artefact,
 * the artefact hands out the address of the pond.
 *
 * No accounts, no storage, nothing typed here leaves the browser.
 */

const SUGGESTIONS = ["frogqueenivy", "ivyvibing", "short spine gang", "pond enjoyer"];

const RECENT_KEY = "ivy-familiar-last";

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

export function FamiliarFoundry() {
  const [value, setValue] = useState("");
  const [familiar, setFamiliar] = useState<Familiar | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Bring back the last creature so returning visitors keep their familiar.
  useEffect(() => {
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
    if (familiar && canvasRef.current) drawFamiliarCard(canvasRef.current, familiar);
  }, [familiar]);

  const ready = isSummonable(value);

  const summon = useCallback(
    (raw: string) => {
      if (!isSummonable(raw)) return;
      const next = summonFamiliar(raw);
      setFamiliar(next);
      setCopied(false);
      playCroak(next.croak.note);
      try {
        window.localStorage.setItem(RECENT_KEY, raw.trim());
      } catch {
        /* ignore */
      }
      discover("familiar");
      if (next.rarity === "Frog Queen's Own" || next.rarity === "Royal Court") discover("bloodline");
    },
    [],
  );

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !familiar) return;
    const link = document.createElement("a");
    link.download = `${familiar.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-ivy-familiar.png`;
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

  const ring = familiar ? rarityRing(familiar.rarity) : "#83D94E";

  return (
    <Section
      id="familiar"
      tone="ivy"
      eyebrow="Summon yours"
      title="The Frog Familiar Foundry"
      intro="Every name in the world already has a frog waiting in Ivy's pond. Type yours and the pond hands over its record — a creature nobody else gets, drawn on the spot, yours to save and post. Same name, same familiar, forever."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <div>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              summon(value);
            }}
          >
            <label className="sr-only" htmlFor="familiar-seed">
              A name, a handle or any word to summon from
            </label>
            <input
              id="familiar-seed"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={64}
              placeholder="your name, handle or favourite word"
              autoComplete="off"
              className="min-h-12 flex-1 rounded-2xl border-2 border-cream/30 bg-cream/10 px-4 text-base text-cream placeholder:text-cream/50 focus:border-frog focus:outline-none"
            />
            <button
              type="submit"
              disabled={!ready}
              className="pop min-h-12 rounded-2xl bg-frog px-6 font-display text-lg text-charcoal disabled:cursor-not-allowed disabled:opacity-50"
            >
              Summon
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
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

          {familiar ? (
            <div className="mt-8">
              <Sticker tone="yellow">{familiar.rarity}</Sticker>
              <h3 className="mt-3 font-display text-3xl text-cream sm:text-4xl">{familiar.name}</h3>
              <p className="mt-1 text-cream/80 italic">{familiar.title}</p>
              <p className="measure mt-4 text-cream/90">{familiar.blessing}</p>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
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

              <p className="mt-4 text-sm text-cream/60">
                Nothing you type is stored or sent anywhere — the pond works it out from the letters
                alone. Share it in the{" "}
                <a
                  className="underline decoration-frog decoration-2 underline-offset-4"
                  href={projectConfig.socials.community ?? projectConfig.socials.x ?? "https://x.com/Ivyvibing"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  community
                </a>{" "}
                and compare pond ranks.
              </p>
            </div>
          ) : (
            <p className="mt-8 text-cream/70">
              The pond is waiting. Two letters is enough.
            </p>
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          {familiar ? (
            <figure
              className="rounded-[2rem] p-2 transition-shadow"
              style={{ boxShadow: `0 24px 60px -24px ${ring}88`, background: `${ring}22` }}
            >
              <canvas
                ref={canvasRef}
                width={CARD_W}
                height={CARD_H}
                aria-label={`Familiar record card for ${familiar.name}, ${familiar.rarity}`}
                className="w-full rounded-[1.7rem]"
                style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}
              />
              <figcaption className="px-2 pt-3 pb-1 text-center text-sm text-cream/70">
                Drawn in your browser, at full resolution. Save it, post it, frame it.
              </figcaption>
            </figure>
          ) : (
            <div
              className="grid place-items-center rounded-[2rem] border-2 border-dashed border-cream/25 bg-cream/[0.05] p-10 text-center text-cream/70"
              style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}
            >
              <p className="font-display text-2xl">
                Your familiar&apos;s record card appears here
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
