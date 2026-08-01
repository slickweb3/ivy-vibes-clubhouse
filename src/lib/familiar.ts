/**
 * The Frog Familiar Foundry — deterministic pond-creature generator.
 *
 * Type anything (a name, a handle, a wallet you can read but never spend from)
 * and the pond hands back exactly one familiar for it, forever. Pure maths, no
 * network, no storage, nothing personal leaves the browser: the same input
 * always summons the same creature on every device, which is what makes a
 * familiar worth sharing.
 *
 * Pure data + pure functions only — safe on the server and in the browser.
 */

import { CROAKS, type Croak } from "@/lib/pond-vocabulary";

export interface FamiliarPalette {
  skin: string;
  skinDark: string;
  belly: string;
  aura: string;
  auraDeep: string;
  ink: string;
}

export interface FamiliarTrait {
  label: string;
  value: string;
}

export interface Familiar {
  /** The exact text that summoned it (trimmed, original case). */
  input: string;
  /** Normalised key — casing and spacing never change the creature. */
  seedKey: string;
  name: string;
  title: string;
  rarity: Rarity;
  /** 0-100, how much dog is in the frog. */
  dogness: number;
  palette: FamiliarPalette;
  hat: string;
  eyes: string;
  mark: string;
  aura: string;
  talent: string;
  croak: Croak;
  /** One warm line in Ivy's voice, assembled from the traits. */
  blessing: string;
  traits: FamiliarTrait[];
  /** 1-in-N: how rare this creature is, for bragging. */
  oneIn: number;
}

export type Rarity = "Pond Regular" | "Sunbather" | "Lily Noble" | "Royal Court" | "Frog Queen's Own";

const RARITY_TIERS: { rarity: Rarity; weight: number; oneIn: number; ring: string }[] = [
  { rarity: "Pond Regular", weight: 52, oneIn: 2, ring: "#83D94E" },
  { rarity: "Sunbather", weight: 27, oneIn: 4, ring: "#FFD86B" },
  { rarity: "Lily Noble", weight: 14, oneIn: 7, ring: "#FF8EAE" },
  { rarity: "Royal Court", weight: 6, oneIn: 17, ring: "#C7B8FF" },
  { rarity: "Frog Queen's Own", weight: 1, oneIn: 100, ring: "#FFF8E7" },
];

export function rarityRing(rarity: Rarity): string {
  return RARITY_TIERS.find((t) => t.rarity === rarity)?.ring ?? "#83D94E";
}

const SKINS: FamiliarPalette[] = [
  { skin: "#83D94E", skinDark: "#4E9E2C", belly: "#FFF8E7", aura: "#C9F39B", auraDeep: "#174F36", ink: "#151515" },
  { skin: "#C9F39B", skinDark: "#83D94E", belly: "#FFF8E7", aura: "#FFD86B", auraDeep: "#174F36", ink: "#151515" },
  { skin: "#FF8EAE", skinDark: "#C4587A", belly: "#FFF8E7", aura: "#C7B8FF", auraDeep: "#3B1F36", ink: "#151515" },
  { skin: "#C7B8FF", skinDark: "#7E6CD6", belly: "#FFF8E7", aura: "#83D94E", auraDeep: "#221B4A", ink: "#151515" },
  { skin: "#FFD86B", skinDark: "#C79A22", belly: "#FFF8E7", aura: "#FF8EAE", auraDeep: "#3A2A08", ink: "#151515" },
  { skin: "#174F36", skinDark: "#0C2E20", belly: "#C9F39B", aura: "#83D94E", auraDeep: "#04150E", ink: "#FFF8E7" },
];

