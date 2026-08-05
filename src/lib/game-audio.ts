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
let musicVolume = 0.62;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.2;
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

/** One-shot ocarina tone for interaction cues: scoops into pitch, then glides. */
function ocarinaCue(from: number, to: number, dur: number, gain: number) {
  const audio = ensure();
  if (!audio || !master) return;
  const t0 = audio.currentTime;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from * 0.94, t0);
  osc.frequency.exponentialRampToValueAtTime(from, t0 + 0.03);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.03);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.05);
  osc.connect(env).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.08);
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

import { BASS_ROOTS, COUNTER, HARP_SHAPE, MELODY, THEME_ROOT_HZ } from "@/lib/audio/theme";

const hz = (semi: number) => THEME_ROOT_HZ * Math.pow(2, semi / 12);

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

/** Soft ocarina doubling of the lead: sine core with a blooming vibrato. */
function ocarina(time: number, freq: number, dur: number, gain: number) {
  const audio = ctx;
  if (!audio || !musicGain) return;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  const vib = audio.createOscillator();
  const depth = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 0.96, time);
  osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05);
  vib.frequency.value = 5.2;
  depth.gain.setValueAtTime(0.0001, time);
  depth.gain.linearRampToValueAtTime(freq * 0.008, time + dur * 0.6);
  vib.connect(depth).connect(osc.frequency);
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(gain, time + 0.04);
  env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(env).connect(musicGain);
  osc.start(time);
  vib.start(time);
  osc.stop(time + dur + 0.02);
  vib.stop(time + dur + 0.02);
}

/** A frog on the bank, keeping the offbeat. */
function croak(time: number, gain: number) {
  const audio = ctx;
  if (!audio || !musicGain) return;
  for (let i = 0; i < 2; i += 1) {
    const t = time + i * 0.08;
    const osc = audio.createOscillator();
    const wob = audio.createOscillator();
    const depth = audio.createGain();
    const band = audio.createBiquadFilter();
    const env = audio.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(250 - i * 30, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.07);
    wob.frequency.value = 40;
    depth.gain.value = 42;
    wob.connect(depth).connect(osc.frequency);
    band.type = "bandpass";
    band.frequency.value = 470;
    band.Q.value = 5;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(band).connect(env).connect(musicGain);
    osc.start(t);
    wob.start(t);
    osc.stop(t + 0.12);
    wob.stop(t + 0.12);
  }
}

/** Ivy answering the melody with one warm woof. */
function woof(time: number, gain: number) {
  const audio = ctx;
  if (!audio || !musicGain) return;
  const osc = audio.createOscillator();
  const low = audio.createBiquadFilter();
  const env = audio.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(210, time);
  osc.frequency.exponentialRampToValueAtTime(88, time + 0.22);
  low.type = "lowpass";
  low.frequency.value = 820;
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(gain, time + 0.025);
  env.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
  osc.connect(low).connect(env).connect(musicGain);
  osc.start(time);
  osc.stop(time + 0.34);
}

