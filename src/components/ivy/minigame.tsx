/**
 * Lily Pad Leap — Ivy's pond dash.
 *
 * The runner is the owner-supplied character sprite. Everything else is drawn
 * on canvas at device resolution (up to 3x, so it stays crisp on 4K and
 * high-DPI phones). Reduced-motion friendly: nothing animates until a run starts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import bs58 from "bs58";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ivy/primitives";
import { getLeaderboard, startRun, submitScore } from "@/lib/game.functions";
import type { Leaderboard } from "@/lib/game.server";
import runnerSprite from "@/assets/ivy-runner.png";
import gameFrame from "@/assets/game-frame.png";


const W = 480;
const H = 270;
const GROUND_Y = 214;
const GRAVITY = 2000;
const JUMP_V = -620;
const START_SPEED = 190;
const MAX_SPEED = 470;
/** Max backing-store multiplier — 3x of a 1440px-wide canvas is ~4K wide. */
const MAX_PIXEL_RATIO = 3;
const PLAYER_X = 76;
const PLAYER_H = 58;


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

type Obstacle = { x: number; w: number; h: number; kind: "reed" | "rock" };
type Coin = { x: number; y: number; taken: boolean; spin: number };
type Splash = { x: number; y: number; vx: number; vy: number; life: number; hue: string };

interface RunState {
  t: number;
  speed: number;
  distance: number;
  coins: number;
  y: number;
  vy: number;
  jumps: number;
  obstacles: Obstacle[];
  coinsList: Coin[];
  pads: number[];
  splashes: Splash[];
  shake: number;
  nextObstacle: number;
  nextCoin: number;
  over: boolean;
}

function freshRun(): RunState {
  return {
    t: 0,
    speed: START_SPEED,
    distance: 0,
    coins: 0,
    y: GROUND_Y,
    vy: 0,
    jumps: 0,
    obstacles: [],
    coinsList: [],
    pads: [60, 200, 340, 460],
    splashes: [],
    shake: 0,
    nextObstacle: 260,
    nextCoin: 180,
    over: false,
  };
}

