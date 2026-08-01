/**
 * Tiny WebAudio synth for Lily Pad Leap.
 *
 * No audio files: every cue is generated, so it adds zero bytes to the bundle
 * and never blocks the first paint. The context is only created after a real
 * user gesture (starting a run), which keeps browsers happy and means a visitor
 * who never plays never hears anything.
 */

type Cue = "jump" | "double" | "coin" | "combo" | "near" | "milestone" | "death" | "ui";

const STORAGE_KEY = "ivy-leap-sound";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(opts: {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}) {
  const audio = ensure();
  if (!audio || !master) return;
  const t0 = audio.currentTime + (opts.delay ?? 0);
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = opts.type ?? "triangle";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t0 + opts.dur);
  const peak = opts.gain ?? 0.5;
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(env).connect(master);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.02);
}

function noise(dur: number, gain = 0.35, sweepTo = 400) {
  const audio = ensure();
  if (!audio || !master) return;
  const frames = Math.floor(audio.sampleRate * dur);
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, audio.currentTime);
  filter.frequency.exponentialRampToValueAtTime(sweepTo, audio.currentTime + dur);
  const env = audio.createGain();
  env.gain.value = gain;
  src.connect(filter).connect(env).connect(master);
  src.start();
}

export const gameAudio = {
  /** Restore the stored preference. Safe to call during hydration effects. */
  init() {
    if (typeof window === "undefined") return;
    enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
  },
  get enabled() {
    return enabled;
  },
  setEnabled(next: boolean) {
    enabled = next;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    }
    if (next) ensure();
  },
  /** Called from the click that starts a run, so the context unlocks legally. */
  unlock() {
    if (enabled) ensure();
  },
  play(cue: Cue, level = 1) {
    if (!enabled) return;
    switch (cue) {
      case "jump":
        tone({ freq: 300, to: 720, dur: 0.14, type: "triangle", gain: 0.4 });
        break;
      case "double":
        tone({ freq: 480, to: 980, dur: 0.16, type: "square", gain: 0.22 });
        break;
      case "coin":
        tone({ freq: 880 + Math.min(level, 5) * 90, dur: 0.08, type: "square", gain: 0.2 });
        tone({
          freq: 1320 + Math.min(level, 5) * 120,
          dur: 0.12,
          type: "square",
          gain: 0.16,
          delay: 0.06,
        });
        break;
      case "combo":
        tone({ freq: 1200, to: 1900, dur: 0.18, type: "triangle", gain: 0.22 });
        break;
      case "near":
        tone({ freq: 220, to: 140, dur: 0.12, type: "sine", gain: 0.18 });
        break;
      case "milestone":
        [0, 0.09, 0.18].forEach((delay, i) =>
          tone({ freq: 660 + i * 220, dur: 0.16, type: "triangle", gain: 0.22, delay }),
        );
        break;
      case "death":
        noise(0.4, 0.3, 200);
        tone({ freq: 320, to: 70, dur: 0.5, type: "sawtooth", gain: 0.22 });
        break;
      case "ui":
        tone({ freq: 620, dur: 0.06, type: "triangle", gain: 0.16 });
        break;
    }
  },
};