function scheduleMusic() {
  const audio = ctx;
  if (!audio || !musicGain) return;
  // A buoyant walking pace that only tightens slightly as the pond speeds up.
  const bpm = 104 + intensity * 16;
  const spb = 60 / bpm / 4;

  while (nextNoteTime < audio.currentTime + 0.2) {
    const t = nextNoteTime;
    const i = step16 % 64;
    const bar = Math.floor(i / 16);

    const note = MELODY[i];
    if (note !== null) {
      // One clean ocarina lead keeps the tune memorable and unhurried.
      ocarina(t, hz(note), spb * 3.6, 0.052);
    }

    // bass: root on the beat, octave bounce on the offbeat
    if (i % 2 === 0) {
      const root = BASS_ROOTS[bar];
      const up = i % 4 === 2;
      voice(t, hz(root - 12 + (up ? 12 : 0)), spb * 1.7, "triangle", 0.06);
    }

    // harp: rolling chord tones between the melody notes, the overworld shimmer
    if (i % 4 === 1 || i % 4 === 3) {
      const root = BASS_ROOTS[bar] ?? 2;
      const shape = HARP_SHAPE[(i * 3) % HARP_SHAPE.length]!;
      voice(t, hz(root + shape + 12), spb * 1.4, "triangle", 0.018 + intensity * 0.006);
    }

    // percussion
    if (i % 8 === 0) voice(t, 78, 0.1, "sine", 0.07, 44);

    if (intensity > 0.45) {
      const high = COUNTER[i];
      if (high !== null && i % 8 === 0)
        voice(t, hz(high), spb * 2.6, "triangle", 0.018 * intensity);
    }

    // foley: frogs answer each phrase, and Ivy signs off every loop
    if (i === 15 || i === 47) croak(t, 0.035);
    if (i === 62) woof(t, 0.045);

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
  /**
   * Start (or resume) the Legend of Frog Queen Ivy theme.
   *
   * The site soundscape plays the very same score, just quieter and with
   * `force` set so it does not depend on the arcade's own sound preference.
   */
  startMusic(opts?: { volume?: number; force?: boolean }) {
    if (!enabled && !opts?.force) return;
    const audio = ensure();
    if (!audio) return;
    if (!musicGain) {
      musicGain = audio.createGain();
      musicGain.gain.value = 0;
      if (master) musicGain.connect(master);
    }
    musicVolume = opts?.volume ?? 0.62;
    musicGain.gain.cancelScheduledValues(audio.currentTime);
    musicGain.gain.setTargetAtTime(musicVolume, audio.currentTime, 0.8);
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
  /** Live level for the theme, used by the sitewide mixer's volume slider. */
  setMusicVolume(next: number) {
    musicVolume = Math.max(0, Math.min(1, next));
    if (musicGain && ctx) musicGain.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.3);
  },
  /** Fire a cue regardless of the arcade preference (used for sitewide taps). */
  playForce(cue: Cue, level = 1) {
    const was = enabled;
    enabled = true;
    this.play(cue, level);
    enabled = was;
  },
  /** 0 = opening march, 1 = full chase. Drives tempo and the counter-melody. */
  setIntensity(next: number) {
    intensity = Math.max(0, Math.min(1, next));
  },
  play(cue: Cue, level = 1) {
    if (!enabled) return;
    switch (cue) {
      case "jump":
        // A soft, low ocarina lift — gentle enough to hop hundreds of times.
        ocarinaCue(392, 466.16, 0.11, 0.03);
        tone({ freq: 200, to: 160, dur: 0.05, type: "triangle", gain: 0.014 });
        break;
      case "double":
        // The same motif a step higher, still whisper-quiet.
        ocarinaCue(523.25, 622.25, 0.12, 0.026);
        break;

      case "coin":
        // Rupee-style two-tone chime, rising with the combo.
        tone({ freq: 987.77 + Math.min(level, 5) * 70, dur: 0.07, type: "triangle", gain: 0.18 });
        tone({
          freq: 1479.98 + Math.min(level, 5) * 100,
          dur: 0.16,
          type: "triangle",
          gain: 0.14,
          delay: 0.055,
        });
        break;
      case "combo":
        // Harp run up the mode: the reward for chaining.
        arp([0, 4, 7, 11, 12], 587.33, 0.09, 0.05, "triangle", 0.16);
        break;
      case "near":
        // Close call: a low frog gulp rather than a buzz.
        tone({ freq: 300, to: 220, dur: 0.1, type: "triangle", gain: 0.08 });
        break;
      case "milestone":
        // Secret-found fanfare, ending on the octave, with Ivy's woof under it.
        [0, 4, 7, 12].forEach((semi, i) =>
          tone({
            freq: 587.33 * Math.pow(2, semi / 12),
            dur: 0.2,
            type: "triangle",
            gain: 0.2,
            delay: i * 0.1,
          }),
        );
        tone({ freq: 200, to: 90, dur: 0.28, type: "triangle", gain: 0.14, delay: 0.42 });
        break;
      case "death":
        // The gentle "quest paused" fall: descending ocarina, soft splash, woof.
        noise(0.3, 0.14, 420);
        [12, 10, 7, 3].forEach((semi, i) =>
          tone({
            freq: 587.33 * Math.pow(2, semi / 12),
            dur: 0.22,
            type: "sine",
            gain: 0.16,
            delay: i * 0.12,
          }),
        );
        tone({ freq: 190, to: 80, dur: 0.34, type: "triangle", gain: 0.14, delay: 0.56 });
        break;
      case "ui":
        // Wooden menu tick on the tonic.
        tone({ freq: 587.33, dur: 0.05, type: "triangle", gain: 0.13 });
        tone({ freq: 880, dur: 0.07, type: "sine", gain: 0.06, delay: 0.02 });
        break;
    }
  },
};
