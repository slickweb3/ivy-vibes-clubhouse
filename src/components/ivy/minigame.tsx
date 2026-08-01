/**
 * Lily Pad Leap — Ivy's pond dash.
 *
 * The runner is the owner-supplied character sprite. Everything else is drawn
 * on canvas at device resolution (up to 3x, so it stays crisp on 4K and
 * high-DPI phones). Reduced-motion friendly: nothing animates until a run starts.
 *
 * Game-feel systems (all deterministic, all client side):
 *   - coyote time + input buffering so a hop never feels dropped
 *   - variable jump height (hold to float, release to drop)
 *   - hit-stop and a flash frame on impact
 *   - coin combos, near-miss rewards and milestone callouts
 *   - pause anywhere, generated audio, persistent best score
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import bs58 from "bs58";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ivy/primitives";
import { getLeaderboard, startRun, submitScore } from "@/lib/game.functions";
import { SeasonCard } from "@/components/ivy/player-card";
import { gameAudio } from "@/lib/game-audio";
import { audioScene } from "@/lib/audio/cue";
import type { Leaderboard } from "@/lib/game.server";
import runnerSprite from "@/assets/ivy-runner.png";
import gameFrame from "@/assets/game-frame.png";
import { discover } from "@/lib/discoveries";

const W = 480;
const H = 270;
const GROUND_Y = 214;
const GRAVITY = 2000;
/** Extra gravity once the hop button is released — short taps give short hops. */
const RELEASE_GRAVITY = 3400;
const JUMP_V = -620;
const START_SPEED = 338;
/** No ceiling: the pond keeps accelerating at a constant rate until it beats you. */
const SPEED_RAMP = 38;
/** Max backing-store multiplier — 3x of a 1440px-wide canvas is ~4K wide. */
const MAX_PIXEL_RATIO = 3;
const PLAYER_X = 76;
const PLAYER_H = 58;
/** Grace window after walking off a ledge / before landing. Classic platformer feel. */
const COYOTE = 0.1;
const BUFFER = 0.14;
const COMBO_WINDOW = 2.2;
const BEST_KEY = "ivy-leap-best";

const COLORS = {
  pond: "#174F36",
  pondDeep: "#0f3826",
  frog: "#83D94E",
  leaf: "#C9F39B",
  cream: "#FFF8E7",
  charcoal: "#151515",
  pink: "#FF8EAE",
  yellow: "#FFD86B",
  lavender: "#C7B8FF",
};

/** Log obstacle wood tones (bark + sawn end grain). */
const BARK = "#6B4A2B";
const WOOD = "#C68B4C";

type Obstacle = { x: number; w: number; h: number; kind: "stump" | "log"; scored: boolean };
type Coin = { x: number; y: number; taken: boolean; spin: number };
type Splash = { x: number; y: number; vx: number; vy: number; life: number; hue: string };
type Floater = { x: number; y: number; text: string; life: number; hue: string; size: number };

interface RunState {
  t: number;
  speed: number;
  distance: number;
  /** Coins collected — reported verbatim as telemetry. */
  coins: number;
  /** Points banked from coins, including combo bonuses. */
  coinScore: number;
  bonus: number;
  combo: number;
  comboTimer: number;
  bestCombo: number;
  nearMisses: number;
  milestone: number;
  y: number;
  vy: number;
  jumps: number;
  holding: boolean;
  coyote: number;
  buffer: number;
  /** Total hops this run — reported as anti-cheat telemetry, never as identity. */
  taps: number;
  obstacles: Obstacle[];
  coinsList: Coin[];
  pads: number[];
  splashes: Splash[];
  floaters: Floater[];
  shake: number;
  flash: number;
  hitstop: number;
  scorePulse: number;
  passedBest: boolean;
  nextObstacle: number;
  nextCoin: number;
  /** Vertical squash/stretch factor. 1 = neutral; springs back to 1 always. */
  squash: number;
  over: boolean;
}

function freshRun(): RunState {
  return {
    t: 0,
    speed: START_SPEED,
    distance: 0,
    coins: 0,
    coinScore: 0,
    bonus: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    nearMisses: 0,
    milestone: 0,
    y: GROUND_Y,
    vy: 0,
    jumps: 0,
    holding: false,
    coyote: COYOTE,
    buffer: 0,
    taps: 0,
    obstacles: [],
    coinsList: [],
    pads: [60, 200, 340, 460],
    splashes: [],
    floaters: [],
    shake: 0,
    flash: 0,
    hitstop: 0,
    scorePulse: 0,
    passedBest: false,
    nextObstacle: 260,
    nextCoin: 133,
    squash: 1,
    over: false,
  };
}

function burst(run: RunState, x: number, y: number, count: number, hue: string, calm = false) {
  const n = calm ? Math.ceil(count / 3) : count;
  for (let i = 0; i < n; i += 1) {
    run.splashes.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 150,
      vy: -60 - Math.random() * 150,
      life: 0.45 + Math.random() * 0.35,
      hue,
    });
  }
}

function float(run: RunState, x: number, y: number, text: string, hue: string, size = 12) {
  run.floaters.push({ x, y, text, life: 0.9, hue, size });
}

const scoreOf = (run: RunState) => Math.floor(run.distance / 8) + run.coinScore + run.bonus;

/* ---------------------------------- wallet --------------------------------- */

interface SolanaProvider {
  isPhantom?: boolean;
  publicKey?: { toString(): string } | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array }>;
}

