import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { discover } from "@/lib/discoveries";

/**
 * IvySoundscape — an opt-in chiptune adventure theme for the pond.
 *
 * Rules from the brief: never annoy, never interrupt, only enhance.
 *  - Off by default. Nothing is created until the visitor opts in.
 *  - Fully synthesised with WebAudio (no asset weight, no network).
 *  - Style: bouncy Mario-style platformer bass under a Zelda-ish heroic
 *    melody, with frog "ribbit" blips on the offbeats and a soft "woof"
 *    at the end of each phrase.
 *  - Choice is remembered; audio suspends when the tab is hidden.
 */

const STORAGE_KEY = "ivy-sound";

const BPM = 128;
const STEP = 60 / BPM / 2; // eighth note
const BARS = 8;
const STEPS = BARS * 8;

// Heroic pentatonic melody (MIDI notes, 0 = rest), 8 bars of eighths.
const MELODY: number[] = [
  // bar 1-2 — call
  76, 0, 79, 0, 81, 0, 79, 76, 74, 0, 76, 0, 79, 0, 0, 0,
  // bar 3-4 — answer
  81, 0, 83, 0, 86, 0, 83, 81, 79, 0, 76, 0, 74, 0, 0, 0,
  // bar 5-6 — lift
  83, 0, 81, 79, 81, 0, 83, 0, 86, 0, 88, 0, 86, 83, 81, 0,
  // bar 7-8 — home
  79, 0, 81, 0, 83, 0, 79, 0, 76, 0, 0, 74, 76, 0, 0, 0,
];

// Bouncy platformer bass.
const BASS: number[] = [
  40, 52, 40, 52, 45, 57, 45, 57, 43, 55, 43, 55, 38, 50, 38, 50, 40, 52, 40, 52, 45, 57, 45, 57,
  47, 59, 47, 59, 43, 55, 43, 55, 41, 53, 41, 53, 45, 57, 45, 57, 43, 55, 43, 55, 48, 60, 48, 60,
  40, 52, 40, 52, 47, 59, 47, 59, 43, 55, 45, 57, 40, 52, 40, 52,
];

const midiToHz = (note: number) => 440 * Math.pow(2, (note - 69) / 12);

export function IvySoundscape() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const teardown = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    masterRef.current?.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
      ctxRef.current = null;
      masterRef.current = null;
    }, 500);
  }, []);

  useEffect(() => {
    if (!on) {
      teardown();
      return undefined;
    }

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return undefined;

    const ctx = new Ctor();
    ctxRef.current = ctx;
    void ctx.resume().catch(() => undefined);

    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.setTargetAtTime(0.16, ctx.currentTime, 1.2);
    masterRef.current = master;

    // Gentle warmth so the chiptune never gets shrill.
    const warm = ctx.createBiquadFilter();
    warm.type = "lowpass";
    warm.frequency.value = 4200;
    warm.connect(master).connect(ctx.destination);

    // --- voices ------------------------------------------------------------
    const blip = (hz: number, at: number, dur: number, type: OscillatorType, vol: number) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(hz, at);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(vol, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(warm);
      osc.start(at);
      osc.stop(at + dur + 0.03);
    };

    // Frog: two quick descending croaks with a throaty wobble.
    const ribbit = (at: number) => {
      for (let i = 0; i < 2; i += 1) {
        const t = at + i * 0.1;
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(330 - i * 40, t);
        osc.frequency.exponentialRampToValueAtTime(150 - i * 20, t + 0.09);
        const wob = ctx.createOscillator();
        wob.frequency.value = 42;
        const wobDepth = ctx.createGain();
        wobDepth.gain.value = 55;
        wob.connect(wobDepth).connect(osc.frequency);
        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.value = 520;
        band.Q.value = 4;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.09, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        osc.connect(band).connect(gain).connect(warm);
        wob.start(t);
        osc.start(t);
        osc.stop(t + 0.13);
        wob.stop(t + 0.13);
      }
    };

    // Ivy: a soft low "woof" to close a phrase.
    const woof = (at: number) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(210, at);
      osc.frequency.exponentialRampToValueAtTime(88, at + 0.22);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.13, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      const low = ctx.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 900;
      osc.connect(low).connect(gain).connect(warm);
      osc.start(at);
      osc.stop(at + 0.34);
    };

    // --- scheduler ---------------------------------------------------------
    let step = 0;
    let nextTime = ctx.currentTime + 0.12;

    const schedule = () => {
      while (nextTime < ctx.currentTime + 0.4) {
        const i = step % STEPS;
        const lead = MELODY[i];
        if (lead) blip(midiToHz(lead), nextTime, 0.22, "square", 0.13);
        const bass = BASS[i];
        if (bass) blip(midiToHz(bass), nextTime, 0.14, "triangle", 0.16);
        // frog on the offbeat of every other bar
        if (i % 16 === 6 || i % 16 === 14) ribbit(nextTime + STEP * 0.5);
        // Ivy signs off at the end of each 4-bar phrase
        if (i === 30 || i === 62) woof(nextTime + STEP * 0.5);
        nextTime += STEP;
        step += 1;
      }
    };

    schedule();
    const timer = window.setInterval(schedule, 120);

    const onVisibility = () => {
      if (document.hidden) void ctx.suspend().catch(() => undefined);
      else void ctx.resume().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      teardown();
    };
  }, [on, teardown]);

  // Tactile feedback: a coin-ish plip when a chunky control is pressed.
  useEffect(() => {
    if (!on) return undefined;

    const plip = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest?.(".pop");
      const ctx = ctxRef.current;
      if (!target || !ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(988, now);
      osc.frequency.setValueAtTime(1319, now + 0.06);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    };

    document.addEventListener("pointerdown", plip);
    return () => document.removeEventListener("pointerdown", plip);
  }, [on]);

  useEffect(() => {
    setOn(window.localStorage.getItem(STORAGE_KEY) === "on");
  }, []);

  const toggle = () => {
    setOn((was) => {
      const next = !was;
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      if (next) discover("listen");
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={on ? "Mute the ivy theme" : "Play the ivy theme"}
      className="fixed right-4 bottom-20 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-lavender text-charcoal pop sm:right-6 sm:bottom-24"
    >
      {on ? (
        <Volume2 aria-hidden className="h-5 w-5" />
      ) : (
        <VolumeX aria-hidden className="h-5 w-5" />
      )}
      <span className="sr-only">{on ? "Mute the ivy theme" : "Play the ivy theme"}</span>
    </button>
  );
}
