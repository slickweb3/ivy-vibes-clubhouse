/**
 * Ivy's living audio universe — a fully synthesised, asset-free soundscape.
 *
 * Design rules:
 *  - Nothing here is imported until the visitor opts in (see cue.ts + the
 *    dynamic import in soundscape.tsx), so the first paint pays nothing.
 *  - Everything is generated with WebAudio: no downloads, no streaming, no
 *    decode cost, and infinite non-repeating variation.
 *  - Organic core (wooden flute, kalimba pluck, hand drum, bowed pad, bells)
 *    blended with a crystalline "advanced machine" layer.
 *  - Adaptive scenes: the landing doorway, open exploration, the arcade, and a
 *    hushed reflective mode. Layers fade between them; nothing hard-cuts.
 *  - Frog and dog motifs give the world its inhabitants without mascot spam.
 */

export type AudioScene = "landing" | "explore" | "game" | "hush";

export type AudioCue =
  | "press"
  | "hover"
  | "open"
  | "reward"
  | "discovery"
  | "jump"
  | "land"
  | "fail";

type Voice = "flute" | "pluck" | "bell" | "crystal";

const midi = (note: number) => 440 * Math.pow(2, (note - 69) / 12);

/** A-minor pentatonic + a Dorian colour tone: warm, folkloric, never sour. */
const SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];

/** Ivy's theme — the four-note signature the whole world is built from. */
const MOTIF = [0, 2, 4, 3];

interface SceneConfig {
  bpm: number;
  /** Chord roots (MIDI) cycled one per bar. */
  chords: number[];
  pad: number;
  melody: number;
  pluck: number;
  perc: number;
  bell: number;
  crystal: number;
  register: number;
  /** Chance per bar of a creature answering the melody. */
  creature: number;
}

const SCENES: Record<AudioScene, SceneConfig> = {
  landing: {
    bpm: 74,
    chords: [45, 45, 41, 43],
    pad: 0.5,
    melody: 0.3,
    pluck: 0.32,
    perc: 0.06,
    bell: 0.18,
    crystal: 0.3,
    register: 0,
    creature: 0.25,
  },
  explore: {
    bpm: 88,
    chords: [45, 50, 43, 48],
    pad: 0.34,
    melody: 0.5,
    pluck: 0.55,
    perc: 0.3,
    bell: 0.14,
    crystal: 0.18,
    register: 0,
    creature: 0.4,
  },
  game: {
    bpm: 116,
    chords: [45, 43, 50, 48],
    pad: 0.22,
    melody: 0.62,
    pluck: 0.7,
    perc: 0.62,
    bell: 0.1,
    crystal: 0.12,
    register: 12,
    creature: 0.3,
  },
  hush: {
    bpm: 66,
    chords: [41, 45, 43, 45],
    pad: 0.55,
    melody: 0.2,
    pluck: 0.2,
    perc: 0,
    bell: 0.2,
    crystal: 0.34,
    register: -12,
    creature: 0.18,
  },
};

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;

export class IvyAudio {
  private ctx: AudioContext;
  private master: GainNode;
  private duck: GainNode;
  private music: GainNode;
  private fx: GainNode;
  private air: BiquadFilterNode;
  private verb: ConvolverNode;
  private verbSend: GainNode;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private scene: AudioScene = "landing";
  private levels: SceneConfig;
  private bpm: number;
  private lean: boolean;
  private lastHover = 0;
  private disposed = false;

  constructor(lean: boolean) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.lean = lean;
    this.levels = { ...SCENES.landing };
    this.bpm = SCENES.landing.bpm;

    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // Everything musical passes through a duck stage so an interaction cue can
    // step forward for a moment without the visitor reaching for the volume.
    this.duck = ctx.createGain();
    this.duck.connect(this.master);

