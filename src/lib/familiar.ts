/**
 * The Frog Familiar Foundry — deterministic pond-creature card generator.
 *
 * Type anything (a name, a handle, or a Solana address you can read but never
 * spend from) and the pond hands back exactly one card for it, forever. Pure
 * maths, no network, no storage, nothing personal leaves the browser: the same
 * input always summons the same card on every device, which is what makes a
 * card worth collecting — and what makes a future mint verifiable, because
 * anybody can re-derive the exact same card from the exact same input.
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

export interface FamiliarStat {
  label: string;
  /** 1-99 */
  value: number;
  glyph: string;
}

export interface FamiliarMove {
  name: string;
  cost: string;
  effect: string;
  power: number;
}

export interface Familiar {
  /** The exact text that summoned it (trimmed, original case). */
  input: string;
  /** Normalised key — casing and spacing never change the creature. */
  seedKey: string;
  name: string;
  title: string;
  rarity: Rarity;
  /** True for Lily Noble and above — these cards print with foil. */
  foil: boolean;
  /** Frog Queen's Own only — full rainbow prism treatment. */
  prismatic: boolean;
  /** 0-100, how much dog is in the frog. */
  dogness: number;
  palette: FamiliarPalette;
  hat: string;
  eyes: string;
  mark: string;
  aura: string;
  talent: string;
  croak: Croak;
  /** Where in the pond it lives — drives the card's backdrop wash. */
  biome: string;
  /** Battle-style numbers, all derived from the same seed. */
  stats: FamiliarStat[];
  /** Overall power score, 1-99, the number collectors will argue about. */
  power: number;
  /** Two signature moves, printed on the card. */
  moves: FamiliarMove[];
  /** One warm line in Ivy's voice, assembled from the traits. */
  blessing: string;
  traits: FamiliarTrait[];
  /** 1-in-N: how rare this card is, for bragging. */
  oneIn: number;
  /** Print run identity — set name, card number and edition. */
  set: string;
  cardNumber: number;
  cardTotal: number;
  /** Deterministic 10-character fingerprint of the seed. Re-derivable by anyone. */
  sigil: string;
  /** True when the seed is a readable Solana address (read-only, never signed). */
  walletBound: boolean;
}

export type Rarity =
  | "Pond Regular"
  | "Sunbather"
  | "Lily Noble"
  | "Royal Court"
  | "Frog Queen's Own";

interface RarityTier {
  rarity: Rarity;
  weight: number;
  oneIn: number;
  ring: string;
  foil: boolean;
  prismatic: boolean;
  /** Plain-language note shown in the odds table. */
  note: string;
}

const RARITY_TIERS: RarityTier[] = [
  {
    rarity: "Pond Regular",
    weight: 52,
    oneIn: 2,
    ring: "#83D94E",
    foil: false,
    prismatic: false,
    note: "Matte paper stock. The backbone of the pond.",
  },
  {
    rarity: "Sunbather",
    weight: 27,
    oneIn: 4,
    ring: "#FFD86B",
    foil: false,
    prismatic: false,
    note: "Matte stock with a warm gold rule.",
  },
  {
    rarity: "Lily Noble",
    weight: 14,
    oneIn: 7,
    ring: "#FF8EAE",
    foil: true,
    prismatic: false,
    note: "Holographic foil across the portrait window.",
  },
  {
    rarity: "Royal Court",
    weight: 6,
    oneIn: 17,
    ring: "#C7B8FF",
    foil: true,
    prismatic: false,
    note: "Full-card holo foil plus an embossed court seal.",
  },
  {
    rarity: "Frog Queen's Own",
    weight: 1,
    oneIn: 100,
    ring: "#FFF8E7",
    foil: true,
    prismatic: true,
    note: "Prismatic rainbow foil, cream deckle edge, numbered by hand.",
  },
];

