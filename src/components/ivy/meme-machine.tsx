import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CuratedPost } from "@/types/curated";
import { CrownDoodle, FrogDoodle, PawDoodle } from "@/components/ivy/doodles";

/**
 * Ivy Meme Machine.
 *
 * Templates are the official platform poster images of Ivy's own curated posts
 * (TikTok's oEmbed thumbnails) — no stock dogs, no generated Ivy, nothing
 * re-hosted. Posters are loaded through the same-origin proxy so the browser
 * can export the finished meme, and every meme keeps a link back to the
 * original official post.
 */

const SIZE = 1080;

type StickerKind =
  | "frogHat"
  | "crown"
  | "shades"
  | "tongue"
  | "lily"
  | "chain"
  | "party"
  | "sparkle"
  | "paw"
  | "ribbit";

interface StickerDef {
  kind: StickerKind;
  label: string;
  emojiHint: string;
  defaultScale: number;
}

const STICKERS: StickerDef[] = [
  { kind: "frogHat", label: "Frog hat", emojiHint: "The signature lid", defaultScale: 1.15 },
  { kind: "crown", label: "Queen crown", emojiHint: "Short spine royalty", defaultScale: 1 },
  { kind: "shades", label: "Cool shades", emojiHint: "Vibing mode", defaultScale: 0.9 },
  { kind: "tongue", label: "Blep", emojiHint: "Tongue out", defaultScale: 0.6 },
  { kind: "lily", label: "Lily pad", emojiHint: "Pond furniture", defaultScale: 1.1 },
  { kind: "chain", label: "$ivy chain", emojiHint: "Degen drip", defaultScale: 1 },
  { kind: "party", label: "Party hat", emojiHint: "Launch day", defaultScale: 0.9 },
  { kind: "sparkle", label: "Sparkles", emojiHint: "Main character", defaultScale: 0.8 },
  { kind: "paw", label: "Paw print", emojiHint: "Ivy was here", defaultScale: 0.7 },
  { kind: "ribbit", label: "Ribbit bubble", emojiHint: "She speaks frog", defaultScale: 1.1 },
];

interface PlacedSticker {
  id: number;
  kind: StickerKind;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flip: boolean;
}

const BRAND = {
  frog: "#83D94E",
  ivy: "#174F36",
  cream: "#FFF8E7",
  charcoal: "#151515",
  pink: "#FF8EAE",
  leaf: "#C9F39B",
  lavender: "#C7B8FF",
  yellow: "#FFD86B",
};

/* ------------------------------------------------------------------ */
/* Sticker artwork — plain vector shapes drawn in a 200x200 unit space  */
/* ------------------------------------------------------------------ */

function ink(ctx: CanvasRenderingContext2D, width = 8) {
  ctx.lineWidth = width;
  ctx.strokeStyle = BRAND.charcoal;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
}

function fillStroke(ctx: CanvasRenderingContext2D, fill: string, width = 8) {
  ctx.fillStyle = fill;
  ctx.fill();
  ink(ctx, width);
  ctx.stroke();
}

function drawFrogHat(ctx: CanvasRenderingContext2D) {
  // dome
  ctx.beginPath();
  ctx.ellipse(0, 10, 92, 74, 0, Math.PI, 0);
  ctx.closePath();
  fillStroke(ctx, BRAND.frog, 9);
  // brim
  ctx.beginPath();
  ctx.ellipse(0, 12, 100, 22, 0, 0, Math.PI * 2);
  fillStroke(ctx, BRAND.leaf, 9);
  // eyes
  for (const dx of [-46, 46]) {
    ctx.beginPath();
    ctx.arc(dx, -56, 34, 0, Math.PI * 2);
    fillStroke(ctx, BRAND.cream, 9);
    ctx.beginPath();
    ctx.arc(dx, -52, 15, 0, Math.PI * 2);
    ctx.fillStyle = BRAND.charcoal;
    ctx.fill();
  }
}

function drawCrown(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(-95, 55);
  ctx.lineTo(-95, -45);
  ctx.lineTo(-45, 5);
  ctx.lineTo(0, -65);
  ctx.lineTo(45, 5);
  ctx.lineTo(95, -45);
  ctx.lineTo(95, 55);
  ctx.closePath();
  fillStroke(ctx, BRAND.yellow, 9);
  for (const dx of [-60, 0, 60]) {
    ctx.beginPath();
    ctx.arc(dx, 30, 11, 0, Math.PI * 2);
    fillStroke(ctx, BRAND.pink, 6);
  }
}

