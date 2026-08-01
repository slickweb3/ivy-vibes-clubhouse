/**
 * Draws a familiar onto a canvas — the shareable artefact.
 *
 * Everything is procedural (no image assets, nothing rehosted): shapes,
 * gradients and text driven purely by the familiar's traits, so each card is
 * unmistakably that creature's. Browser-only; call from an effect.
 */

import type { Familiar } from "@/lib/familiar";
import { rarityRing } from "@/lib/familiar";

export const CARD_W = 1080;
export const CARD_H = 1350;

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
}

function seededRandoms(key: string, count: number): number[] {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const out: number[] = [];
  let a = h >>> 0;
  for (let i = 0; i < count; i += 1) {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    out.push(((t ^ (t >>> 14)) >>> 0) / 4294967296);
  }
  return out;
}

export function drawFamiliarCard(canvas: HTMLCanvasElement, familiar: Familiar) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const { palette } = familiar;
  const ring = rarityRing(familiar.rarity);
  const rnd = seededRandoms(familiar.seedKey, 64);

  // ---- pond backdrop -------------------------------------------------
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, palette.auraDeep);
  bg.addColorStop(1, "#0C2E20");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const glow = ctx.createRadialGradient(CARD_W / 2, 560, 60, CARD_W / 2, 560, 620);
  glow.addColorStop(0, `${palette.aura}55`);
  glow.addColorStop(1, "#00000000");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Drifting pads
  for (let i = 0; i < 9; i += 1) {
    const x = 60 + rnd[i]! * (CARD_W - 120);
    const y = 120 + rnd[i + 9]! * (CARD_H - 260);
    const r = 26 + rnd[i + 18]! * 46;
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = palette.aura;
    ellipse(ctx, x, y, r, r * 0.72);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ---- frame ---------------------------------------------------------
  ctx.strokeStyle = ring;
  ctx.lineWidth = 14;
  rounded(ctx, 34, 34, CARD_W - 68, CARD_H - 68, 56);
  ctx.stroke();
  ctx.strokeStyle = "#FFF8E733";
  ctx.lineWidth = 4;
  rounded(ctx, 62, 62, CARD_W - 124, CARD_H - 124, 40);
  ctx.stroke();

  // ---- header --------------------------------------------------------
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFF8E7";
  ctx.font = "700 34px Georgia, 'Times New Roman', serif";
  ctx.fillText("IVY'S POND · FAMILIAR RECORD", CARD_W / 2, 132);

  ctx.fillStyle = ring;
  rounded(ctx, CARD_W / 2 - 210, 158, 420, 60, 30);
  ctx.fill();
  ctx.fillStyle = "#151515";
  ctx.font = "700 30px Georgia, 'Times New Roman', serif";
  ctx.fillText(familiar.rarity.toUpperCase(), CARD_W / 2, 198);

  // ---- the creature --------------------------------------------------
  const cx = CARD_W / 2;
  const cy = 620;
  const dog = familiar.dogness / 100;

  // shadow
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#04150E";
  ellipse(ctx, cx, cy + 250, 250, 44);
  ctx.fill();
  ctx.globalAlpha = 1;

  // body — squat and low, the short-spine silhouette
  ctx.fillStyle = palette.skinDark;
  ellipse(ctx, cx, cy + 170, 220, 118);
  ctx.fill();
  ctx.fillStyle = palette.belly;
  ellipse(ctx, cx, cy + 196, 132, 76);
  ctx.fill();

  // back legs
  ctx.fillStyle = palette.skinDark;
  ellipse(ctx, cx - 208, cy + 214, 62, 42);
  ctx.fill();
  ellipse(ctx, cx + 208, cy + 214, 62, 42);
  ctx.fill();

  // head
  ctx.fillStyle = palette.skin;
  ellipse(ctx, cx, cy, 200, 172);
  ctx.fill();

  // ears — frog nubs stretch into dog flops as dogness climbs.
  // Drawn on top of the head with a rim light so they never merge into the
  // silhouette (they are the visual tell for the dog/frog blend).
  const earLen = 130 + dog * 210;
  const earW = 60 + dog * 26;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * 168, cy - 132);
    ctx.rotate(-side * (0.5 + dog * 0.35));
    ctx.fillStyle = palette.skinDark;
    ellipse(ctx, 0, earLen / 2, earW, earLen / 2);
    ctx.fill();
    ctx.strokeStyle = palette.belly;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#FF8EAE";
    ctx.globalAlpha = 0.45;
    ellipse(ctx, 0, earLen / 2 + 8, earW * 0.42, earLen / 2 - 30);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // markings
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = palette.skinDark;
  for (let i = 0; i < 5; i += 1) {
    const px = cx - 150 + rnd[i + 27]! * 300;
    const py = cy - 90 + rnd[i + 32]! * 170;
    ellipse(ctx, px, py, 12 + rnd[i + 37]! * 20, 9 + rnd[i + 42]! * 14);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // eye bulges
  for (const side of [-1, 1]) {
    const ex = cx + side * 92;
    const ey = cy - 74;
    ctx.fillStyle = palette.skin;
    ellipse(ctx, ex, ey, 66, 62);
    ctx.fill();
    ctx.fillStyle = "#FFF8E7";
    ellipse(ctx, ex, ey, 46, 44);
    ctx.fill();
    ctx.fillStyle = "#151515";
    ellipse(ctx, ex + side * 6, ey + 6, 22, 26);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ellipse(ctx, ex + side * 0, ey - 10, 9, 9);
    ctx.fill();
    // sleepy lid, scaled by frogginess
    ctx.fillStyle = palette.skin;
    ellipse(ctx, ex, ey - 46 + (1 - dog) * 22, 48, 30);
    ctx.fill();
  }

  // snout + mouth
  ctx.fillStyle = palette.belly;
  ellipse(ctx, cx, cy + 62, 86 + dog * 30, 58);
  ctx.fill();
  ctx.strokeStyle = "#151515";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(cx, cy + 44, 74, 0.22 * Math.PI, 0.78 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "#151515";
  ellipse(ctx, cx, cy + 34, 15, 11);
  ctx.fill();

  drawHat(ctx, familiar.hat, cx, cy - 150, palette);

  // ---- name plate ----------------------------------------------------
  ctx.fillStyle = "#FFF8E7";
  ctx.font = "700 72px Georgia, 'Times New Roman', serif";
  ctx.fillText(familiar.name, cx, 950);
  ctx.fillStyle = palette.aura;
  ctx.font = "italic 36px Georgia, 'Times New Roman', serif";
  ctx.fillText(familiar.title, cx, 1000);

  // ---- trait strip ---------------------------------------------------
  const rows = [
    `${familiar.dogness}% dog · ${100 - familiar.dogness}% frog`,
    `croaks in the key of "${familiar.croak.word}"`,
    familiar.talent,
    `1 in ${familiar.oneIn} of the pond`,
  ];
  ctx.font = "500 32px Georgia, 'Times New Roman', serif";
  rows.forEach((row, i) => {
    const y = 1064 + i * 50;
    ctx.fillStyle = "#FFF8E7";
    ctx.globalAlpha = 0.92;
    ctx.fillText(row, cx, y);
    ctx.globalAlpha = 1;
  });

  // ---- footer --------------------------------------------------------
  ctx.fillStyle = ring;
  ctx.font = "700 30px Georgia, 'Times New Roman', serif";
  ctx.fillText("ivyvibing.com  ·  summoned for " + shortSeed(familiar.input), cx, CARD_H - 76);
}

function shortSeed(input: string): string {
  const clean = input.trim();
  if (clean.length <= 22) return clean;
  return `${clean.slice(0, 10)}…${clean.slice(-6)}`;
}

/**
 * Hats, drawn with shapes.
 *
 * Deliberately not emoji: canvas has no emoji font on many machines, so a
 * glyph hat can render as an empty box in the saved image. Shapes always work.
 */
function drawHat(
  ctx: CanvasRenderingContext2D,
  hat: string,
  x: number,
  y: number,
  palette: { skin: string; skinDark: string; belly: string; aura: string },
) {
  if (hat.includes("nothing")) return;
  ctx.save();
  ctx.lineJoin = "round";

  if (hat.includes("crown")) {
    ctx.fillStyle = "#FFD86B";
    ctx.beginPath();
    ctx.moveTo(x - 96, y + 54);
    ctx.lineTo(x - 96, y - 10);
    ctx.lineTo(x - 54, y + 22);
    ctx.lineTo(x - 6, y - 34);
    ctx.lineTo(x + 42, y + 22);
    ctx.lineTo(x + 96, y - 10);
    ctx.lineTo(x + 96, y + 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#FF8EAE";
    ellipse(ctx, x, y + 34, 14, 14);
    ctx.fill();
  } else if (hat.includes("leaf") || hat.includes("lily") || hat.includes("weed")) {
    ctx.fillStyle = "#83D94E";
    ctx.save();
    ctx.translate(x, y + 26);
    ctx.rotate(-0.22);
    ellipse(ctx, 0, 0, 104, 34);
    ctx.fill();
    ctx.strokeStyle = "#174F36";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-96, 0);
    ctx.lineTo(96, 0);
    ctx.stroke();
    ctx.restore();
  } else if (hat.includes("party")) {
    ctx.fillStyle = "#FF8EAE";
    ctx.beginPath();
    ctx.moveTo(x, y - 62);
    ctx.lineTo(x + 52, y + 54);
    ctx.lineTo(x - 52, y + 54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#FFD86B";
    ellipse(ctx, x, y - 66, 16, 16);
    ctx.fill();
  } else if (hat.includes("sunhat") || hat.includes("bucket")) {
    ctx.fillStyle = hat.includes("bucket") ? "#C7B8FF" : "#FFD86B";
    ellipse(ctx, x, y + 46, 138, 34);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + 44, 78, 62, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    if (hat.includes("bite")) {
      ctx.fillStyle = palette.aura;
      ellipse(ctx, x + 128, y + 46, 26, 22);
      ctx.fill();
    }
  } else if (hat.includes("beanie")) {
    ctx.fillStyle = "#FF8EAE";
    ctx.beginPath();
    ctx.ellipse(x, y + 44, 96, 74, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFF8E7";
    rounded(ctx, x - 104, y + 30, 208, 30, 15);
    ctx.fill();
  } else if (hat.includes("gnats")) {
    ctx.fillStyle = "#151515";
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      ellipse(ctx, x + Math.cos(a) * 96, y + 20 + Math.sin(a) * 28, 7, 7);
      ctx.fill();
    }
  } else {
    // the classic: a tiny frog perched on top
    ctx.fillStyle = "#83D94E";
    ellipse(ctx, x, y + 34, 52, 40);
    ctx.fill();
    ctx.fillStyle = "#FFF8E7";
    ellipse(ctx, x - 22, y + 14, 16, 16);
    ctx.fill();
    ellipse(ctx, x + 22, y + 14, 16, 16);
    ctx.fill();
    ctx.fillStyle = "#151515";
    ellipse(ctx, x - 22, y + 16, 7, 8);
    ctx.fill();
    ellipse(ctx, x + 22, y + 16, 7, 8);
    ctx.fill();
  }
  ctx.restore();
}
