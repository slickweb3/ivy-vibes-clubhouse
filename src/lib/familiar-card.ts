/**
 * Draws a familiar card onto a canvas — the shareable, mint-ready artefact.
 *
 * The card is deliberately built like a real printed trading card: paper stock
 * with visible grain and a deckle edge, a portrait window holding Ivy's own
 * artwork, a stat block, two printed moves, and a footer carrying the set,
 * print number and re-derivable sigil. Rare tiers get holographic foil — real
 * angled rainbow bands laid into the pixels, not a sticker.
 *
 * Browser-only; call from an effect. The portrait is served from the site's own
 * origin, so the canvas is never tainted and the card always saves as a PNG.
 */

import type { Familiar } from "@/lib/familiar";
import { rarityRing } from "@/lib/familiar";

export const CARD_W = 1080;
export const CARD_H = 1512;

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

const SERIF = "Georgia, 'Times New Roman', serif";

/** Layout constants — one source of truth so nothing ever overlaps. */
const PAD = 48;
const ART_X = PAD + 40;
const ART_Y = 268;
const ART_W = CARD_W - (PAD + 40) * 2;
const ART_H = 620;

export function drawFamiliarCard(
  canvas: HTMLCanvasElement,
  familiar: Familiar,
  portrait?: HTMLImageElement | null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const { palette } = familiar;
  const ring = rarityRing(familiar.rarity);
  const rnd = seededRandoms(familiar.seedKey, 320);

  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.textBaseline = "alphabetic";

  // ---- card stock ----------------------------------------------------
  drawPaper(ctx, rnd);

  // ---- outer rarity border ------------------------------------------
  ctx.save();
  rounded(ctx, PAD * 0.55, PAD * 0.55, CARD_W - PAD * 1.1, CARD_H - PAD * 1.1, 44);
  ctx.clip();
  const borderGrad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  borderGrad.addColorStop(0, ring);
  borderGrad.addColorStop(0.5, palette.auraDeep);
  borderGrad.addColorStop(1, ring);
  ctx.fillStyle = borderGrad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  if (familiar.foil) drawFoil(ctx, 0, 0, CARD_W, CARD_H, familiar.prismatic ? 0.5 : 0.3, rnd);
  ctx.restore();

  // inner paper panel
  ctx.save();
  rounded(ctx, PAD, PAD, CARD_W - PAD * 2, CARD_H - PAD * 2, 34);
  ctx.clip();
  drawPaper(ctx, rnd);
  ctx.restore();

  ctx.strokeStyle = "#15151522";
  ctx.lineWidth = 3;
  rounded(ctx, PAD, PAD, CARD_W - PAD * 2, CARD_H - PAD * 2, 34);
  ctx.stroke();

  // ---- header --------------------------------------------------------
  ctx.textAlign = "left";
  ctx.fillStyle = "#151515";
  ctx.font = `700 62px ${SERIF}`;
  ctx.fillText(fit(ctx, familiar.name, CARD_W - PAD * 2 - 250), PAD + 40, PAD + 96);

  ctx.font = `italic 30px ${SERIF}`;
  ctx.fillStyle = "#151515b3";
  ctx.fillText(fit(ctx, familiar.title, CARD_W - PAD * 2 - 250), PAD + 42, PAD + 140);

  // power orb, top-right
  const orbX = CARD_W - PAD - 106;
  const orbY = PAD + 104;
  ctx.save();
  ellipse(ctx, orbX, orbY, 68, 68);
  ctx.fillStyle = palette.auraDeep;
  ctx.fill();
  ctx.clip();
  if (familiar.foil) drawFoil(ctx, orbX - 70, orbY - 70, 140, 140, 0.55, rnd);
  ctx.restore();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 7;
  ellipse(ctx, orbX, orbY, 68, 68);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFF8E7";
  ctx.font = `700 54px ${SERIF}`;
  ctx.fillText(String(familiar.power), orbX, orbY + 12);
  ctx.font = `600 17px ${SERIF}`;
  ctx.fillText("POWER", orbX, orbY + 42);

  // rarity ribbon
  ctx.textAlign = "left";
  const label = familiar.prismatic
    ? `PRISMATIC · ${familiar.rarity.toUpperCase()}`
    : familiar.foil
      ? `HOLO · ${familiar.rarity.toUpperCase()}`
      : familiar.rarity.toUpperCase();
  ctx.font = `700 26px ${SERIF}`;
  const ribbonW = Math.min(ctx.measureText(label).width + 56, CARD_W - PAD * 2 - 260);
  ctx.save();
  rounded(ctx, PAD + 40, PAD + 164, ribbonW, 56, 28);
  ctx.clip();
  ctx.fillStyle = ring;
  ctx.fillRect(PAD + 40, PAD + 164, ribbonW, 56);
  if (familiar.foil) drawFoil(ctx, PAD + 40, PAD + 164, ribbonW, 56, 0.5, rnd);
  ctx.restore();
  ctx.fillStyle = "#151515";
  ctx.fillText(label, PAD + 40 + 28, PAD + 202);

  // ---- portrait window ----------------------------------------------
  ctx.save();
  rounded(ctx, ART_X, ART_Y, ART_W, ART_H, 26);
  ctx.clip();

  // pond backdrop, tinted by the familiar's palette
  const bg = ctx.createLinearGradient(ART_X, ART_Y, ART_X + ART_W, ART_Y + ART_H);
  bg.addColorStop(0, palette.aura);
  bg.addColorStop(0.55, palette.skin);
  bg.addColorStop(1, palette.auraDeep);
  ctx.fillStyle = bg;
  ctx.fillRect(ART_X, ART_Y, ART_W, ART_H);

  // sun rays
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#FFF8E7";
  for (let i = 0; i < 9; i += 1) {
    ctx.save();
    ctx.translate(ART_X + ART_W * 0.5, ART_Y - 120);
    ctx.rotate((i - 4) * 0.16);
    ctx.fillRect(-26, 0, 52, ART_H + 260);
    ctx.restore();
  }
  ctx.restore();

  // drifting pads behind the subject
  for (let i = 0; i < 10; i += 1) {
    const x = ART_X + 40 + rnd[i]! * (ART_W - 80);
    const y = ART_Y + 60 + rnd[i + 10]! * (ART_H - 120);
    const r = 24 + rnd[i + 20]! * 54;
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = palette.auraDeep;
    ellipse(ctx, x, y, r, r * 0.68);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Ivy's artwork. Multiply keeps the sticker's pale backing transparent-ish
  // so she sits inside the pond wash instead of on a white square.
  if (portrait && portrait.complete && portrait.naturalWidth > 0) {
    const scale = Math.max(ART_W / portrait.naturalWidth, ART_H / portrait.naturalHeight) * 1.02;
    const w = portrait.naturalWidth * scale;
    const h = portrait.naturalHeight * scale;
    const x = ART_X + (ART_W - w) / 2;
    const y = ART_Y + (ART_H - h) / 2;
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(portrait, x, y, w, h);
    ctx.restore();
  }

  // vignette so the subject reads against the frame
  const vig = ctx.createRadialGradient(
    ART_X + ART_W / 2,
    ART_Y + ART_H / 2,
    ART_H * 0.28,
    ART_X + ART_W / 2,
    ART_Y + ART_H / 2,
    ART_H * 0.86,
  );
  vig.addColorStop(0, "#00000000");
  vig.addColorStop(1, `${palette.auraDeep}88`);
  ctx.fillStyle = vig;
  ctx.fillRect(ART_X, ART_Y, ART_W, ART_H);

  // foil over the artwork — the tell that a card is rare
  if (familiar.foil) drawFoil(ctx, ART_X, ART_Y, ART_W, ART_H, familiar.prismatic ? 0.42 : 0.26, rnd);

  // sparkle dust for the top tier
  if (familiar.prismatic) {
    for (let i = 0; i < 46; i += 1) {
      const x = ART_X + rnd[i + 40]! * ART_W;
      const y = ART_Y + rnd[i + 90]! * ART_H;
      const r = 2 + rnd[i + 140]! * 5;
      ctx.globalAlpha = 0.35 + rnd[i + 190]! * 0.5;
      ctx.fillStyle = "#FFF8E7";
      ellipse(ctx, x, y, r, r);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // portrait frame
  ctx.strokeStyle = ring;
  ctx.lineWidth = 10;
  rounded(ctx, ART_X, ART_Y, ART_W, ART_H, 26);
  ctx.stroke();
  ctx.strokeStyle = "#15151533";
  ctx.lineWidth = 3;
  rounded(ctx, ART_X + 12, ART_Y + 12, ART_W - 24, ART_H - 24, 18);
  ctx.stroke();

  // biome caption tab
  ctx.font = `600 24px ${SERIF}`;
  const biomeW = ctx.measureText(familiar.biome).width + 44;
  ctx.fillStyle = "#FFF8E7";
  rounded(ctx, ART_X + 20, ART_Y + ART_H - 58, biomeW, 44, 22);
  ctx.fill();
  ctx.strokeStyle = "#15151522";
  ctx.lineWidth = 2;
  rounded(ctx, ART_X + 20, ART_Y + ART_H - 58, biomeW, 44, 22);
  ctx.stroke();
  ctx.fillStyle = "#151515";
  ctx.textAlign = "left";
  ctx.fillText(familiar.biome, ART_X + 42, ART_Y + ART_H - 27);

  // ---- stat block ----------------------------------------------------
  const statY = ART_Y + ART_H + 40;
  const statW = (ART_W - 36) / 2;
  familiar.stats.forEach((stat, i) => {
    const x = ART_X + (i % 2) * (statW + 36);
    const y = statY + Math.floor(i / 2) * 84;
    ctx.fillStyle = "#15151510";
    rounded(ctx, x, y, statW, 68, 20);
    ctx.fill();
    ctx.fillStyle = "#151515";
    ctx.font = `600 24px ${SERIF}`;
    ctx.textAlign = "left";
    ctx.fillText(stat.label.toUpperCase(), x + 20, y + 30);
    // meter
    const barX = x + 20;
    const barY = y + 44;
    const barW = statW - 92;
    ctx.fillStyle = "#15151520";
    rounded(ctx, barX, barY, barW, 12, 6);
    ctx.fill();
    ctx.fillStyle = ring;
    rounded(ctx, barX, barY, Math.max(10, (barW * stat.value) / 99), 12, 6);
    ctx.fill();
    ctx.textAlign = "right";
    ctx.font = `700 30px ${SERIF}`;
    ctx.fillStyle = "#151515";
    ctx.fillText(String(stat.value), x + statW - 20, y + 46);
  });

  // ---- moves ---------------------------------------------------------
  let moveY = statY + 190;
  ctx.textAlign = "left";
  familiar.moves.forEach((move) => {
    ctx.strokeStyle = "#15151520";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ART_X, moveY - 26);
    ctx.lineTo(ART_X + ART_W, moveY - 26);
    ctx.stroke();

    ctx.fillStyle = "#151515";
    ctx.font = `700 32px ${SERIF}`;
    // cost pips instead of emoji — canvas has no guaranteed emoji font
    const pips = Math.max(1, move.cost.length / 2);
    for (let p = 0; p < pips; p += 1) {
      ctx.fillStyle = p === 0 ? ring : `${ring}88`;
      ellipse(ctx, ART_X + 13 + p * 32, moveY, 12, 12);
      ctx.fill();
      ctx.strokeStyle = "#15151533";
      ctx.lineWidth = 2;
      ellipse(ctx, ART_X + 13 + p * 32, moveY, 12, 12);
      ctx.stroke();
    }
    ctx.fillStyle = "#151515";
    ctx.fillText(fit(ctx, move.name, ART_W - 200), ART_X + 20 + pips * 32, moveY + 12);
    ctx.textAlign = "right";
    ctx.font = `700 36px ${SERIF}`;
    ctx.fillText(String(move.power), ART_X + ART_W, moveY + 12);
    ctx.textAlign = "left";
    ctx.fillStyle = "#151515a8";
    ctx.font = `italic 24px ${SERIF}`;
    ctx.fillText(fit(ctx, move.effect, ART_W - 40), ART_X, moveY + 46);
    moveY += 108;
  });

  // ---- flavour + footer ---------------------------------------------
  ctx.fillStyle = "#15151518";
  rounded(ctx, ART_X, moveY - 24, ART_W, 86, 20);
  ctx.fill();
  ctx.fillStyle = "#151515c9";
  ctx.font = `italic 25px ${SERIF}`;
  const flavour = `“${familiar.blessing}”`;
  ctx.fillText(fit(ctx, flavour, ART_W - 44), ART_X + 22, moveY + 12);
  ctx.font = `600 22px ${SERIF}`;
  ctx.fillStyle = "#15151599";
  ctx.fillText(
    `Croaks in the key of “${familiar.croak.word}” · ${familiar.dogness}% dog / ${100 - familiar.dogness}% frog`,
    ART_X + 22,
    moveY + 46,
  );

  const footY = CARD_H - PAD - 44;
  ctx.font = `600 23px ${SERIF}`;
  ctx.fillStyle = "#151515aa";
  ctx.textAlign = "left";
  ctx.fillText(`${familiar.set}`, ART_X, footY);
  ctx.fillText(`ivyvibing.com · sigil ${familiar.sigil}`, ART_X, footY + 32);
  ctx.textAlign = "right";
  ctx.font = `700 30px ${SERIF}`;
  ctx.fillStyle = "#151515";
  ctx.fillText(`#${familiar.cardNumber} / ${familiar.cardTotal}`, ART_X + ART_W, footY);
  ctx.font = `600 22px ${SERIF}`;
  ctx.fillStyle = "#151515aa";
  ctx.fillText(`1 in ${familiar.oneIn} pulls`, ART_X + ART_W, footY + 32);

  // corner notches — the printed-card tell
  ctx.fillStyle = "#15151514";
  for (const [cx, cy] of [
    [PAD + 22, PAD + 22],
    [CARD_W - PAD - 22, PAD + 22],
    [PAD + 22, CARD_H - PAD - 22],
    [CARD_W - PAD - 22, CARD_H - PAD - 22],
  ] as const) {
    ellipse(ctx, cx, cy, 7, 7);
    ctx.fill();
  }
}

/** Cream paper stock with fibre grain and a faint deckle wash. */
function drawPaper(ctx: CanvasRenderingContext2D, rnd: number[]) {
  ctx.fillStyle = "#FFF8E7";
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const wash = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  wash.addColorStop(0, "#ffffff55");
  wash.addColorStop(0.5, "#f3e9cf55");
  wash.addColorStop(1, "#e9dcc055");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = "#151515";
  for (let i = 0; i < 260; i += 1) {
    const x = rnd[i % rnd.length]! * CARD_W;
    const y = rnd[(i * 7 + 13) % rnd.length]! * CARD_H;
    const w = 1 + rnd[(i * 3 + 5) % rnd.length]! * 26;
    ctx.fillRect(x, y, w, 1.4);
  }
  ctx.restore();
}

/**
 * Holographic foil: angled rainbow bands plus a diagonal light sweep, blended
 * so the paper and artwork still read through it.
 */
function drawFoil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  strength: number,
  rnd: number[],
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = strength;
  const bands = ctx.createLinearGradient(x, y + h, x + w, y);
  const hues = ["#FF8EAE", "#FFD86B", "#C9F39B", "#83D94E", "#C7B8FF", "#8ED6FF", "#FF8EAE"];
  hues.forEach((hue, i) => bands.addColorStop(i / (hues.length - 1), hue));
  ctx.fillStyle = bands;
  ctx.fillRect(x, y, w, h);

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = strength * 0.75;
  const sweep = ctx.createLinearGradient(x, y, x + w, y + h);
  sweep.addColorStop(0, "#ffffff00");
  sweep.addColorStop(0.42, "#ffffff00");
  sweep.addColorStop(0.5, "#ffffffcc");
  sweep.addColorStop(0.58, "#ffffff00");
  sweep.addColorStop(1, "#ffffff00");
  ctx.fillStyle = sweep;
  ctx.fillRect(x, y, w, h);

  // fine linear diffraction lines
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = strength * 0.7;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.4;
  for (let i = -h; i < w + h; i += 14) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i - h, y + h);
    ctx.stroke();
  }

  // scattered glints so no two cards foil identically
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 26; i += 1) {
    const gx = x + rnd[(i * 5 + 3) % rnd.length]! * w;
    const gy = y + rnd[(i * 11 + 7) % rnd.length]! * h;
    ctx.globalAlpha = strength * (0.2 + rnd[(i * 13) % rnd.length]! * 0.35);
    ctx.fillStyle = hues[i % hues.length]!;
    ellipse(ctx, gx, gy, 12 + rnd[(i * 3) % rnd.length]! * 34, 6 + rnd[(i * 9) % rnd.length]! * 16);
    ctx.fill();
  }
  ctx.restore();
}

/** Shrinks text with an ellipsis until it fits the given width. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 4 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return `${out}…`;
}
