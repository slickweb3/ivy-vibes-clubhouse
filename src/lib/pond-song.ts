/**
 * The pond's song — a tiny WebAudio player that turns lily pads into music.
 *
 * Same key and voices as "The Legend of Frog Queen Ivy" (D-Dorian, ocarina +
 * harp), just performed by whoever planted a pad today. Deliberately small and
 * self-contained: it only ever runs after a click, and it disposes itself.
 */
import { THEME_ROOT_HZ } from "@/lib/audio/theme";

const hz = (semitones: number) => THEME_ROOT_HZ * Math.pow(2, semitones / 12);

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    bus = ctx.createGain();
    bus.gain.value = 0.5;
    const warm = ctx.createBiquadFilter();
    warm.type = "lowpass";
    warm.frequency.value = 5200;
    bus.connect(warm).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function pluck(at: number, freq: number, gain: number, type: OscillatorType = "triangle") {
  const audio = ctx;
  if (!audio || !bus) return;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.014);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.85);
  osc.connect(env).connect(bus);
  osc.start(at);
  osc.stop(at + 0.9);
}

/** Soft bloop that plays the instant a pad lands. */
export function playPadNote(note: number) {
  const audio = ensure();
  if (!audio) return;
  const t = audio.currentTime + 0.01;
  pluck(t, hz(note), 0.13, "sine");
  pluck(t + 0.045, hz(note + 7), 0.05);
}

export interface SongHandle {
  stop(): void;
}

/**
 * Plays the whole pond in planting order.
 *
 * `onStep` lights the matching pad up in the UI; the returned handle stops
 * everything if the visitor leaves or presses stop.
 */
export function playPondSong(
  notes: number[],
  onStep: (index: number) => void,
  onEnd: () => void,
): SongHandle {
  const audio = ensure();
  if (!audio || notes.length === 0) {
    onEnd();
    return { stop: () => {} };
  }

  // Fast ponds still read as music: shorten the step as the crowd grows.
  const step = notes.length > 48 ? 0.14 : notes.length > 20 ? 0.19 : 0.26;
  const start = audio.currentTime + 0.12;
  const timers: number[] = [];
  let stopped = false;

  notes.forEach((note, index) => {
    const at = start + index * step;
    pluck(at, hz(note), 0.11, "triangle");
    if (index % 4 === 0) pluck(at, hz(note - 12), 0.06, "sine");
    timers.push(
      window.setTimeout(
        () => {
          if (!stopped) onStep(index);
        },
        Math.max(0, (at - audio.currentTime) * 1000),
      ),
    );
  });

  // A gentle harp resolve to say "that was the song".
  const tail = start + notes.length * step;
  [0, 7, 12, 19].forEach((offset, i) => pluck(tail + i * 0.08, hz(10 + offset), 0.07));
  timers.push(
    window.setTimeout(
      () => {
        if (stopped) return;
        onStep(-1);
        onEnd();
      },
      Math.max(0, (tail + 0.6 - audio.currentTime) * 1000),
    ),
  );

  return {
    stop() {
      stopped = true;
      timers.forEach((id) => window.clearTimeout(id));
      if (bus && ctx) {
        bus.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        window.setTimeout(() => {
          if (bus && ctx) bus.gain.setTargetAtTime(0.5, ctx.currentTime, 0.05);
        }, 260);
      }
      onStep(-1);
      onEnd();
    },
  };
}