export interface RarityOdds {
  rarity: Rarity;
  ring: string;
  chance: string;
  oneIn: number;
  foil: boolean;
  note: string;
}

/** Published odds — the same weights the generator actually uses. */
export const RARITY_ODDS: RarityOdds[] = (() => {
  const total = RARITY_TIERS.reduce((sum, t) => sum + t.weight, 0);
  return RARITY_TIERS.map((t) => ({
    rarity: t.rarity,
    ring: t.ring,
    oneIn: t.oneIn,
    foil: t.foil,
    note: t.note,
    chance: `${((t.weight / total) * 100).toFixed(t.weight < 2 ? 1 : 0)}%`,
  }));
})();

export function rarityRing(rarity: Rarity): string {
  return RARITY_TIERS.find((t) => t.rarity === rarity)?.ring ?? "#83D94E";
}

export function rarityIsFoil(rarity: Rarity): boolean {
  return RARITY_TIERS.find((t) => t.rarity === rarity)?.foil ?? false;
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
const BIOMES = [
  "Warm Tile Shallows", "The Low Pad Row", "Sock Drawer Hollow", "Garden Hose Delta",
  "Evening Chorus Reeds", "The Damp Log", "Sunbeam Flats", "Moonlit Puddle",
];
const MOVE_NAMES = [
  "Bellyflop Cannon", "Short-Spine Shuffle", "Unsolicited Zoomies", "The Long Stare",
  "Ribbit Broadside", "Warm Tile Recovery", "Sideways Ambush", "Snack Radar",
  "Low Pad Leap", "Damp Footprint Trap", "Chorus Crescendo", "Sock Drawer Retreat",
  "Puddle Cannonball", "Moth Escort", "One Good Hop", "Loaf Formation",
];
const MOVE_EFFECTS = [
  "Everyone nearby stops what they are doing.",
  "Gains one extra hop when the floor is warm.",
  "Cannot be interrupted. Nobody has ever tried.",
  "The opponent gives up the snack voluntarily.",
  "Heals two naps' worth of tiredness.",
  "Ignores gravity for exactly one moment.",
  "Doubles in strength during the evening chorus.",
  "Steals the good spot on the sofa.",
  "Makes every frog in the pond braver.",
  "Ends the turn in a puddle. Worth it.",
];
const MOVE_COSTS = ["🪷", "🪷🪷", "🐸", "🐸🪷", "🌞", "💧💧"];

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

/**
 * Read-only Solana address check — shape only, nothing is signed and no RPC is
 * called. A wallet is just a very good, very unique seed here.
 */
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isSolanaAddress(input: string): boolean {
  return BASE58.test(input.trim());
}

export function maskAddress(input: string): string {
  const clean = input.trim();
  if (clean.length <= 12) return clean;
  return `${clean.slice(0, 4)}…${clean.slice(-4)}`;
}

function pick<T>(next: () => number, list: T[]): T {
  return list[Math.floor(next() * list.length)]!;
}

function pickRarity(next: () => number): RarityTier {
  const total = RARITY_TIERS.reduce((sum, t) => sum + t.weight, 0);
  let roll = next() * total;
  for (const tier of RARITY_TIERS) {
    roll -= tier.weight;
    if (roll <= 0) return tier;
  }
  return RARITY_TIERS[0]!;
}

/** 10-character fingerprint — anyone can re-derive it from the same seed. */
function sigilFor(seedKey: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let round = 0; round < 2; round += 1) {
    const next = rng(hashSeed(`ivy-sigil:${round}:${seedKey}`));
    for (let i = 0; i < 5; i += 1) out += alphabet[Math.floor(next() * alphabet.length)];
  }
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

export const CARD_SET = "Series I · Short Spine, Long Legend";
export const CARD_TOTAL = 250;

export function summonFamiliar(input: string): Familiar {
  const seedKey = normaliseSeed(input);
  const next = rng(hashSeed(`ivy-familiar:${seedKey}`));

  const name = `${pick(next, FIRST)} ${pick(next, LAST)}`;
  const title = pick(next, TITLES);
  const tier = pickRarity(next);
  const dogness = 12 + Math.floor(next() * 77);
  const palette = pick(next, SKINS);
  const hat = pick(next, HATS);
  const eyes = pick(next, EYES);
  const mark = pick(next, MARKS);
  const aura = pick(next, AURAS);
  const talent = pick(next, TALENTS);
  const croak = pick(next, CROAKS);
  const biome = pick(next, BIOMES);

  // Rarer cards skew stronger, but never max out — every card keeps a weakness.
  const tierIndex = RARITY_TIERS.indexOf(tier);
  const floor = 18 + tierIndex * 8;
  const span = 74 - tierIndex * 4;
  const stat = () => Math.max(1, Math.min(99, floor + Math.floor(next() * span)));

  const stats: FamiliarStat[] = [
    { label: "Hop", value: stat(), glyph: "🦿" },
    { label: "Croak", value: stat(), glyph: "🐸" },
    { label: "Chill", value: stat(), glyph: "🌞" },
    { label: "Mischief", value: stat(), glyph: "💨" },
  ];
  const power = Math.max(
    1,
    Math.min(99, Math.round(stats.reduce((sum, s) => sum + s.value, 0) / stats.length)),
  );

  const moveA = pick(next, MOVE_NAMES);
  let moveB = pick(next, MOVE_NAMES);
  if (moveB === moveA) moveB = MOVE_NAMES[(MOVE_NAMES.indexOf(moveA) + 7) % MOVE_NAMES.length]!;
  const moves: FamiliarMove[] = [
    {
      name: moveA,
      cost: pick(next, MOVE_COSTS),
      effect: pick(next, MOVE_EFFECTS),
      power: 10 * (1 + Math.floor(next() * 6)),
    },
    {
      name: moveB,
      cost: pick(next, MOVE_COSTS),
      effect: pick(next, MOVE_EFFECTS),
      power: 10 * (2 + Math.floor(next() * 8)),
    },
  ];

  const cardNumber = 1 + Math.floor(next() * CARD_TOTAL);
  const blessing = `${dogness}% dog, ${100 - dogness}% frog. ${capitalise(aura)}, and ${talent}.`;

  return {
    input: input.trim(),
    seedKey,
    name,
    title,
    rarity: tier.rarity,
    foil: tier.foil,
    prismatic: tier.prismatic,
    dogness,
    palette,
    hat,
    eyes,
    mark,
    aura,
    talent,
    croak,
    biome,
    stats,
    power,
    moves,
    blessing,
    oneIn: tier.oneIn,
    set: CARD_SET,
    cardNumber,
    cardTotal: CARD_TOTAL,
    sigil: sigilFor(seedKey),
    walletBound: isSolanaAddress(input),
    traits: [
      { label: "Rank", value: tier.rarity },
      { label: "Blend", value: `${dogness}% dog / ${100 - dogness}% frog` },
      { label: "Home water", value: biome },
      { label: "Headwear", value: hat },
      { label: "Eyes", value: eyes },
      { label: "Marking", value: mark },
      { label: "Aura", value: aura },
      { label: "Talent", value: talent },
      { label: "Croak", value: `${croak.glyph} ${croak.word}` },
      { label: "Print", value: `#${cardNumber} / ${CARD_TOTAL}` },
    ],
  };
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Share copy — short, brag-shaped, no invented token or project claims. */
export function shareText(familiar: Familiar): string {
  const foil = familiar.prismatic ? " PRISMATIC" : familiar.foil ? " HOLO" : "";
  return `I pulled ${familiar.name} from Ivy's pond —${foil} ${familiar.rarity}, power ${familiar.power}, #${familiar.cardNumber}/${familiar.cardTotal}. ${familiar.croak.glyph} Pull yours:`;
}