function drawShades(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(-110, -18);
  ctx.lineTo(110, -18);
  ctx.lineWidth = 12;
  ctx.strokeStyle = BRAND.charcoal;
  ctx.stroke();
  for (const dx of [-58, 58]) {
    ctx.beginPath();
    ctx.roundRect(dx - 52, -22, 104, 66, 18);
    fillStroke(ctx, BRAND.charcoal, 10);
    ctx.beginPath();
    ctx.moveTo(dx - 34, 34);
    ctx.lineTo(dx + 22, -12);
    ctx.lineWidth = 9;
    ctx.strokeStyle = "rgba(255,248,231,0.65)";
    ctx.stroke();
  }
}

function drawTongue(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.roundRect(-42, -30, 84, 110, [20, 20, 44, 44]);
  fillStroke(ctx, BRAND.pink, 9);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(0, 60);
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(21,21,21,0.45)";
  ctx.stroke();
}

function drawLily(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(0, 0, 96, 0.35, Math.PI * 2 - 0.35);
  ctx.lineTo(0, 0);
  ctx.closePath();
  fillStroke(ctx, BRAND.frog, 9);
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0.5, Math.PI * 2 - 0.5);
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(23,79,54,0.55)";
  ctx.stroke();
  // lotus
  for (const angle of [-0.5, 0, 0.5]) {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -46, 18, 30, 0, 0, Math.PI * 2);
    fillStroke(ctx, BRAND.pink, 6);
    ctx.restore();
  }
}

function drawChain(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(0, -30, 86, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.lineWidth = 16;
  ctx.strokeStyle = BRAND.yellow;
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = BRAND.charcoal;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-52, 32, 104, 62, 16);
  fillStroke(ctx, BRAND.yellow, 8);
  ctx.fillStyle = BRAND.charcoal;
  ctx.font = "800 42px 'Bricolage Grotesque', Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$ivy", 0, 65);
}

function drawParty(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(0, -100);
  ctx.lineTo(62, 62);
  ctx.lineTo(-62, 62);
  ctx.closePath();
  fillStroke(ctx, BRAND.lavender, 9);
  for (const [dx, dy] of [
    [-18, 20],
    [20, -6],
    [-4, -44],
  ] as const) {
    ctx.beginPath();
    ctx.arc(dx, dy, 12, 0, Math.PI * 2);
    fillStroke(ctx, BRAND.pink, 5);
  }
  ctx.beginPath();
  ctx.arc(0, -104, 18, 0, Math.PI * 2);
  fillStroke(ctx, BRAND.yellow, 7);
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI / 4) * i;
    const radius = i % 2 === 0 ? r : r * 0.32;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawSparkle(ctx: CanvasRenderingContext2D) {
  star(ctx, 0, -10, 74);
  fillStroke(ctx, BRAND.yellow, 8);
  star(ctx, 62, 58, 34);
  fillStroke(ctx, BRAND.cream, 6);
  star(ctx, -68, 48, 26);
  fillStroke(ctx, BRAND.pink, 6);
}

function drawPaw(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.ellipse(0, 34, 58, 46, 0, 0, Math.PI * 2);
  fillStroke(ctx, BRAND.cream, 8);
  for (const [dx, dy, rx] of [
    [-56, -30, 22],
    [-20, -56, 22],
    [20, -56, 22],
    [56, -30, 22],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(dx, dy, rx, 26, 0, 0, Math.PI * 2);
    fillStroke(ctx, BRAND.cream, 8);
  }
}

function drawRibbit(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.roundRect(-110, -70, 220, 110, 34);
  fillStroke(ctx, BRAND.cream, 9);
  ctx.beginPath();
  ctx.moveTo(-30, 38);
  ctx.lineTo(-6, 84);
  ctx.lineTo(16, 38);
  ctx.closePath();
  fillStroke(ctx, BRAND.cream, 9);
  ctx.fillStyle = BRAND.ivy;
  ctx.font = "800 56px 'Bricolage Grotesque', Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ribbit", 0, -14);
}

