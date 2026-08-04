import { useCallback, useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { discover, DISCOVERY_EVENT } from "@/lib/discoveries";
import { registerAudioEngine } from "@/lib/audio/cue";
import type { AudioCue } from "@/lib/audio/engine";

/**
 * IvySoundscape — one button, one soundtrack.
 *
 * The whole site plays the arcade's score: "The Legend of Frog Queen Ivy" from
 * `@/lib/game-audio`, at one steady calm level, so the homepage and the minigame
 * are the same world. There is no mixer, because there is nothing to mix.
 *
 * Still true: silent until the visitor opts in, the choice is remembered, audio
 * stops with the tab, taps answer with the wooden menu tick, and the player
 * stands down on `/game` where the game drives the same theme itself.
 */

// Versioned so the previous, busier soundtrack never resumes automatically.
const ON_KEY = "ivy-sound-calm-v2";

/** Fixed background level: present, never in the way. */
const SITE_VOLUME = 0.2;

/** Fixed arrangement: sparse and calm, well below the arcade's chase mix. */
const SITE_INTENSITY = 0.22;

/** Interaction cues, mapped onto the game's own Zelda-ish palette. */
const CUE_MAP: Record<AudioCue, "ui" | "coin" | "combo" | "jump" | "double" | "near"> = {
  press: "ui",
  hover: "ui",
  open: "ui",
  reward: "coin",
  discovery: "combo",
  jump: "jump",
  land: "double",
  fail: "near",
};

export function IvySoundscape() {
  const [on, setOn] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // The arcade drives the same theme itself — the site player stands down there.
  const onGame = pathname.startsWith("/game");
  const active = on && !onGame;

  useEffect(() => {
    setOn(window.localStorage.getItem(ON_KEY) === "on");
  }, []);

  // --- soundtrack lifecycle ------------------------------------------------
  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let audio: typeof import("@/lib/game-audio").gameAudio | null = null;

    void import("@/lib/game-audio").then(({ gameAudio }) => {
      if (cancelled) return;
      audio = gameAudio;
      gameAudio.setIntensity(SITE_INTENSITY);
      gameAudio.startMusic({ volume: SITE_VOLUME, force: true });
      registerAudioEngine({
        cue: (name) => gameAudio.playForce(CUE_MAP[name]),
        setScene: () => {},
      });
    });

    const onVisibility = () => {
      if (!audio) return;
      if (document.hidden) audio.stopMusic();
      else audio.startMusic({ volume: SITE_VOLUME, force: true });
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      registerAudioEngine(null);
      audio?.stopMusic();
    };
  }, [active]);

  // --- interaction cues ----------------------------------------------------
  // Sound is reserved for real, working controls: an enabled button or a link
  // that actually navigates. Taps on decorative art, cards, canvases, text or
  // disabled controls stay silent.
  useEffect(() => {
    if (!active) return undefined;

    const cue = (name: "ui" | "combo") => {
      void import("@/lib/game-audio").then(({ gameAudio }) => gameAudio.playForce(name));
    };

    const onClick = (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest?.(
        "button, a[href], [role='button']",
      ) as HTMLElement | null;
      if (!el) return;
      if (el.hasAttribute("data-silent")) return;
      if (el.getAttribute("aria-disabled") === "true") return;
      if ((el as HTMLButtonElement).disabled) return;
      if (el instanceof HTMLAnchorElement && !el.getAttribute("href")) return;
      cue("ui");
    };
    const onDiscovery = () => cue("combo");

    document.addEventListener("click", onClick);
    window.addEventListener(DISCOVERY_EVENT, onDiscovery);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener(DISCOVERY_EVENT, onDiscovery);
    };
  }, [active]);


  const toggle = useCallback(() => {
    setOn((was) => {
      const next = !was;
      window.localStorage.setItem(ON_KEY, next ? "on" : "off");
      if (next) discover("listen");
      return next;
    });
  }, []);

  const label = onGame
    ? "Site music muted in the arcade"
    : on
      ? "Mute Ivy's world"
      : "Play Ivy's world";

  return (
    <div className="fixed right-9 bottom-20 z-40 sm:right-16 sm:bottom-24">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        aria-label={label}
        disabled={onGame}
        title={onGame ? "Muted in the arcade — the game plays the same theme" : label}
        className="pop inline-flex h-12 w-12 items-center justify-center rounded-full bg-lavender text-charcoal disabled:opacity-60"
      >
        {active ? (
          <Volume2 aria-hidden className="h-5 w-5" />
        ) : (
          <VolumeX aria-hidden className="h-5 w-5" />
        )}
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}
