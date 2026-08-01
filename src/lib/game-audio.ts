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


/** Ascending sparkle used by the hop cues — semitone offsets over a root. */
function arp(
  steps: number[],
  root: number,
  dur: number,
  gap: number,
  type: OscillatorType,
  gain: number,
) {
  steps.forEach((semi, i) => {
    tone({
      freq: root * Math.pow(2, semi / 12),
      dur,
      type,
      gain: gain * (1 - i * 0.08),
      delay: i * gap,
    });
  });
}

/* ------------------------------------------------------------------------- *
 * "The Legend of Frog Queen Ivy" — the game's own adventure theme.
 *
 * A four-bar heroic loop in D dorian: a Zelda-flavoured overworld melody in
 * fourths and fifths, a bouncy platformer bass underneath, soft hand hats, and
 * frog/dog foley closing each phrase. Everything is synthesised on the fly and
 * scheduled a beat ahead, so it stays in time without any audio files.
 * ------------------------------------------------------------------------- */

const ROOT = 146.83; // D3
const hz = (semi: number) => ROOT * Math.pow(2, semi / 12);
const R = null;

/** 64 sixteenth-notes: the heroic call, then its answer. */
const MELODY: (number | null)[] = [
  // bar 1 — the call
  19, R, R, 14, R, 12, R, 14, 19, R, R, R, 21, R, 19, R,
  // bar 2 — lift
  17, R, R, 12, R, 10, R, 12, 17, R, R, R, 19, R, 17, R,
  // bar 3 — the answer
  22, R, 21, R, 19, R, 17, R, 19, R, R, 14, R, R, 12, R,
  // bar 4 — resolve home
  10, R, 12, R, 14, R, 17, R, 19, R, R, R, R, R, R, R,
];

/** High counter-melody that only appears once the run gets fast. */
const COUNTER: (number | null)[] = [
  31, R, R, R, 26, R, R, R, 31, R, R, R, 33, R, R, R,
  29, R, R, R, 24, R, R, R, 29, R, R, R, 31, R, R, R,
  34, R, R, R, 31, R, R, R, 29, R, R, R, 26, R, R, R,
  22, R, 24, R, 26, R, 29, R, 31, R, R, R, R, R, R, R,
];

/** Root of the bar, walked in bouncy octaves by the bass. */
const BASS_ROOTS = [2, -2, 5, 0];

let musicTimer: number | null = null;
let musicGain: GainNode | null = null;
let step16 = 0;
let nextNoteTime = 0;
let intensity = 0;

function voice(
  time: number,
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  glide?: number,
) {
  const audio = ctx;
  if (!audio || !musicGain) return;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, time + dur);
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(gain, time + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(env).connect(musicGain);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function hat(time: number, gain: number) {
  const audio = ctx;
  if (!audio || !musicGain) return;
  const frames = Math.floor(audio.sampleRate * 0.05);
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 5200;
  const env = audio.createGain();
  env.gain.value = gain;
  src.connect(filter).connect(env).connect(musicGain);
  src.start(time);
}

function scheduleMusic() {
  const audio = ctx;
  if (!audio || !musicGain) return;
  // Tempo rides the run: a calm march at the start, a chase at full speed.
  const bpm = 128 + intensity * 34;
  const spb = 60 / bpm / 4;

  while (nextNoteTime < audio.currentTime + 0.2) {
    const t = nextNoteTime;
    const i = step16 % 64;
    const bar = Math.floor(i / 16);
    const beat = i % 4;

    const note = MELODY[i];
    if (note !== null) voice(t, hz(note), spb * 3.4, "square", 0.085);

    // bass: root on the beat, octave bounce on the offbeat
    if (i % 2 === 0) {
      const root = BASS_ROOTS[bar];
      const up = i % 4 === 2;
      voice(t, hz(root - 12 + (up ? 12 : 0)), spb * 1.7, "triangle", 0.115);
    }

    // percussion
    if (i % 4 === 0) voice(t, 78, 0.1, "sine", 0.16, 44);
    if (i % 4 === 2) hat(t, 0.045 + intensity * 0.03);

    if (intensity > 0.45) {
      const high = COUNTER[i];
      if (high !== null) voice(t, hz(high), spb * 2.6, "triangle", 0.045 * intensity);
    }

    // foley: a ribbit answers each phrase, and Ivy signs off every loop
    if (i === 15 || i === 47) voice(t, 190, 0.09, "sawtooth", 0.05, 120);
    if (i === 62) voice(t, 165, 0.22, "triangle", 0.06, 96);

    void beat;
    nextNoteTime += spb;
    step16 += 1;
  }
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
  /** Start (or resume) the Legend of Frog Queen Ivy theme for a run. */
  startMusic() {
    if (!enabled) return;
    const audio = ensure();
    if (!audio) return;
    if (!musicGain) {
      musicGain = audio.createGain();
      musicGain.gain.value = 0;
      if (master) musicGain.connect(master);
    }
    musicGain.gain.cancelScheduledValues(audio.currentTime);
    musicGain.gain.setTargetAtTime(0.85, audio.currentTime, 0.5);
    intensity = 0;
    if (musicTimer === null) {
      step16 = 0;
      nextNoteTime = audio.currentTime + 0.1;
      musicTimer = window.setInterval(scheduleMusic, 60);
      scheduleMusic();
    }
  },
  /** Fade the theme out (run over, tab hidden, or sound switched off). */
  stopMusic() {
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
    if (musicGain && ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
  },
  /** 0 = opening march, 1 = full chase. Drives tempo and the counter-melody. */
  setIntensity(next: number) {
    intensity = Math.max(0, Math.min(1, next));
  },
  play(cue: Cue, level = 1) {
    if (!enabled) return;
    switch (cue) {
      case "jump":
        // Zelda-ish "hup": a little airy body under a rising perfect-fourth
        // sparkle, so the hop reads as heroic rather than as a beep.
        tone({ freq: 240, to: 460, dur: 0.1, type: "triangle", gain: 0.26 });
        arp([0, 5, 12], 587.33, 0.05, 0.075, "triangle", 0.2);
        tone({ freq: 2350, dur: 0.05, type: "sine", gain: 0.07, delay: 0.1 });
        break;
      case "double":
        // Second hop answers the first an octave up — the classic secret chime.
        tone({ freq: 420, to: 900, dur: 0.1, type: "triangle", gain: 0.16 });
        arp([12, 17, 19, 24], 587.33, 0.045, 0.06, "square", 0.12);
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