const STICKER_PAINTERS: Record<StickerKind, (ctx: CanvasRenderingContext2D) => void> = {
  frogHat: drawFrogHat,
  crown: drawCrown,
  shades: drawShades,
  tongue: drawTongue,
  lily: drawLily,
  chain: drawChain,
  party: drawParty,
  sparkle: drawSparkle,
  paw: drawPaw,
  ribbit: drawRibbit,
};

/** Small preview of a sticker for the palette buttons. */
function StickerPreview({ kind }: { kind: StickerKind }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = 72 * dpr;
    canvas.height = 72 * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 72, 72);
    ctx.save();
    ctx.translate(36, 38);
    ctx.scale(0.26, 0.26);
    STICKER_PAINTERS[kind](ctx);
    ctx.restore();
  }, [kind]);
  return <canvas ref={ref} style={{ width: 72, height: 72 }} aria-hidden />;
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

function proxied(url: string): string {
  return `/api/public/meme-image?src=${encodeURIComponent(url)}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export interface MemeTemplate {
  id: string;
  label: string;
  imageUrl: string;
  postUrl: string;
  platformLabel: string;
}

/** Builds the template list from the curated official posts that have a poster. */
export function memeTemplates(posts: CuratedPost[]): MemeTemplate[] {
  return posts
    .filter((post) => Boolean(post.thumbnailUrl))
    .map((post, index) => ({
      id: post.id,
      label: post.adminLabel?.trim() || `Ivy classic #${index + 1}`,
      imageUrl: post.thumbnailUrl as string,
      postUrl: post.originalPostUrl,
      platformLabel: post.platform === "tiktok" ? "TikTok" : "Instagram",
    }));
}