const FIRST = [
  "Ivy", "Mossy", "Pip", "Bramble", "Noodle", "Tater", "Clover", "Wobble", "Juniper", "Puddle",
  "Sprout", "Biscuit", "Fern", "Bean", "Marsh", "Dumpling", "Reed", "Waffle", "Thistle", "Gumbo",
];
const LAST = [
  "the Short-Spined", "of the Low Pad", "Longleap", "Sunwarm", "the Unbothered", "Bellyflop",
  "the Sideways", "Softpaw", "the Loud", "Ribbitson", "the Patient", "Zoomer",
  "of Nine Naps", "the Damp", "Hopwright", "the Immense",
];
const TITLES = [
  "Keeper of the Warm Tile", "Second Chair, Evening Chorus", "Official Puddle Inspector",
  "Herald of the Small Splash", "Guardian of the Sock Drawer", "Chief of Unsolicited Zoomies",
  "Night Watch of the Lily Row", "Sunbeam Cartographer", "Deputy of the Damp Log",
  "Curator of Fallen Snacks", "Bearer of the Long Stare", "Ambassador to the Garden Hose",
];
const HATS = [
  "tiny frog hat", "bucket hat, two sizes big", "single wet leaf", "crown of pond weed",
  "sunhat with a bite out of it", "nothing — refuses headwear", "party cone, permanently",
  "lily pad, worn ironically", "knitted beanie", "halo of gnats",
];
const EYES = [
  "unblinking sincerity", "one eye always half-closed", "sparkle, entirely unearned",
  "deeply judgemental", "wide with pond wonder", "sleepy but plotting", "direct eye contact specialist",
  "glossy, faintly damp",
];
const MARKS = [
  "one white toe", "heart-shaped mud patch", "freckled shoulders", "stripe down the spine",
  "mismatched socks", "a single dramatic eyebrow", "gold-flecked back", "moon-pale belly",
];
const AURAS = [
  "smells faintly of rain", "leaves small damp footprints", "hums off-key when happy",
  "warm as a sunned stone", "makes nearby frogs braver", "always slightly glittering",
  "attracts exactly one moth", "cools the room by one degree",
];
const TALENTS = [
  "can nap through thunder", "lands every jump, eventually", "knows when the treats moved",
  "sits like a loaf on command", "out-stares every camera", "finds the one warm floor tile",
  "sings the low note nobody else can", "opens doors it should not",
  "predicts rain, wrongly, loudly", "carries twice its own body weight in sticks",
];

/** FNV-1a → 32-bit seed. Stable across engines. */
function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, well-distributed. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normaliseSeed(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isSummonable(input: string): boolean {
  return normaliseSeed(input).length >= 2;
}

function pick<T>(next: () => number, list: T[]): T {
  return list[Math.floor(next() * list.length)]!;
}

function pickRarity(next: () => number): { rarity: Rarity; oneIn: number } {
  const total = RARITY_TIERS.reduce((sum, t) => sum + t.weight, 0);
  let roll = next() * total;
  for (const tier of RARITY_TIERS) {
    roll -= tier.weight;
    if (roll <= 0) return { rarity: tier.rarity, oneIn: tier.oneIn };
  }
  return { rarity: "Pond Regular", oneIn: 2 };
}

export function summonFamiliar(input: string): Familiar {
  const seedKey = normaliseSeed(input);
  const next = rng(hashSeed(`ivy-familiar:${seedKey}`));

  const name = `${pick(next, FIRST)} ${pick(next, LAST)}`;
  const title = pick(next, TITLES);
  const { rarity, oneIn } = pickRarity(next);
  const dogness = 12 + Math.floor(next() * 77);
  const palette = pick(next, SKINS);
  const hat = pick(next, HATS);
  const eyes = pick(next, EYES);
  const mark = pick(next, MARKS);
  const aura = pick(next, AURAS);
  const talent = pick(next, TALENTS);
  const croak = pick(next, CROAKS);

  const blessing = `${dogness}% dog, ${100 - dogness}% frog. ${capitalise(aura)}, and ${talent}.`;

  return {
    input: input.trim(),
    seedKey,
    name,
    title,
    rarity,
    dogness,
    palette,
    hat,
    eyes,
    mark,
    aura,
    talent,
    croak,
    blessing,
    oneIn,
    traits: [
      { label: "Rank", value: rarity },
      { label: "Blend", value: `${dogness}% dog / ${100 - dogness}% frog` },
      { label: "Headwear", value: hat },
      { label: "Eyes", value: eyes },
      { label: "Marking", value: mark },
      { label: "Aura", value: aura },
      { label: "Talent", value: talent },
      { label: "Croak", value: `${croak.glyph} ${croak.word}` },
    ],
  };
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Share copy — short, brag-shaped, no invented token or project claims. */
export function shareText(familiar: Familiar): string {
  return `I summoned ${familiar.name} from Ivy's pond — ${familiar.rarity}, ${familiar.dogness}% dog / ${100 - familiar.dogness}% frog. ${familiar.croak.glyph} Summon yours:`;
}
