import type { AudioCue, AudioScene, IvyAudio } from "./engine";

/**
 * Weightless bridge to the sound engine.
 *
 * Any component can fire a cue through this module: it costs nothing when the
 * visitor has not opted in (the engine module is never even fetched), and the
 * calls become real audio the moment they do. `import type` keeps the engine
 * out of every bundle that only wants to make a noise.
 */
let engine: IvyAudio | null = null;

export function registerAudioEngine(next: IvyAudio | null) {
  engine = next;
}

export function audioCue(name: AudioCue) {
  engine?.cue(name);
}

export function audioScene(scene: AudioScene) {
  engine?.setScene(scene);
}
