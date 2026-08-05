/** Which part of the world we are in — used to colour the arrangement. */
export type AudioScene = "landing" | "explore" | "game" | "hush";

/** Every interaction sound the site can ask for. */
export type AudioCue =
  "press" | "hover" | "open" | "reward" | "discovery" | "jump" | "land" | "fail";

/** Anything that can answer a cue — the site player, or nothing at all. */
export type AudioSink = {
  cue(name: AudioCue): void;
  setScene(scene: AudioScene): void;
};

/**
 * Weightless bridge to the sound engine.
 *
 * Any component can fire a cue through this module: it costs nothing when the
 * visitor has not opted in (`@/lib/game-audio` is never even fetched), and the
 * calls become real audio the moment they do. Only types cross this boundary,
 * so a component that merely wants to make a noise pulls in no audio code.
 */
let engine: AudioSink | null = null;

export function registerAudioEngine(next: AudioSink | null) {
  engine = next;
}

export function audioCue(name: AudioCue) {
  engine?.cue(name);
}

export function audioScene(scene: AudioScene) {
  engine?.setScene(scene);
}