function burst(run: RunState, x: number, y: number, count: number, hue: string) {
  for (let i = 0; i < count; i += 1) {
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


const scoreOf = (run: RunState) => Math.floor(run.distance / 8) + run.coins * 15;

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

  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [wallet, setWallet] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [board, setBoard] = useState<Leaderboard>(initialLeaderboard);

  const beginRun = useServerFn(startRun);
  const sendScore = useServerFn(submitScore);
  const refreshBoard = useServerFn(getLeaderboard);

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

    const shake = run.shake;
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

    // obstacles
    run.obstacles.forEach((ob) => {
      const top = GROUND_Y + 10 - ob.h;
      ctx.fillStyle = "rgba(21, 21, 21, 0.22)";
      ctx.beginPath();
      ctx.ellipse(ob.x + ob.w / 2, GROUND_Y + 14, ob.w * 0.7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.charcoal;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = ob.kind === "reed" ? COLORS.pink : COLORS.lavender;
      ctx.beginPath();
      ctx.roundRect(ob.x, top, ob.w, ob.h, ob.kind === "reed" ? 6 : 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 248, 231, 0.35)";
      ctx.beginPath();
      ctx.roundRect(ob.x + 3, top + 4, Math.max(2, ob.w * 0.22), Math.max(4, ob.h - 10), 3);
      ctx.fill();
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
      const squash = airborne ? 1.04 : 1 - Math.abs(Math.sin(run.t * 14)) * 0.03;
      ctx.drawImage(sprite, -w / 2, -h * squash, w, h * squash);
      ctx.restore();
    } else {
      ctx.fillStyle = COLORS.leaf;
      ctx.beginPath();
      ctx.roundRect(PLAYER_X - 22, py - 34, 44, 44, 14);
      ctx.fill();
    }

    // hud
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = COLORS.cream;
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${scoreOf(run)}`, 14, 28);
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.fillText("SCORE", 14, 40);
    if (run.coins > 0) {
      ctx.textAlign = "right";
      ctx.fillStyle = COLORS.yellow;
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.fillText(`◎ ${run.coins}`, W - 14, 28);
    }
    ctx.restore();
  }, []);


  /* ---- loop ---- */
  const step = useCallback(
    (now: number) => {
      const run = runRef.current;
      // Clamp dt so a backgrounded tab can never teleport the player into a reed.
      const dt = Math.min((now - lastRef.current) / 1000, 1 / 30);
      lastRef.current = now;

      run.t += dt;
      run.speed = Math.min(MAX_SPEED, START_SPEED + run.t * 11);
      const dx = run.speed * dt;
      run.distance += dx;

      const wasAirborne = run.y < GROUND_Y - 0.5;
      run.vy += GRAVITY * dt;
      run.y += run.vy * dt;
      if (run.y >= GROUND_Y) {
        if (wasAirborne && run.vy > 260) burst(run, PLAYER_X, GROUND_Y + 10, 6, COLORS.cream);
        run.y = GROUND_Y;
        run.vy = 0;
        run.jumps = 0;
      }

      run.shake = Math.max(0, run.shake - dt * 22);

      run.pads = run.pads.map((p) => (p - dx * 0.6 < -40 ? p + W + 60 : p - dx * 0.6));

      run.nextObstacle -= dx;
      if (run.nextObstacle <= 0) {
        const isRock = Math.random() < 0.4;
        run.obstacles.push(
          isRock
            ? { x: W + 20, w: 34, h: 22, kind: "rock" }
            : { x: W + 20, w: 16, h: 34 + Math.random() * 24, kind: "reed" },
        );
        // Gap scales with speed so late-game spacing stays clearable with one hop.
        run.nextObstacle = run.speed * (1.15 + Math.random() * 0.7);
      }

      run.nextCoin -= dx;
      if (run.nextCoin <= 0) {
        run.coinsList.push({
          x: W + 20,
          y: GROUND_Y - 42 - Math.random() * 56,
          taken: false,
          spin: Math.random() * Math.PI,
        });
        run.nextCoin = 220 + Math.random() * 240;
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

      // collisions — a forgiving box tucked inside the sprite
      const pl = { x: PLAYER_X - 17, y: run.y - 34, w: 34, h: 40 };
      for (const ob of run.obstacles) {
        const oy = GROUND_Y + 10 - ob.h;
        if (pl.x < ob.x + ob.w - 3 && pl.x + pl.w > ob.x + 3 && pl.y + pl.h > oy + 3) {
          run.over = true;
          run.shake = 12;
          burst(run, PLAYER_X + 10, run.y - 12, 16, COLORS.pink);
          break;
        }
      }
      for (const coin of run.coinsList) {
        if (coin.taken) continue;
        if (Math.hypot(coin.x - PLAYER_X, coin.y - (run.y - 16)) < 28) {
          coin.taken = true;
          run.coins += 1;
          burst(run, coin.x, coin.y, 8, COLORS.yellow);
        }
      }

      draw(run);
      setScore(scoreOf(run));

      if (run.over) {
        const finalScore = scoreOf(run);
        setPhase("over");
        setBest((prev) => Math.max(prev, finalScore));
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(stepRef.current);
    },
    [draw],
  );

  stepRef.current = step;

  const start = useCallback(async () => {
    // Never leave a second loop running — that used to double the game speed.
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
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

  const jump = useCallback(() => {
    const run = runRef.current;
    if (phase === "idle" || phase === "over") {
      void start();
      return;
    }
    if (run.jumps < 2) {
      run.vy = JUMP_V * (run.jumps === 0 ? 1 : 0.86);
      run.jumps += 1;
      burst(run, PLAYER_X - 8, run.y + 6, run.jumps === 1 ? 5 : 8, COLORS.leaf);
    }
  }, [phase, start]);


  jumpRef.current = jump;

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
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.code !== "ArrowUp" && event.code !== "Enter") return;
      const target = event.target as HTMLElement | null;
      // Never hijack space from buttons, inputs or the rest of the page.
      if (target && target.closest("input, textarea, select, button, a, [contenteditable]")) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const box = canvas.getBoundingClientRect();
      const visible = box.bottom > 0 && box.top < window.innerHeight;
      if (!visible) return;
      event.preventDefault();
      jumpRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---- pause when the tab is hidden so nothing runs off-screen ---- */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!runRef.current.over && rafRef.current === null && phase === "playing") {
        lastRef.current = performance.now();
        rafRef.current = requestAnimationFrame(stepRef.current);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase]);

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
        },
      });
      if (!result.accepted) {
        setStatus(result.reason ?? "Score was not accepted.");
      } else {
        nonceRef.current = null;
        setStatus(
          result.rank
            ? `Locked in. Season best ${result.bestScore} — currently #${result.rank}.`
            : `Locked in. Season best ${result.bestScore}.`,
        );
        setBoard(await refreshBoard({}));
      }
    } catch {
      setStatus("Signing was cancelled or failed.");
    } finally {
      setBusy(false);
    }
  }, [refreshBoard, sendScore, wallet]);

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
      <div className="rounded-2xl bg-card p-4 pop-static">
        <div
          className="game-frame"
          style={{ ["--game-frame-src" as string]: `url(${gameFrame})` }}
        >
          <div className="game-frame-screen">
            <div
              role="button"
              tabIndex={0}
              aria-label="Play Lily Pad Leap. Tap or press space to hop."
              onPointerDown={(event) => {
                event.preventDefault();
                jump();
              }}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  jump();
                }
              }}
              className="relative block h-full w-auto max-w-full touch-none select-none overflow-hidden rounded-xl border-[3px] border-charcoal max-sm:h-auto max-sm:w-full"
              style={{ aspectRatio: `${W} / ${H}` }}
            >
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="block h-full w-full bg-ivy"
                style={{ imageRendering: "auto" }}
              />
              {phase !== "playing" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ivy/80 p-3 text-center text-cream">
                  <p className="font-display text-2xl">
                    {phase === "idle" ? "Lily Pad Leap" : "Splash!"}
                  </p>
                  <p className="max-w-xs text-sm opacity-90">
                    {phase === "idle"
                      ? "Hop across the pond. Dodge the reeds, scoop the $ivy coins."
                      : `You scored ${score}. Best this visit: ${best}.`}
                  </p>
                  <span className="rounded-full bg-frog px-4 py-2 font-display text-sm text-charcoal pop-static">
                    {phase === "idle" ? "Tap / press space to start" : "Tap to hop again"}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>


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
            onClick={() => void start()}
            variant="outline"
            className="min-h-11 rounded-full border-[3px] border-charcoal bg-card px-4 font-display text-charcoal"
          >
            {phase === "playing" ? "Restart" : "Play"}
          </Button>
        </div>
        {status ? <p className="mt-2 text-sm text-charcoal/85">{status}</p> : null}
        <p className="mt-2 text-xs text-charcoal/70">
          Signing is a free, read-only message. It proves the wallet is yours — it never approves a
          transaction and never touches your funds.
        </p>
      </div>

      <div className="rounded-2xl bg-card p-4 pop-static">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl text-charcoal">Pond Court · {board.seasonLabel}</h3>
          <span className="inline-flex items-center rounded-full bg-yellow px-3 py-1 text-xs font-bold normal-case text-charcoal pop-static">
            #1 wins {board.prizeTokens.toLocaleString("en-US")} $ivy
          </span>
        </div>
        <p className="mt-1 text-sm text-charcoal/80">
          Monthly board. It resets on {resetDate} (UTC) and the top wallet is airdropped 50,000 $ivy.
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
                <span className="font-mono text-sm text-charcoal">{shortWallet(entry.wallet)}</span>
                <span className="ml-auto font-display text-base text-charcoal">{entry.score}</span>
              </li>
            ))
          )}
        </ol>

        {board.allTime.length > 0 ? (
          <div className="mt-5">
            <h4 className="font-display text-sm uppercase text-charcoal/70">All-time hall of hops</h4>
            <ul className="mt-2 space-y-1">
              {board.allTime.slice(0, 5).map((entry) => (
                <li key={`all-${entry.wallet}`} className="flex justify-between text-sm text-charcoal/85">
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
