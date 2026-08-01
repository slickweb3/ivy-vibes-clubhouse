import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { discover, DISCOVERY_EVENT } from "@/lib/discoveries";
import { registerAudioEngine } from "@/lib/audio/cue";
import type { AudioScene, IvyAudio } from "@/lib/audio/engine";

/**
 * IvySoundscape — the control surface for Ivy's living audio universe.
 *
 * Behaviour, in order of importance:
 *  - Off by default. Nothing is fetched, created or heard until the visitor
 *    opts in; the engine module itself is dynamically imported on first play.
 *  - Adaptive: the mix follows where the visitor is — the landing doorway,
 *    open exploration, the arcade, or the hushed footer — and crossfades.
 *  - Interactive: presses, hovers and discoveries get their own small musical
 *    answers, ducking the score instead of shouting over it.
 *  - Respectful: volume + mute are remembered, audio suspends with the tab,
 *    reduced-motion and low-power devices get a leaner mix, and touch devices
 *    never fire hover cues.
 */

// Versioned so the previous, busier soundtrack never resumes automatically.
const ON_KEY = "ivy-sound-calm-v2";
const VOL_KEY = "ivy-sound-volume";

const SCENE_LABEL: Record<AudioScene, string> = {
  landing: "Doorway",
  explore: "Exploring",
  game: "Arcade",
  hush: "Quiet pond",
};

function readVolume(): number {
  const raw = Number(window.localStorage.getItem(VOL_KEY));
  return Number.isFinite(raw) && raw > 0 && raw <= 1 ? raw : 0.5;
}

/** Gentle by design: the slider's 100% is still a background level. */
const toGain = (volume: number) => volume * 0.2;

export function IvySoundscape() {
  const [on, setOn] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState<AudioScene>("landing");
  const engineRef = useRef<IvyAudio | null>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // The arcade has its own soundtrack — the site score is force-muted there.
  const onGame = pathname.startsWith("/game");
  const active = on && !onGame;

  useEffect(() => {
    setOn(window.localStorage.getItem(ON_KEY) === "on");
    setVolume(readVolume());
  }, []);

  // --- engine lifecycle ----------------------------------------------------
  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let engine: IvyAudio | null = null;

    const lean =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches ||
      (navigator.hardwareConcurrency ?? 8) <= 4;

    void import("@/lib/audio/engine").then(async ({ IvyAudio: Engine }) => {
      if (cancelled) return;
      engine = new Engine(lean);
      engineRef.current = engine;
      registerAudioEngine(engine);
      await engine.start(toGain(readVolume()));
    });

    const onVisibility = () => {
      if (document.hidden) engineRef.current?.suspend();
      else engineRef.current?.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      registerAudioEngine(null);
      engineRef.current = null;
      engine?.dispose();
    };
  }, [active]);

  useEffect(() => {
    engineRef.current?.setVolume(toGain(volume));
  }, [volume]);

  // --- adaptive scene ------------------------------------------------------
  useEffect(() => {
    if (pathname.startsWith("/game")) {
      setScene("game");
      return undefined;
    }

    let frame = 0;
    const evaluate = () => {
      frame = 0;
      const y = window.scrollY;
      const viewport = window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const marked = document.querySelector<HTMLElement>("[data-audio-scene]");
      const markedScene = marked?.dataset.audioScene as AudioScene | undefined;
      const markedTop = marked?.getBoundingClientRect().top ?? Infinity;

      let next: AudioScene = "explore";
      if (y < viewport * 0.55) next = "landing";
      else if (y + viewport > total - viewport * 0.6) next = "hush";
      if (markedScene && markedTop > -viewport * 0.5 && markedTop < viewport * 0.5) {
        next = markedScene;
      }
      setScene(next);
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(evaluate);
    };
    evaluate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    engineRef.current?.setScene(scene);
  }, [scene, active]);

  // --- interaction cues ----------------------------------------------------
  useEffect(() => {
    if (!active) return undefined;

    const isControl = (target: EventTarget | null) =>
      (target as HTMLElement | null)?.closest?.(
        "button, a[href], [role='button'], summary, input[type='range']",
      ) ?? null;

    const onPress = (event: Event) => {
      if (isControl(event.target)) engineRef.current?.cue("press");
    };
    const onDiscovery = () => engineRef.current?.cue("discovery");

    document.addEventListener("pointerdown", onPress);
    window.addEventListener(DISCOVERY_EVENT, onDiscovery);
    return () => {
      document.removeEventListener("pointerdown", onPress);
      window.removeEventListener(DISCOVERY_EVENT, onDiscovery);
    };
  }, [active]);

  const toggle = useCallback(() => {
    setOn((was) => {
      const next = !was;
      window.localStorage.setItem(ON_KEY, next ? "on" : "off");
      if (next) discover("listen");
      else setOpen(false);
      return next;
    });
  }, []);

  return (
    <div className="fixed right-4 bottom-20 z-40 flex flex-col items-end gap-2 sm:right-6 sm:bottom-24">
      {active && open ? (
        <div
          className="w-44 rounded-2xl border-2 border-charcoal/70 bg-cream/95 p-3 text-charcoal shadow-lg backdrop-blur"
          role="group"
          aria-label="Soundscape controls"
        >
          <p className="flex items-center gap-1.5 font-display text-xs">
            <Music aria-hidden className="h-3.5 w-3.5" />
            {SCENE_LABEL[scene]}
          </p>
          <label className="mt-2 block text-[0.7rem] font-medium" htmlFor="ivy-volume">
            Volume
          </label>
          <input
            id="ivy-volume"
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={volume}
            onChange={(event) => {
              const next = Number(event.target.value);
              setVolume(next);
              window.localStorage.setItem(VOL_KEY, String(next));
            }}
            className="mt-1 w-full accent-frog"
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        {active ? (
          <button
            type="button"
            onClick={() => setOpen((was) => !was)}
            aria-expanded={open}
            className="pop inline-flex h-11 items-center rounded-full bg-cream/95 px-3 font-display text-xs text-charcoal"
          >
            {open ? "Hide mix" : "Mix"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={toggle}
          aria-pressed={active}
          disabled={onGame}
          title={
            onGame
              ? "Muted in the arcade — the game has its own soundtrack"
              : on
                ? "Mute Ivy's world"
                : "Play Ivy's world"
          }
          className="pop inline-flex h-12 w-12 items-center justify-center rounded-full bg-lavender text-charcoal disabled:opacity-60"
        >
          {active ? (
            <Volume2 aria-hidden className="h-5 w-5" />
          ) : (
            <VolumeX aria-hidden className="h-5 w-5" />
          )}
          <span className="sr-only">
            {onGame
              ? "Site music muted in the arcade"
              : on
                ? "Mute Ivy's world"
                : "Play Ivy's world"}
          </span>
        </button>
      </div>
    </div>
  );
}