function getProvider(): SolanaProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { solana?: SolanaProvider; solflare?: SolanaProvider };
  return w.solana ?? w.solflare ?? null;
}

function shortWallet(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/* ----------------------------------- game ---------------------------------- */

export function LilyPadLeap({ initialLeaderboard }: { initialLeaderboard: Leaderboard }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const runRef = useRef<RunState>(freshRun());
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const nonceRef = useRef<string | null>(null);
  const jumpRef = useRef<() => void>(() => {});
  const stepRef = useRef<(now: number) => void>(() => {});
  const phaseRef = useRef<"idle" | "playing" | "paused" | "over">("idle");
  const bestRef = useRef(0);
  const calmRef = useRef(false);
  const hudRef = useRef(0);

  const [phase, setPhase] = useState<"idle" | "playing" | "paused" | "over">("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [summary, setSummary] = useState({
    score: 0,
    coins: 0,
    combo: 0,
    seconds: 0,
    record: false,
  });
  const [soundOn, setSoundOn] = useState(true);
  const [wallet, setWallet] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [board, setBoard] = useState<Leaderboard>(initialLeaderboard);
  const [cardKey, setCardKey] = useState(0);

  const beginRun = useServerFn(startRun);
  const sendScore = useServerFn(submitScore);
  const refreshBoard = useServerFn(getLeaderboard);

  phaseRef.current = phase;

  /* ---- draw ---- */
  const draw = useCallback((run: RunState) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Render at the canvas' real backing resolution, then work in world units.
    const scale = canvas.width / W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, W, H);

    const shake = calmRef.current ? 0 : run.shake;
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#1c6244");
    sky.addColorStop(0.55, COLORS.pond);
    sky.addColorStop(1, COLORS.pondDeep);
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    // far parallax reed silhouettes
    ctx.fillStyle = "rgba(15, 56, 38, 0.55)";
    for (let i = 0; i < 14; i += 1) {
      const raw = (i * 63 - run.distance * 0.12) % (W + 80);
      const x = raw < 0 ? raw + W + 80 : raw;
      const h = 40 + ((i * 29) % 46);
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 12);
      ctx.quadraticCurveTo(x + 6, GROUND_Y + 12 - h * 0.6, x + 2, GROUND_Y + 12 - h);
      ctx.quadraticCurveTo(x + 10, GROUND_Y + 12 - h * 0.5, x + 12, GROUND_Y + 12);
      ctx.closePath();
      ctx.fill();
    }

    // hanging ivy garland — echoes the toy frame artwork
    const drawLeaf = (lx: number, ly: number, size: number, tilt: number, fill: string) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(tilt);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size, -size * 0.6, size * 0.8, size * 0.6, 0, size);
      ctx.bezierCurveTo(-size * 0.8, size * 0.6, -size, -size * 0.6, 0, -size);
      ctx.fill();
      ctx.strokeStyle = "rgba(21, 21, 21, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.stroke();
      ctx.restore();
    };

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = "rgba(90, 62, 34, 0.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = -10; x <= W + 10; x += 10) {
      const y = 8 + Math.sin((x + run.distance * 0.18) * 0.03) * 5;
      if (x === -10) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < 16; i += 1) {
      const raw = (i * 41 - run.distance * 0.18) % (W + 60);
      const x = raw < 0 ? raw + W + 60 : raw;
      const base = 8 + Math.sin((x + run.distance * 0.18) * 0.03) * 5;
      const drop = 12 + ((i * 17) % 26);
      ctx.strokeStyle = "rgba(90, 62, 34, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x + 4, base + drop * 0.6, x + 1, base + drop);
      ctx.stroke();
      const sway = Math.sin(run.t * 1.4 + i) * 0.18;
      drawLeaf(x + 1, base + drop + 5, 6 + (i % 3), sway, i % 2 ? COLORS.frog : COLORS.leaf);
      drawLeaf(x - 5, base + drop * 0.5, 5, sway - 0.6, COLORS.frog);
    }
    ctx.restore();

    // drifting bubbles
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = COLORS.leaf;
    for (let i = 0; i < 11; i += 1) {
      const raw = (i * 71 - run.distance * 0.25) % (W + 60);
      const x = raw < 0 ? raw + W + 60 : raw;
      const y = 34 + ((i * 37 + run.t * 14) % 130);
      ctx.beginPath();
      ctx.arc(x, y, 3 + (i % 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // water surface
    const water = ctx.createLinearGradient(0, GROUND_Y + 10, 0, H);
    water.addColorStop(0, "rgba(131, 217, 78, 0.26)");
    water.addColorStop(1, "rgba(131, 217, 78, 0.08)");
    ctx.fillStyle = water;
    ctx.fillRect(0, GROUND_Y + 10, W, H - GROUND_Y - 10);
    ctx.strokeStyle = COLORS.frog;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 10);
    ctx.lineTo(W, GROUND_Y + 10);
    ctx.stroke();

    // ripples
    ctx.strokeStyle = "rgba(255, 248, 231, 0.18)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i += 1) {
      const raw = (i * 121 - run.distance * 0.8) % (W + 120);
      const x = raw < 0 ? raw + W + 120 : raw;
      const y = GROUND_Y + 22 + i * 9;
      ctx.beginPath();
      ctx.ellipse(x, y, 26, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // lily pads
    run.pads.forEach((padX, i) => {
      const bob = Math.sin(run.t * 1.6 + i) * 1.6;
      ctx.fillStyle = "rgba(21, 21, 21, 0.18)";
      ctx.beginPath();
      ctx.ellipse(padX, GROUND_Y + 26 + bob, 34, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.leaf;
      ctx.beginPath();
      ctx.ellipse(padX, GROUND_Y + 22 + bob, 34, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(21, 21, 21, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padX + 4, GROUND_Y + 22 + bob);
      ctx.lineTo(padX + 32, GROUND_Y + 20 + bob);
      ctx.stroke();
      if (i % 3 === 0) {
        // pink lotus, matching the frame stickers
        const fx = padX - 14;
        const fy = GROUND_Y + 17 + bob;
        ctx.fillStyle = COLORS.pink;
        for (let p = 0; p < 6; p += 1) {
          const a = (p / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(fx + Math.cos(a) * 4, fy + Math.sin(a) * 2.4, 4, 2.6, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = COLORS.yellow;
        ctx.beginPath();
        ctx.arc(fx, fy, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // speed lines — the pond blurs past once the ramp gets serious
    const rush = Math.min(1, Math.max(0, (run.speed - START_SPEED) / 420));
    if (rush > 0.05 && !calmRef.current) {
      ctx.save();
      ctx.globalAlpha = rush * 0.3;
      ctx.strokeStyle = COLORS.leaf;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 7; i += 1) {
        const raw = (i * 97 - run.distance * 2.2) % (W + 160);
        const x = raw < 0 ? raw + W + 160 : raw;
        const y = 46 + ((i * 53) % 150);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 26 + rush * 30, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // coins
    run.coinsList.forEach((coin) => {
      if (coin.taken) return;
      const wobble = Math.abs(Math.cos(coin.spin));
      ctx.save();
      ctx.translate(coin.x, coin.y + Math.sin(run.t * 3 + coin.x * 0.05) * 2);
      ctx.scale(Math.max(0.2, wobble), 1);
      ctx.fillStyle = COLORS.yellow;
      ctx.strokeStyle = COLORS.charcoal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (wobble > 0.55) {
        ctx.fillStyle = COLORS.charcoal;
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("i", 0, 3.5);
      }
      ctx.restore();
    });

    // obstacles — weathered pond logs
    run.obstacles.forEach((ob) => {
      const top = GROUND_Y + 10 - ob.h;
      ctx.fillStyle = "rgba(21, 21, 21, 0.22)";
      ctx.beginPath();
      ctx.ellipse(ob.x + ob.w / 2, GROUND_Y + 14, ob.w * 0.7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = COLORS.charcoal;
      ctx.lineWidth = 2.5;
      // bark body
      ctx.fillStyle = BARK;
      ctx.beginPath();
      ctx.roundRect(ob.x, top, ob.w, ob.h, Math.min(10, ob.w * 0.4));
      ctx.fill();
      ctx.stroke();

      if (ob.kind === "log") {
        // lying log: sawn end-grain circle on the left, bark grain lines across
        const cy = top + ob.h / 2;
        const r = Math.min(ob.h / 2 - 2, 9);
        ctx.fillStyle = WOOD;
        ctx.beginPath();
        ctx.ellipse(ob.x + r + 2, cy, r * 0.62, r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(ob.x + r + 2, cy, r * 0.3, r * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(21, 21, 21, 0.28)";
        ctx.lineWidth = 1.6;
        for (let i = 1; i <= 2; i += 1) {
          const gy = top + (ob.h * i) / 3;
          ctx.beginPath();
          ctx.moveTo(ob.x + r * 1.9, gy);
          ctx.lineTo(ob.x + ob.w - 4, gy);
          ctx.stroke();
        }
      } else {
        // upright stump: sawn top, vertical bark strips, little moss cap
        ctx.fillStyle = WOOD;
        ctx.beginPath();
        ctx.ellipse(ob.x + ob.w / 2, top + 3, ob.w / 2 - 1, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.strokeStyle = "rgba(21, 21, 21, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ob.x + ob.w * 0.5, top + 8);
        ctx.lineTo(ob.x + ob.w * 0.5, top + ob.h - 4);
        ctx.stroke();
        ctx.fillStyle = COLORS.frog;
        ctx.beginPath();
        ctx.ellipse(ob.x + ob.w * 0.28, top + 4, 3.5, 2.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // splashes
    run.splashes.forEach((p) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.fillStyle = p.hue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // player
    const sprite = spriteRef.current;
    const airborne = run.y < GROUND_Y - 0.5;
    const bob = airborne ? 0 : Math.sin(run.t * 14) * 1.8;
    const py = run.y + bob;

    ctx.fillStyle = "rgba(21, 21, 21, 0.28)";
    const shadowScale = Math.max(0.35, 1 - (GROUND_Y - run.y) / 130);
    ctx.beginPath();
    ctx.ellipse(PLAYER_X, GROUND_Y + 14, 26 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const h = PLAYER_H;
      const w = (sprite.naturalWidth / sprite.naturalHeight) * h;
      ctx.save();
      ctx.translate(PLAYER_X, py + 10);
      const tilt = Math.max(-0.22, Math.min(0.22, run.vy / 3600));
      ctx.rotate(tilt);
      // Area-preserving squash & stretch. run.squash is spring-driven in the
      // physics step and always resolves back to 1, so Ivy can never get stuck
      // shrunk after a hop. Idle breathing only applies while grounded.
      const idle = airborne ? 0 : Math.abs(Math.sin(run.t * 14)) * 0.03;
      const sy = Math.max(0.75, Math.min(1.25, run.squash - idle));
      const sx = 1 / sy;
      ctx.drawImage(sprite, (-w * sx) / 2, -h * sy, w * sx, h * sy);
      ctx.restore();
    } else {
      ctx.fillStyle = COLORS.leaf;
      ctx.beginPath();
      ctx.roundRect(PLAYER_X - 22, py - 34, 44, 44, 14);
      ctx.fill();
    }

    // floating callouts
    run.floaters.forEach((f) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.6));
      ctx.translate(f.x, f.y - (0.9 - f.life) * 26);
      ctx.font = `bold ${f.size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(21,21,21,0.55)";
      ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.hue;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    });

    // hud
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = COLORS.cream;
    const pulse = 1 + Math.min(0.35, run.scorePulse);
    ctx.textAlign = "left";
    ctx.save();
    ctx.translate(14, 28);
    ctx.scale(pulse, pulse);
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.fillText(`${scoreOf(run)}`, 0, 0);
    ctx.restore();
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255, 248, 231, 0.8)";
    ctx.fillText("SCORE", 14, 40);
    if (bestRef.current > 0) {
      ctx.fillText(`BEST ${bestRef.current}`, 14, 52);
    }
    if (run.coins > 0) {
      ctx.textAlign = "right";
      ctx.fillStyle = COLORS.yellow;
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.fillText(`◎ ${run.coins}`, W - 14, 28);
    }
    if (run.combo > 1) {
      ctx.textAlign = "right";
      ctx.fillStyle = COLORS.pink;
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillText(`x${run.combo} combo`, W - 14, 44);
      // combo timer bar
      ctx.fillStyle = "rgba(255, 142, 174, 0.85)";
      const barW = 64 * Math.max(0, run.comboTimer / COMBO_WINDOW);
      ctx.fillRect(W - 14 - barW, 50, barW, 3);
    }
    ctx.restore();

    // impact flash — one bright frame reads as "that hurt" without a long fade
    if (run.flash > 0 && !calmRef.current) {
      ctx.fillStyle = `rgba(255, 248, 231, ${Math.min(0.5, run.flash)})`;
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }
  }, []);

  /* ---- loop ---- */
  const step = useCallback(
    (now: number) => {
      const run = runRef.current;
      // Clamp dt so a backgrounded tab can never teleport the player into a reed.
      const rawDt = Math.min((now - lastRef.current) / 1000, 1 / 30);
      lastRef.current = now;

      // Hit-stop: a few frozen frames on impact so the crash lands physically.
      if (run.hitstop > 0) {
        run.hitstop -= rawDt;
        run.flash = Math.max(0, run.flash - rawDt * 2);
        draw(run);
        if (run.hitstop <= 0 && run.over) {
          finishRun(run);
          return;
        }
        rafRef.current = requestAnimationFrame(stepRef.current);
        return;
      }

      const dt = rawDt;
      run.t += dt;
      run.speed = START_SPEED + run.t * SPEED_RAMP;
      // The theme tightens as the pond speeds up.
      gameAudio.setIntensity((run.speed - START_SPEED) / 420);
      const dx = run.speed * dt;
      run.distance += dx;
      run.scorePulse = Math.max(0, run.scorePulse - dt * 2.2);
      run.flash = Math.max(0, run.flash - dt * 3);

      const wasAirborne = run.y < GROUND_Y - 0.5;
      // Release the hop early and Ivy drops sooner — full control over arc height.
      const g = run.vy < 0 && !run.holding ? RELEASE_GRAVITY : GRAVITY;
      run.vy += g * dt;
      run.y += run.vy * dt;
      if (run.y >= GROUND_Y) {
        if (wasAirborne && run.vy > 260) {
          burst(run, PLAYER_X, GROUND_Y + 10, 6, COLORS.cream, calmRef.current);
        }
        run.y = GROUND_Y;
        run.vy = 0;
        run.jumps = 0;
        run.coyote = COYOTE;
      } else {
        run.coyote = Math.max(0, run.coyote - dt);
      }

      // Buffered input fires the instant a hop becomes legal again.
      run.buffer = Math.max(0, run.buffer - dt);
      if (run.buffer > 0 && (run.y >= GROUND_Y || run.coyote > 0 || run.jumps < 2)) {
        run.buffer = 0;
        applyJump(run);
      }

      run.shake = Math.max(0, run.shake - dt * 22);
      if (run.comboTimer > 0) {
        run.comboTimer -= dt;
        if (run.comboTimer <= 0) run.combo = 0;
      }

      run.pads = run.pads.map((p) => (p - dx * 0.6 < -40 ? p + W + 60 : p - dx * 0.6));

      run.nextObstacle -= dx;
      if (run.nextObstacle <= 0) {
        const lying = Math.random() < 0.45;
        run.obstacles.push(
          lying
            ? { x: W + 20, w: 40, h: 24, kind: "log", scored: false }
            : { x: W + 20, w: 20, h: 34 + Math.random() * 24, kind: "stump", scored: false },
        );
        // Gap scales with speed so it stays clearable, but tightens as the run drags on.
        // The first ~8 seconds stay generous: nobody should die while still learning.
        const warmup = run.t < 8 ? 1.25 : 1;
        const tighten = Math.max(0.56, 1 - run.t * 0.007);
        run.nextObstacle = run.speed * tighten * warmup * (0.88 + Math.random() * 0.52);
      }

      run.nextCoin -= dx;
      if (run.nextCoin <= 0) {
        run.coinsList.push({
          x: W + 20,
          y: GROUND_Y - 42 - Math.random() * 56,
          taken: false,
          spin: Math.random() * Math.PI,
        });
        run.nextCoin = 163 + Math.random() * 178;
      }

      run.obstacles = run.obstacles.filter((ob) => {
        ob.x -= dx;
        return ob.x + ob.w > -20;
      });
      run.coinsList = run.coinsList.filter((coin) => {
        coin.x -= dx;
        coin.spin += dt * 4;
        return coin.x > -20;
      });
      run.splashes = run.splashes.filter((p) => {
        p.life -= dt;
        p.vy += GRAVITY * 0.35 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        return p.life > 0;
      });
      run.floaters = run.floaters.filter((f) => {
        f.life -= dt;
        f.x -= dx * 0.4;
        return f.life > 0;
      });

      // collisions — a forgiving box tucked inside the sprite
      const pl = { x: PLAYER_X - 17, y: run.y - 34, w: 34, h: 40 };
      for (const ob of run.obstacles) {
        const oy = GROUND_Y + 10 - ob.h;
        if (pl.x < ob.x + ob.w - 3 && pl.x + pl.w > ob.x + 3 && pl.y + pl.h > oy + 3) {
          run.over = true;
          run.shake = 12;
          run.flash = 0.5;
          run.hitstop = 0.22;
          burst(run, PLAYER_X + 10, run.y - 12, 16, COLORS.pink, calmRef.current);
          gameAudio.play("death");
          gameAudio.stopMusic();
          draw(run);
          rafRef.current = requestAnimationFrame(stepRef.current);
          return;
        }
        // Near miss: cleared it with barely any daylight. Skill gets paid.
        if (!ob.scored && ob.x + ob.w < pl.x) {
          ob.scored = true;
          const clearance = oy - (run.y + 6);
          if (clearance > 0 && clearance < 26) {
            run.bonus += 10;
            run.nearMisses += 1;
            run.scorePulse = 0.3;
            float(run, PLAYER_X + 40, run.y - 46, "NICE! +10", COLORS.lavender, 11);
            gameAudio.play("near");
          }
        }
      }
      for (const coin of run.coinsList) {
        if (coin.taken) continue;
        if (Math.hypot(coin.x - PLAYER_X, coin.y - (run.y - 16)) < 28) {
          coin.taken = true;
          run.coins += 1;
          run.combo = Math.min(run.combo + 1, 99);
          run.bestCombo = Math.max(run.bestCombo, run.combo);
          run.comboTimer = COMBO_WINDOW;
          const value = 15 + Math.min(run.combo - 1, 3) * 5;
          run.coinScore += value;
          run.scorePulse = 0.28;
          burst(run, coin.x, coin.y, 8, COLORS.yellow, calmRef.current);
          float(run, coin.x, coin.y - 12, `+${value}`, COLORS.yellow, 12);
          gameAudio.play("coin", run.combo);
          if (run.combo === 5) {
            float(run, PLAYER_X + 60, run.y - 60, "COMBO x5!", COLORS.pink, 14);
            gameAudio.play("combo");
          }
        }
      }

      // milestones — a small celebration every 500 points keeps the middle alive
      const live = scoreOf(run);
      if (live >= run.milestone + 500) {
        run.milestone = Math.floor(live / 500) * 500;
        float(run, W / 2, 90, `${run.milestone}!`, COLORS.frog, 20);
        burst(run, W / 2, 100, 12, COLORS.frog, calmRef.current);
        gameAudio.play("milestone");
      }
      if (!run.passedBest && bestRef.current > 0 && live > bestRef.current) {
        run.passedBest = true;
        float(run, W / 2, 70, "NEW BEST!", COLORS.yellow, 18);
        gameAudio.play("milestone");
      }

      draw(run);

      // React state is expensive at 60fps — the canvas owns the live score and
      // the DOM only syncs a few times a second for the accessible readout.
      hudRef.current += dt;
      if (hudRef.current > 0.2) {
        hudRef.current = 0;
        setScore(live);
      }

      rafRef.current = requestAnimationFrame(stepRef.current);
    },
    [draw],
  );

  /** Shared jump impulse so buffered and live inputs behave identically. */
  function applyJump(run: RunState) {
    const grounded = run.y >= GROUND_Y - 0.5 || run.coyote > 0;
    if (grounded && run.jumps === 0) {
      run.vy = JUMP_V;
      run.jumps = 1;
      run.coyote = 0;
      run.holding = true;
      run.taps += 1;
      burst(run, PLAYER_X - 8, run.y + 6, 5, COLORS.leaf, calmRef.current);
      gameAudio.play("jump");
      return true;
    }
    if (run.jumps < 2) {
      run.vy = JUMP_V * 0.86;
      run.jumps += 1;
      run.holding = true;
      run.taps += 1;
      burst(run, PLAYER_X - 8, run.y + 6, 8, COLORS.leaf, calmRef.current);
      gameAudio.play("double");
      return true;
    }
    return false;
  }

  const finishRun = useCallback((run: RunState) => {
    const finalScore = scoreOf(run);
    const record = finalScore > bestRef.current;
    if (record) {
      bestRef.current = finalScore;
      setBest(finalScore);
      try {
        window.localStorage.setItem(BEST_KEY, String(finalScore));
      } catch {
        /* private mode — the run still counts, it just isn't remembered */
      }
    }
    setScore(finalScore);
    setSummary({
      score: finalScore,
      coins: run.coins,
      combo: run.bestCombo,
      seconds: Math.round(run.t),
      record,
    });
    setPhase("over");
    gameAudio.stopMusic();
    audioScene("game");
    discover("leap");
    rafRef.current = null;
  }, []);

  stepRef.current = step;

  const start = useCallback(async () => {
    // Never leave a second loop running — that used to double the game speed.
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    gameAudio.unlock();
    gameAudio.startMusic();
    // Ivy's world music steps aside so the game theme has the stage.
    audioScene("hush");
    runRef.current = freshRun();
    setScore(0);
    setStatus(null);
    setPhase("playing");
    nonceRef.current = null;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(stepRef.current);
    try {
      const { nonce } = await beginRun({});
      nonceRef.current = nonce;
    } catch {
      nonceRef.current = null;
    }
  }, [beginRun]);

  const resume = useCallback(() => {
    if (phaseRef.current !== "paused") return;
    setPhase("playing");
    lastRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(stepRef.current);
  }, []);

  const pause = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPhase("paused");
  }, []);

  const jump = useCallback(() => {
    const run = runRef.current;
    if (phaseRef.current === "paused") {
      resume();
      return;
    }
    if (phaseRef.current === "idle" || phaseRef.current === "over") {
      void start();
      return;
    }
    if (!applyJump(run)) {
      // Too early — remember it and fire the moment a hop is legal again.
      run.buffer = BUFFER;
    }
  }, [resume, start]);

  const release = useCallback(() => {
    runRef.current.holding = false;
  }, []);

  jumpRef.current = jump;

  /* ---- reduced motion + stored preferences ---- */
  useEffect(() => {
    gameAudio.init();
    setSoundOn(gameAudio.enabled);
    const onHidden = () => {
      if (document.hidden) gameAudio.stopMusic();
    };
    document.addEventListener("visibilitychange", onHidden);
    try {
      const stored = Number(window.localStorage.getItem(BEST_KEY) ?? 0);
      if (Number.isFinite(stored) && stored > 0) {
        bestRef.current = stored;
        setBest(stored);
      }
    } catch {
      /* ignore */
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      calmRef.current = query.matches;
    };
    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onHidden);
      gameAudio.stopMusic();
    };
  }, []);

  /* ---- crisp canvas: match the backing store to the real device pixels ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const cssWidth = canvas.clientWidth || W;
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const backingWidth = Math.round(cssWidth * ratio);
      const backingHeight = Math.round((backingWidth * H) / W);
      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
      }
      draw(runRef.current);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  /* ---- sprite ---- */
  useEffect(() => {
    const image = new Image();
    image.decoding = "async";
    image.src = runnerSprite;
    image.onload = () => {
      spriteRef.current = image;
      draw(runRef.current);
    };
    return () => {
      image.onload = null;
    };
  }, [draw]);

  useEffect(() => {
    const inField = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return Boolean(el?.closest("input, textarea, select, button, a, [contenteditable]"));
    };
    const onScreen = () => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const box = canvas.getBoundingClientRect();
      return box.bottom > 0 && box.top < window.innerHeight;
    };
    const onKey = (event: KeyboardEvent) => {
      if (inField(event.target) || !onScreen()) return;
      if (event.code === "KeyP" || event.code === "Escape") {
        event.preventDefault();
        if (phaseRef.current === "playing") pause();
        else if (phaseRef.current === "paused") resume();
        return;
      }
      if (event.code !== "Space" && event.code !== "ArrowUp" && event.code !== "Enter") return;
      event.preventDefault();
      if (event.repeat) return;
      jumpRef.current();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "Enter") release();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [pause, release, resume]);

  /* ---- pause when the tab is hidden so nothing runs off-screen ---- */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && phaseRef.current === "playing") pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);

  /* ---- auto-pause when the player scrolls the game out of view ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && phaseRef.current === "playing") pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [pause]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  /* ---- wallet ---- */
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;
    provider
      .connect({ onlyIfTrusted: true })
      .then((res) => setWallet(res.publicKey.toString()))
      .catch(() => undefined);
  }, []);

  const connect = useCallback(async () => {
    const provider = getProvider();
    if (!provider) {
      setStatus("No Solana wallet found in this browser. Phantom or Solflare works.");
      return;
    }
    try {
      const res = await provider.connect();
      setWallet(res.publicKey.toString());
      setStatus(null);
    } catch {
      setStatus("Wallet connection was cancelled.");
    }
  }, []);

  const submit = useCallback(async () => {
    const provider = getProvider();
    const nonce = nonceRef.current;
    const finalScore = scoreOf(runRef.current);
    if (!wallet || !provider) {
      setStatus("Connect a Solana wallet first so the score can be paid out to it.");
      return;
    }
    if (!nonce) {
      setStatus("That run was not tracked. Play one more and it will be.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const message = [
        "ivy vibing — Lily Pad Leap",
        "Signing this only proves you own this wallet. It never moves funds.",
        `Wallet: ${wallet}`,
        `Score: ${finalScore}`,
        `Nonce: ${nonce}`,
      ].join("\n");
      const signed = await provider.signMessage(new TextEncoder().encode(message), "utf8");
      const result = await sendScore({
        data: {
          wallet,
          score: finalScore,
          nonce,
          signature: bs58.encode(signed.signature),
          telemetry: {
            coins: runRef.current.coins,
            jumps: runRef.current.taps,
            durationMs: Math.round(runRef.current.t * 1000),
          },
        },
      });
      if (!result.accepted) {
        setStatus(result.reason ?? "Score was not accepted.");
      } else {
        nonceRef.current = null;
        const bits = [
          result.rank
            ? `Locked in. Season best ${result.bestScore} — currently #${result.rank}.`
            : `Locked in. Season best ${result.bestScore}.`,
        ];
        if (result.xpEarned) bits.push(`+${result.xpEarned} XP (level ${result.level}).`);
        if (result.streakDays && result.streakDays > 1) {
          bits.push(`${result.streakDays}-day streak.`);
        }
        if (result.flagged) {
          bits.push(
            "This run looked automated, so it earned no XP and reward eligibility is paused.",
          );
        }
        setStatus(bits.join(" "));
        setCardKey((key) => key + 1);
        setBoard(await refreshBoard({}));
      }
    } catch {
      setStatus("Signing was cancelled or failed.");
    } finally {
      setBusy(false);
    }
  }, [refreshBoard, sendScore, wallet]);

  const toggleSound = useCallback(() => {
    const next = !gameAudio.enabled;
    gameAudio.setEnabled(next);
    setSoundOn(next);
    if (next) {
      gameAudio.play("ui");
      if (phase === "playing") gameAudio.startMusic();
    } else {
      gameAudio.stopMusic();
    }
  }, [phase]);

  const resetDate = useMemo(
    () =>
      new Date(board.nextResetIso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }),
    [board.nextResetIso],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div>
        {/* Console pod. `data-phase` drives every bezel state in CSS so the
            shell can animate without re-rendering the game loop. */}
        <div
          className="game-pod"
          data-phase={phase === "over" && summary.record ? "record" : phase}
        >
          <div className="game-pod-rail" aria-hidden>
            <span className="game-pod-led" />
            <span className="game-pod-led" />
            <span className="game-pod-led" />
            <span>
              {phase === "playing"
                ? "Live · Pond Sector 64"
                : phase === "paused"
                  ? "Standby"
                  : phase === "over"
                    ? "Run archived"
                    : "Portal ready"}
            </span>
            <span className="ml-auto tabular-nums">Best {best}</span>
          </div>
          <div
            className="game-frame"
            style={{ ["--game-frame-src" as string]: `url(${gameFrame})` }}
          >
            <div className="game-frame-screen">
              <div
                role="button"
                tabIndex={0}
                aria-label="Play Lily Pad Leap. Tap or press space to hop, hold for a higher hop, press P to pause."
                onPointerDown={(event) => {
                  event.preventDefault();
                  // Native-handheld feel: a 8ms tick where the platform supports it.
                  navigator.vibrate?.(8);
                  jump();
                }}

                onPointerUp={release}
                onPointerCancel={release}
                onPointerLeave={release}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    if (!event.repeat) jump();
                  }
                }}
                onKeyUp={release}
                className="relative block h-full max-h-full w-auto max-w-full touch-none select-none overflow-hidden rounded-md border-2 border-charcoal sm:rounded-xl sm:border-[3px]"
                style={{ aspectRatio: `${W} / ${H}` }}
              >
                <canvas
                  ref={canvasRef}
                  width={W}
                  height={H}
                  className="block h-full w-full bg-ivy"
                  style={{ imageRendering: "auto" }}
                />

                {phase === "playing" ? (
                  <button
                    type="button"
                    aria-label="Pause game"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      pause();
                    }}
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-charcoal bg-cream/90 text-charcoal transition-transform hover:scale-110 active:scale-95"
                  >
                    <Pause className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}

                {phase !== "playing" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ivy/85 p-2 text-center text-cream backdrop-blur-[2px] duration-200 animate-in fade-in sm:gap-2 sm:p-3">
                    <p className="font-display text-lg sm:text-2xl">
                      {phase === "idle"
                        ? "Lily Pad Leap"
                        : phase === "paused"
                          ? "Paused"
                          : "Splash!"}
                    </p>

                    {phase === "over" ? (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-xs">
                        <span className="rounded-full bg-cream/15 px-2 py-0.5">
                          Score <b className="tabular-nums">{summary.score}</b>
                        </span>
                        <span className="rounded-full bg-cream/15 px-2 py-0.5">
                          ◎ <b className="tabular-nums">{summary.coins}</b>
                        </span>
                        {summary.combo > 1 ? (
                          <span className="rounded-full bg-cream/15 px-2 py-0.5">
                            Best combo x{summary.combo}
                          </span>
                        ) : null}
                        <span className="rounded-full bg-cream/15 px-2 py-0.5">
                          {summary.seconds}s
                        </span>
                        {summary.record ? (
                          <span className="rounded-full bg-yellow px-2 py-0.5 font-bold text-charcoal">
                            New best!
                          </span>
                        ) : (
                          <span className="rounded-full bg-cream/15 px-2 py-0.5">Best {best}</span>
                        )}
                      </div>
                    ) : (
                      <p className="max-w-xs text-[11px] leading-snug opacity-90 sm:text-sm">
                        {phase === "idle"
                          ? "Hop the logs, scoop the $ivy coins. Tap twice to double-hop, hold for height."
                          : "Take your time. Nothing moves until you do."}
                      </p>
                    )}

                    <span className="rounded-full bg-frog px-3 py-1.5 font-display text-[11px] text-charcoal pop-static sm:px-4 sm:py-2 sm:text-sm">
                      {phase === "idle"
                        ? "Tap / press space to start"
                        : phase === "paused"
                          ? "Tap or press P to resume"
                          : "Tap to hop again"}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Accessible mirror of the canvas HUD for screen readers. */}
        <p className="sr-only" aria-live="polite">
          {phase === "over"
            ? `Run over. Score ${summary.score}. Best ${best}.`
            : phase === "paused"
              ? "Game paused."
              : `Score ${score}.`}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {wallet ? (
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-frog px-2.5 py-1 font-mono text-xs text-charcoal pop-static">
              ● {shortWallet(wallet)}
            </span>
          ) : (
            <StatusChip status="pending" label="No wallet linked" />
          )}
          {wallet ? null : (
            <Button
              onClick={connect}
              className="min-h-11 rounded-full bg-lavender px-4 font-display text-charcoal pop hover:bg-lavender"
            >
              Connect Solana wallet
            </Button>
          )}
          <Button
            onClick={submit}
            disabled={busy || phase !== "over" || score <= 0}
            className="min-h-11 rounded-full bg-frog px-4 font-display text-charcoal pop hover:bg-frog"
          >
            {busy ? "Signing…" : "Submit score to leaderboard"}
          </Button>
          <Button
            onClick={() => (phase === "paused" ? resume() : void start())}
            variant="outline"
            className="min-h-11 gap-1.5 rounded-full border-[3px] border-charcoal bg-card px-4 font-display text-charcoal"
          >
            {phase === "playing" ? (
              <RotateCcw className="h-4 w-4" aria-hidden />
            ) : (
              <Play className="h-4 w-4" aria-hidden />
            )}
            {phase === "playing" ? "Restart" : phase === "paused" ? "Resume" : "Play"}
          </Button>
          <Button
            onClick={toggleSound}
            variant="outline"
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute game sound" : "Unmute game sound"}
            className="min-h-11 min-w-11 rounded-full border-[3px] border-charcoal bg-card px-3 text-charcoal"
          >
            {soundOn ? (
              <Volume2 className="h-4 w-4" aria-hidden />
            ) : (
              <VolumeX className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
        {status ? <p className="mt-2 text-sm text-charcoal/85">{status}</p> : null}
        <p className="mt-2 text-xs text-charcoal/70">
          Space, tap or click to hop · hold for height · double-tap to double-hop · P to pause. The
          game is fully playable with no wallet. Connecting only reads your public address; signing
          is a free, read-only message that never approves a transaction or touches funds.
        </p>
        {wallet ? <SeasonCard wallet={wallet} refreshKey={cardKey} /> : null}
      </div>

      <div className="rounded-2xl bg-card p-4 pop-static">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl text-charcoal">Pond Court · {board.seasonLabel}</h3>
          <span className="inline-flex items-center rounded-full bg-yellow px-3 py-1 text-xs font-bold normal-case text-charcoal pop-static">
            #1 wins {board.prizeTokens.toLocaleString("en-US")} $ivy
          </span>
        </div>
        <p className="mt-1 text-sm text-charcoal/80">
          Monthly board. It resets on {resetDate} (UTC) and the top wallet is airdropped 50,000
          $ivy.
        </p>

        <ol className="mt-4 space-y-2">
          {board.monthly.length === 0 ? (
            <li className="rounded-xl bg-leaf p-3 text-sm text-charcoal">
              Nobody has posted a score this month. First hop takes the crown.
            </li>
          ) : (
            board.monthly.map((entry) => (
              <li
                key={entry.wallet}
                className="flex items-center gap-3 rounded-xl border-2 border-charcoal/15 bg-background px-3 py-2"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm text-charcoal ${
                    entry.rank === 1 ? "bg-yellow" : entry.rank <= 3 ? "bg-leaf" : "bg-card"
                  }`}
                >
                  {entry.rank}
                </span>
                <span className="min-w-0 truncate font-mono text-sm text-charcoal">
                  {shortWallet(entry.wallet)}
                </span>
                <span className="hidden shrink-0 rounded-full bg-lavender px-2 py-0.5 text-[11px] font-bold text-charcoal sm:inline">
                  Lv {entry.level}
                </span>
                {entry.streakDays > 1 ? (
                  <span className="hidden shrink-0 rounded-full bg-yellow px-2 py-0.5 text-[11px] font-bold text-charcoal sm:inline">
                    {entry.streakDays}d streak
                  </span>
                ) : null}
                {entry.rewardEligible ? null : (
                  <span
                    title="Reward eligibility paused pending fair-play review"
                    className="shrink-0 rounded-full bg-pink px-2 py-0.5 text-[11px] font-bold text-charcoal"
                  >
                    Under review
                  </span>
                )}
                <span className="ml-auto shrink-0 font-display text-base text-charcoal tabular-nums">
                  {entry.score}
                </span>
              </li>
            ))
          )}
        </ol>

        {board.allTime.length > 0 ? (
          <div className="mt-5">
            <h4 className="font-display text-sm uppercase text-charcoal/70">
              All-time hall of hops
            </h4>
            <ul className="mt-2 space-y-1">
              {board.allTime.slice(0, 5).map((entry) => (
                <li
                  key={`all-${entry.wallet}`}
                  className="flex justify-between text-sm text-charcoal/85"
                >
                  <span className="font-mono">{shortWallet(entry.wallet)}</span>
                  <span className="font-display">{entry.score}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
