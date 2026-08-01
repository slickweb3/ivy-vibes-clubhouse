import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * IvySoundscape — optional atmosphere for the pond.
 *
 * Rules from the brief: never annoy, never interrupt, only enhance.
 *  - Off by default. Nothing is created until the visitor opts in.
 *  - Fully synthesised with WebAudio (no asset weight, no network).
 *  - One soft pond pad + tiny wooden "plip" feedback on chunky `.pop` controls.
 *  - Choice is remembered; audio suspends when the tab is hidden.
 */

const STORAGE_KEY = "ivy-sound";

export function IvySoundscape() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const padRef = useRef<GainNode | null>(null);

  const teardown = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    padRef.current?.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
      ctxRef.current = null;
      padRef.current = null;
    }, 600);
  }, []);

  // Build the ambience lazily, only once the visitor asks for it.
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

    // Pond pad: two detuned sines through a gentle low-pass, breathing slowly.
    const pad = ctx.createGain();
    pad.gain.value = 0;
    pad.gain.setTargetAtTime(0.045, ctx.currentTime, 1.4);
    padRef.current = pad;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 620;
    filter.Q.value = 0.4;

    const voices = [110, 164.81, 220].map((hz, index) => {
      const osc = ctx.createOscillator();
      osc.type = index === 2 ? "triangle" : "sine";
      osc.frequency.value = hz;
      osc.detune.value = index * 6 - 6;
      const voice = ctx.createGain();
      voice.gain.value = index === 2 ? 0.25 : 0.5;
      osc.connect(voice).connect(filter);
      osc.start();
      return osc;
    });

    // Slow breath so the pad never sits still.
    const breath = ctx.createOscillator();
    breath.frequency.value = 0.07;
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = 90;
    breath.connect(breathDepth).connect(filter.frequency);
    breath.start();

    filter.connect(pad).connect(ctx.destination);

    const onVisibility = () => {
      if (document.hidden) void ctx.suspend().catch(() => undefined);
      else void ctx.resume().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      breath.stop();
      voices.forEach((osc) => osc.stop());
      teardown();
    };
  }, [on, teardown]);

  // Tactile feedback: a short wooden plip when a chunky control is pressed.
  useEffect(() => {
    if (!on) return undefined;

    const plip = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest?.(".pop");
      const ctx = ctxRef.current;
      if (!target || !ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
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
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={on ? "Mute pond ambience" : "Play pond ambience"}
      className="fixed right-4 bottom-20 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-lavender text-charcoal pop sm:right-6 sm:bottom-24"
    >
      {on ? (
        <Volume2 aria-hidden className="h-5 w-5" />
      ) : (
        <VolumeX aria-hidden className="h-5 w-5" />
      )}
      <span className="sr-only">{on ? "Mute pond ambience" : "Play pond ambience"}</span>
    </button>
  );
}