export function MemeMachine({ templates }: { templates: MemeTemplate[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const nextId = useRef(1);
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null);

  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [topText, setTopText] = useState("short spine");
  const [bottomText, setBottomText] = useState("big vibes");
  const [placed, setPlaced] = useState<PlacedSticker[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const template = useMemo(
    () => templates.find((item) => item.id === templateId) ?? templates[0] ?? null,
    [templates, templateId],
  );
  const selected = placed.find((sticker) => sticker.id === selectedId) ?? null;

  // Load the chosen poster through the same-origin proxy so export stays allowed.
  useEffect(() => {
    if (!template) return;
    let cancelled = false;
    setImageReady(false);
    setImageFailed(false);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      imageRef.current = image;
      setImageReady(true);
    };
    image.onerror = () => {
      if (cancelled) return;
      imageRef.current = null;
      setImageFailed(true);
    };
    image.src = proxied(template.imageUrl);
    return () => {
      cancelled = true;
    };
  }, [template]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Backdrop
    const gradient = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    gradient.addColorStop(0, BRAND.ivy);
    gradient.addColorStop(1, "#0f3524");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const image = imageRef.current;
    if (image && imageReady) {
      const ratio = Math.max(SIZE / image.width, SIZE / image.height);
      const w = image.width * ratio;
      const h = image.height * ratio;
      ctx.drawImage(image, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
    } else {
      ctx.fillStyle = "rgba(255,248,231,0.16)";
      for (let i = -SIZE; i < SIZE * 2; i += 96) {
        ctx.save();
        ctx.translate(i, 0);
        ctx.rotate(0.5);
        ctx.fillRect(0, -SIZE, 34, SIZE * 3);
        ctx.restore();
      }
    }

    // Stickers
    for (const sticker of placed) {
      ctx.save();
      ctx.translate(sticker.x, sticker.y);
      ctx.rotate((sticker.rotation * Math.PI) / 180);
      ctx.scale(sticker.flip ? -sticker.scale : sticker.scale, sticker.scale);
      STICKER_PAINTERS[sticker.kind](ctx);
      ctx.restore();
      if (sticker.id === selectedId) {
        ctx.save();
        ctx.strokeStyle = BRAND.frog;
        ctx.setLineDash([16, 12]);
        ctx.lineWidth = 5;
        const r = 120 * sticker.scale;
        ctx.strokeRect(sticker.x - r, sticker.y - r, r * 2, r * 2);
        ctx.restore();
      }
    }

    // Meme text
    const drawBand = (text: string, position: "top" | "bottom") => {
      const value = text.trim();
      if (!value) return;
      ctx.font = "800 92px 'Bricolage Grotesque', Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = wrapLines(ctx, value.toLowerCase(), SIZE - 120);
      const lineHeight = 100;
      lines.forEach((line, index) => {
        const y =
          position === "top"
            ? 96 + index * lineHeight
            : SIZE - 96 - (lines.length - 1 - index) * lineHeight;
        ctx.lineWidth = 20;
        ctx.strokeStyle = BRAND.charcoal;
        ctx.lineJoin = "round";
        ctx.strokeText(line, SIZE / 2, y);
        ctx.fillStyle = BRAND.cream;
        ctx.fillText(line, SIZE / 2, y);
      });
    };
    drawBand(topText, "top");
    drawBand(bottomText, "bottom");

    // Watermark
    ctx.font = "800 34px 'Bricolage Grotesque', Trebuchet MS, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,248,231,0.82)";
    ctx.fillText("ivyvibing.com · $ivy", SIZE - 28, SIZE - 26);
    ctx.restore();
  }, [imageReady, placed, selectedId, topText, bottomText]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw once the display font is ready so canvas text matches the site.
  useEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(() => draw()).catch(() => undefined);
  }, [draw]);

  const toCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * SIZE,
      y: ((event.clientY - rect.top) / rect.height) * SIZE,
    };
  };

  const addSticker = (def: StickerDef) => {
    const id = nextId.current++;
    setPlaced((current) => [
      ...current,
      {
        id,
        kind: def.kind,
        x: SIZE / 2 + (Math.random() - 0.5) * 160,
        y: SIZE / 2 + (Math.random() - 0.5) * 160,
        scale: def.defaultScale,
        rotation: 0,
        flip: false,
      },
    ]);
    setSelectedId(id);
    setStatus(`${def.label} added — drag it onto Ivy.`);
  };

  const updateSelected = (patch: Partial<PlacedSticker>) => {
    if (selectedId == null) return;
    setPlaced((current) =>
      current.map((sticker) => (sticker.id === selectedId ? { ...sticker, ...patch } : sticker)),
    );
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = toCanvasPoint(event);
    const hit = [...placed]
      .reverse()
      .find(
        (sticker) =>
          Math.abs(point.x - sticker.x) < 120 * sticker.scale &&
          Math.abs(point.y - sticker.y) < 120 * sticker.scale,
      );
    if (!hit) {
      setSelectedId(null);
      return;
    }
    setSelectedId(hit.id);
    dragRef.current = { id: hit.id, dx: point.x - hit.x, dy: point.y - hit.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    event.preventDefault();
    const point = toCanvasPoint(event);
    setPlaced((current) =>
      current.map((sticker) =>
        sticker.id === drag.id
          ? {
              ...sticker,
              x: Math.max(0, Math.min(SIZE, point.x - drag.dx)),
              y: Math.max(0, Math.min(SIZE, point.y - drag.dy)),
            }
          : sticker,
      ),
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSelectedId(null);
    requestAnimationFrame(() => {
      canvas.toBlob((blob) => {
        if (!blob) {
          setStatus("The export did not go through — try again.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "ivy-meme.png";
        link.click();
        URL.revokeObjectURL(url);
        setStatus("Saved. Post it and tag @ivyvibing.");
      }, "image/png");
    });
  };

  if (!template) {
    return (
      <div className="rounded-2xl bg-card p-6 pop-static">
        <p className="font-display text-lg text-charcoal">The meme machine is warming up</p>
        <p className="mt-2 text-sm text-charcoal/80">
          Official post posters are refreshing. Give it a moment and reload.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Canvas */}
      <div className="rounded-2xl bg-card p-4 pop-static">
        <div className="relative overflow-hidden rounded-xl ink-border bg-ivy">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="block w-full touch-none select-none"
            style={{ aspectRatio: "1 / 1" }}
            aria-label="Meme canvas — drag stickers onto Ivy"
          />
          {!imageReady && !imageFailed ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-charcoal/70 px-4 py-2 font-display text-sm text-cream">
                loading Ivy…
              </span>
            </div>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={download}
            className="inline-flex min-h-11 items-center rounded-full bg-frog px-5 font-display text-charcoal pop-static transition-transform hover:-translate-y-0.5"
          >
            Download meme
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaced([]);
              setSelectedId(null);
              setStatus("Cleared. Fresh pad.");
            }}
            className="inline-flex min-h-11 items-center rounded-full bg-lavender px-5 font-display text-charcoal pop-static transition-transform hover:-translate-y-0.5"
          >
            Clear stickers
          </button>
          <a
            href={template.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-charcoal/80 underline underline-offset-4"
          >
            Original {template.platformLabel} post
          </a>
        </div>
        <p aria-live="polite" className="mt-2 min-h-5 text-sm text-charcoal/75">
          {imageFailed
            ? "That poster is refreshing on the platform — pick another photo."
            : (status ?? "Tap a sticker, then drag it around the canvas.")}
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-card p-4 pop-static">
          <p className="font-display text-base text-charcoal">Caption</p>
          <label className="mt-2 block text-sm text-charcoal/80" htmlFor="meme-top">
            Top line
          </label>
          <input
            id="meme-top"
            value={topText}
            maxLength={60}
            onChange={(event) => setTopText(event.target.value)}
            className="mt-1 w-full rounded-full border-2 border-charcoal/70 bg-cream px-4 py-2 text-charcoal"
          />
          <label className="mt-3 block text-sm text-charcoal/80" htmlFor="meme-bottom">
            Bottom line
          </label>
          <input
            id="meme-bottom"
            value={bottomText}
            maxLength={60}
            onChange={(event) => setBottomText(event.target.value)}
            className="mt-1 w-full rounded-full border-2 border-charcoal/70 bg-cream px-4 py-2 text-charcoal"
          />
        </div>

        <div className="rounded-2xl bg-card p-4 pop-static">
          <p className="font-display text-base text-charcoal">Frog fits & vibing attire</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {STICKERS.map((def) => (
              <button
                key={def.kind}
                type="button"
                onClick={() => addSticker(def)}
                title={def.emojiHint}
                className="flex flex-col items-center gap-1 rounded-xl bg-leaf p-2 ink-border transition-transform hover:-translate-y-0.5"
              >
                <StickerPreview kind={def.kind} />
                <span className="text-[11px] leading-tight font-semibold text-charcoal">
                  {def.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4 pop-static">
          <p className="font-display text-base text-charcoal">Selected sticker</p>
          {selected ? (
            <div className="mt-2 space-y-3">
              <label className="block text-sm text-charcoal/80">
                Size
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.05}
                  value={selected.scale}
                  onChange={(event) => updateSelected({ scale: Number(event.target.value) })}
                  className="mt-1 w-full accent-frog"
                />
              </label>
              <label className="block text-sm text-charcoal/80">
                Rotation
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={selected.rotation}
                  onChange={(event) => updateSelected({ rotation: Number(event.target.value) })}
                  className="mt-1 w-full accent-frog"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateSelected({ flip: !selected.flip })}
                  className="min-h-10 rounded-full bg-yellow px-4 font-display text-sm text-charcoal ink-border"
                >
                  Flip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlaced((current) =>
                      current.filter((sticker) => sticker.id !== selected.id),
                    );
                    setSelectedId(null);
                  }}
                  className="min-h-10 rounded-full bg-pink px-4 font-display text-sm text-charcoal ink-border"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-charcoal/75">
              Add a sticker, or tap one on the canvas to resize, spin and flip it.
            </p>
          )}
        </div>
      </div>

      {/* Template rail */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl bg-card p-4 pop-static">
          <div className="flex items-center gap-2">
            <FrogDoodle className="h-7 w-9 text-frog float-slow" />
            <p className="font-display text-base text-charcoal">Ivy's greatest hits</p>
            <CrownDoodle className="h-5 w-8 text-yellow wiggle" />
          </div>
          <p className="mt-1 text-sm text-charcoal/80">
            Official posters straight from Ivy's own posts. Pick your canvas.
          </p>
          <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {templates.map((item) => (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setTemplateId(item.id)}
                  aria-pressed={item.id === template.id}
                  className={cn(
                    "block overflow-hidden rounded-xl ink-border transition-transform hover:-translate-y-0.5",
                    item.id === template.id ? "ring-4 ring-frog" : "opacity-90",
                  )}
                >
                  <img
                    src={proxied(item.imageUrl)}
                    alt={`Official Ivy post: ${item.label}`}
                    loading="lazy"
                    decoding="async"
                    className="h-24 w-24 object-cover sm:h-28 sm:w-28"
                  />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-center gap-2 text-xs text-charcoal/70">
            <PawDoodle className="h-4 w-4 text-charcoal/70" />
            Memes are made in your browser. Nothing is uploaded, and every photo links back to
            Ivy's official post.
          </p>
        </div>
      </div>
    </div>
  );
}