    // Day / night variation: after dusk the pond gets darker and dreamier.
    const hour = new Date().getHours();
    const night = hour < 6 || hour >= 21;
    this.air = ctx.createBiquadFilter();
    this.air.type = "lowpass";
    this.air.frequency.value = night ? 3400 : 5200;
    if (night) {
      for (const scene of Object.values(SCENES)) {
        scene.register -= 12;
        scene.pad = Math.min(1, scene.pad * 1.25);
        scene.crystal = Math.min(1, scene.crystal * 1.3);
        scene.perc *= 0.6;
      }
      this.levels = { ...SCENES.landing };
    }
    this.air.Q.value = 0.4;
    this.air.connect(this.duck);

    this.music = ctx.createGain();
    this.music.gain.value = 1;
    this.music.connect(this.air);

    this.fx = ctx.createGain();
    this.fx.gain.value = 1;
    this.fx.connect(this.master);

    // A short generated hall: the "ancient world inside a machine" glue.
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(lean ? 1.4 : 2.6);
    this.verbSend = ctx.createGain();
    this.verbSend.gain.value = 0.5;
    this.verbSend.connect(this.verb).connect(this.duck);
  }

  /** Noise-decay impulse response — cheap, warm, and no asset to download. */
  private impulse(seconds: number) {
    const { ctx } = this;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const decay = Math.pow(1 - i / length, 2.6);
        data[i] = (Math.random() * 2 - 1) * decay * 0.6;
      }
    }
    return buffer;
  }

  async start(volume: number) {
    await this.ctx.resume().catch(() => undefined);
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, 1.6);
    this.nextTime = this.ctx.currentTime + 0.15;
    this.cue("open");
    if (this.timer === null) {
      this.timer = window.setInterval(() => this.schedule(), 90);
      this.schedule();
    }
  }

  setVolume(volume: number) {
    this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.25);
  }

  setScene(scene: AudioScene) {
    if (scene === this.scene) return;
    this.scene = scene;
    const target = SCENES[scene];
    // Crossfade the mix rather than swapping it: the world shifts, it never cuts.
    const keys = ["pad", "melody", "pluck", "perc", "bell", "crystal", "creature"] as const;
    const from = { ...this.levels };
    const started = performance.now();
    const glide = (now: number) => {
      if (this.disposed) return;
      const t = Math.min(1, (now - started) / 2600);
      const ease = t * t * (3 - 2 * t);
      for (const key of keys) this.levels[key] = from[key] + (target[key] - from[key]) * ease;
      this.levels.register = target.register;
      this.levels.chords = target.chords;
      this.bpm = this.bpm + (target.bpm - this.bpm) * 0.06;
      this.air.frequency.setTargetAtTime(scene === "hush" ? 3200 : 5600, this.ctx.currentTime, 1.2);
      if (t < 1) requestAnimationFrame(glide);
      else this.bpm = target.bpm;
    };
    requestAnimationFrame(glide);
  }

  suspend() {
    void this.ctx.suspend().catch(() => undefined);
  }

  resume() {
    void this.ctx.resume().catch(() => undefined);
  }

  dispose() {
    this.disposed = true;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    window.setTimeout(() => void this.ctx.close().catch(() => undefined), 700);
  }

  // ---------------------------------------------------------------- voices --

  private env(at: number, attack: number, hold: number, release: number, peak: number) {
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + attack);
    gain.gain.setTargetAtTime(Math.max(peak * 0.6, 0.0002), at + attack, hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
    return gain;
  }

  private send(node: AudioNode, wet: number, bus: GainNode) {
    node.connect(bus);
    if (this.lean && wet < 0.35) return;
    const tap = this.ctx.createGain();
    tap.gain.value = wet;
    node.connect(tap).connect(this.verbSend);
  }

  /** Warm wooden flute: breathy sine core, gentle vibrato, soft tonguing. */
  private flute(hz: number, at: number, dur: number, level: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hz * 0.985, at);
    osc.frequency.exponentialRampToValueAtTime(hz, at + 0.09);
    const body = ctx.createOscillator();
    body.type = "triangle";
    body.frequency.value = hz * 2.002;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.12;

    const vib = ctx.createOscillator();
    vib.frequency.value = 4.6 + Math.random() * 1.2;
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = hz * 0.006;
    vib.connect(vibDepth).connect(osc.frequency);

    const gain = this.env(at, 0.12, dur * 0.6, dur * 0.5, level);
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = Math.min(hz * 6, 6500);

    osc.connect(tone);
    body.connect(bodyGain).connect(tone);
    tone.connect(gain);
    this.send(gain, 0.5, this.music);

    // A whisper of breath at the attack keeps it human.
    if (!this.lean) {
      const noise = this.noise(at, 0.1, level * 0.16, 1800, 5);
      this.send(noise, 0.3, this.music);
    }

    osc.start(at);
    body.start(at);
    vib.start(at);
    const end = at + dur + 0.6;
    osc.stop(end);
    body.stop(end);
    vib.stop(end);
  }

  /** Kalimba / plucked string: bright transient, woody decay. */
  private pluck(hz: number, at: number, level: number, bus: GainNode = this.music) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(hz, at);
    const partial = ctx.createOscillator();
    partial.type = "sine";
    partial.frequency.value = hz * 3.01;
    const partialGain = ctx.createGain();
    partialGain.gain.value = 0.18;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
    const wood = ctx.createBiquadFilter();
    wood.type = "lowpass";
    wood.frequency.setValueAtTime(Math.min(hz * 9, 9000), at);
    wood.frequency.exponentialRampToValueAtTime(Math.max(hz * 2, 300), at + 0.5);
    osc.connect(wood);
    partial.connect(partialGain).connect(wood);
    wood.connect(gain);
    this.send(gain, 0.45, bus);
    osc.start(at);
    partial.start(at);
    osc.stop(at + 1);
    partial.stop(at + 1);
  }

  /** Bowed string / choir pad: two detuned saws under a slow filter sweep. */
  private pad(hz: number, at: number, dur: number, level: number) {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, at);
    filter.frequency.linearRampToValueAtTime(1500, at + dur * 0.5);
    filter.frequency.linearRampToValueAtTime(600, at + dur);
    filter.Q.value = 1.2;
    const voices = this.lean ? 2 : 3;
    for (let i = 0; i < voices; i += 1) {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? "triangle" : "sawtooth";
      osc.frequency.value = hz * (1 + (i - 1) * 0.004) * (i === 2 ? 2 : 1);
      osc.connect(filter);
      osc.start(at);
      osc.stop(at + dur + 0.2);
    }
    filter.connect(gain);
    this.send(gain, 0.7, this.music);
  }

  /** Crystalline machine tone: FM bell with a long shimmering tail. */
  private bell(hz: number, at: number, level: number, ratio = 2.01, bus: GainNode = this.music) {
    const ctx = this.ctx;
    const carrier = ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.value = hz;
    const mod = ctx.createOscillator();
    mod.type = "sine";
    mod.frequency.value = hz * ratio;
    const modDepth = ctx.createGain();
    modDepth.gain.setValueAtTime(hz * 1.4, at);
    modDepth.gain.exponentialRampToValueAtTime(1, at + 0.5);
    mod.connect(modDepth).connect(carrier.frequency);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.4);
    carrier.connect(gain);
    this.send(gain, 0.8, bus);
    carrier.start(at);
    mod.start(at);
    carrier.stop(at + 2.6);
    mod.stop(at + 2.6);
  }

  private noise(at: number, dur: number, level: number, hz: number, q: number) {
    const ctx = this.ctx;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = hz;
    band.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(band).connect(gain);
    src.start(at);
    return gain;
  }

  /** Hand percussion: palm thump plus a skin transient. */
  private hand(at: number, level: number, low: boolean) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(low ? 130 : 210, at);
    osc.frequency.exponentialRampToValueAtTime(low ? 62 : 120, at + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    osc.connect(gain);
    this.send(gain, 0.18, this.music);
    osc.start(at);
    osc.stop(at + 0.2);
    const skin = this.noise(at, 0.06, level * 0.5, low ? 900 : 2100, 1.6);
    this.send(skin, 0.2, this.music);
  }

  /** A curious frog answering from somewhere off-screen. */
  private ribbit(at: number, level: number) {
    const ctx = this.ctx;
    for (let i = 0; i < 2; i += 1) {
      const t = at + i * 0.11;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280 - i * 34, t);
      osc.frequency.exponentialRampToValueAtTime(132 - i * 16, t + 0.09);
      const wob = ctx.createOscillator();
      wob.frequency.value = 38;
      const wobDepth = ctx.createGain();
      wobDepth.gain.value = 44;
      wob.connect(wobDepth).connect(osc.frequency);
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 480;
      band.Q.value = 5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(level, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      osc.connect(band).connect(gain);
      this.send(gain, 0.6, this.music);
      osc.start(t);
      wob.start(t);
      osc.stop(t + 0.14);
      wob.stop(t + 0.14);
    }
  }

  /** Ivy herself: one soft, low, contented woof. */
  private woof(at: number, level: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(196, at);
    osc.frequency.exponentialRampToValueAtTime(84, at + 0.24);
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 780;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.34);
    osc.connect(low).connect(gain);
    this.send(gain, 0.5, this.music);
    osc.start(at);
    osc.stop(at + 0.4);
  }

  private note(voice: Voice, degree: number, octave: number, at: number, dur: number, lvl: number) {
    const root = 57 + this.levels.register; // A3 reference
    const index = ((degree % SCALE.length) + SCALE.length) % SCALE.length;
    const hz = midi(root + SCALE[index]! + octave * 12);
    if (voice === "flute") this.flute(hz, at, dur, lvl);
    else if (voice === "pluck") this.pluck(hz, at, lvl);
    else this.bell(hz, at, lvl);
  }

  // ------------------------------------------------------------- sequencer --

  private schedule() {
    const ctx = this.ctx;
    if (ctx.state === "suspended") return;
    const stepDur = () => 60 / this.bpm / 4; // sixteenth
    while (this.nextTime < ctx.currentTime + 0.5) {
      const dur = stepDur();
      const at = this.nextTime;
      const s = this.step;
      const bar = Math.floor(s / 16) % 4;
      const beat = s % 16;
      const L = this.levels;
      const chordRoot = L.chords[bar] ?? 45;
      const chordDegree = SCALE.findIndex((v) => (chordRoot - 45 + 12) % 12 === (v + 12) % 12);
      const base = chordDegree < 0 ? 0 : chordDegree;

      // Pad: one slow swell per bar.
      if (beat === 0 && L.pad > 0.02) {
        const hz = midi(chordRoot - 12);
        this.pad(hz, at, dur * 16 * 1.05, 0.05 * L.pad);
        if (!this.lean) this.pad(hz * 1.5, at + dur * 2, dur * 12, 0.03 * L.pad);
      }

      // Hand percussion: gentle heartbeat, with a shifting off-beat.
      if (L.perc > 0.05) {
        if (beat === 0 || beat === 8) this.hand(at, 0.16 * L.perc, true);
        if (beat === 6 || beat === 14) this.hand(at, 0.09 * L.perc, false);
        if (beat === 11 && Math.random() < L.perc * 0.6) this.hand(at, 0.06 * L.perc, false);
      }

      // Kalimba figure: arpeggiated, never twice the same.
      if (L.pluck > 0.05 && beat % 2 === 0 && Math.random() < L.pluck) {
        const shape = pick([0, 2, 4, 5, 7]);
        this.pluck(
          midi(57 + this.levels.register + (SCALE[(base + shape) % SCALE.length] ?? 0)),
          at,
          0.05 + 0.05 * L.pluck,
        );
      }

      // Melody: Ivy's motif at the top of each phrase, improvised in between.
      if (L.melody > 0.05) {
        if (bar === 0 && beat % 4 === 0) {
          const degree = base + (MOTIF[beat / 4] ?? 0);
          this.note("flute", degree, 1, at, dur * 3.4, 0.07 * L.melody);
        } else if (beat % 2 === 0 && Math.random() < L.melody * 0.42) {
          const degree = base + pick([0, 1, 2, 3, 4, 5, 6]);
          const long = Math.random() < 0.3;
          this.note("flute", degree, 1, at, dur * (long ? 4 : 2), 0.055 * L.melody);
        }
      }

      // Bells and crystals: the machine breathing under the forest.
      if (L.bell > 0.03 && beat === 12 && Math.random() < L.bell * 2) {
        this.note("bell", base + pick([4, 5, 7]), 2, at, 0, 0.05 * L.bell);
      }
      if (!this.lean && L.crystal > 0.03 && Math.random() < L.crystal * 0.05) {
        this.bell(midi(81 + pick([0, 3, 7, 10, 12])), at, 0.02 * L.crystal, 3.51);
      }

      // Inhabitants.
      if (beat === 15 && Math.random() < L.creature * 0.5) this.ribbit(at + dur * 0.5, 0.05);
      if (bar === 3 && beat === 14 && Math.random() < L.creature * 0.6) this.woof(at, 0.07);

      this.nextTime += dur;
      this.step += 1;
    }
  }

  // ------------------------------------------------------------------ cues --

  private duckFor(amount: number, seconds: number) {
    const now = this.ctx.currentTime;
    this.duck.gain.cancelScheduledValues(now);
    this.duck.gain.setTargetAtTime(1 - amount, now, 0.03);
    this.duck.gain.setTargetAtTime(1, now + seconds, 0.25);
  }

  cue(name: AudioCue) {
    const ctx = this.ctx;
    if (ctx.state === "suspended") return;
    const now = ctx.currentTime + 0.005;
    switch (name) {
      case "hover": {
        // Throttled so a sweep across a grid stays musical, not chattery.
        const stamp = performance.now();
        if (stamp - this.lastHover < 110) return;
        this.lastHover = stamp;
        this.bell(midi(88 + pick([0, 3, 7])), now, 0.012, 2.01, this.fx);
        return;
      }
      case "press": {
        this.duckFor(0.18, 0.1);
        this.pluck(midi(69), now, 0.075, this.fx);
        this.bell(midi(81), now + 0.02, 0.035, 2.01, this.fx);
        const tap = this.noise(now, 0.05, 0.05, 2600, 2);
        tap.connect(this.fx);
        return;
      }
      case "open": {
        this.duckFor(0.25, 1.2);
        this.pad(midi(33), now, 3.4, 0.06);
        [69, 76, 81].forEach((n, i) => this.bell(midi(n), now + i * 0.16, 0.05, 2.01, this.fx));
        this.ribbit(now + 1.5, 0.045);
        return;
      }
      case "reward":
      case "discovery": {
        this.duckFor(0.3, 0.9);
        const notes = name === "reward" ? [69, 74, 76, 81, 88] : [72, 76, 79, 84];
        notes.forEach((n, i) => this.bell(midi(n), now + i * 0.085, 0.06, 2.01, this.fx));
        this.pluck(midi(57), now, 0.07, this.fx);
        if (name === "reward") this.woof(now + 0.62, 0.06);
        return;
      }
      case "jump": {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.13);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc.connect(gain).connect(this.fx);
        osc.start(now);
        osc.stop(now + 0.18);
        return;
      }
      case "land": {
        this.hand(now, 0.09, true);
        return;
      }
      case "fail": {
        this.duckFor(0.4, 1);
        [76, 72, 69, 64].forEach((n, i) => this.pluck(midi(n), now + i * 0.1, 0.06, this.fx));
        this.woof(now + 0.5, 0.05);
        return;
      }
    }
  }
}
