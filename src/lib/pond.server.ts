/**
 * The Chorus Pond — server-only logic.
 *
 * Rules of the pond:
 *  - one pad per browser per UTC day (enforced by a private planters table),
 *  - only the fixed croak vocabulary is accepted,
 *  - positions are clamped so nothing can be planted outside the water,
 *  - reads only ever return today's pads, which carry nothing identifying.
 */
import { croakByWord, pondDay } from "@/lib/pond-vocabulary";

export interface PondPad {
  id: string;
  croak: string;
  note: number;
  x: number;
  y: number;
  at: string;
}

export interface PondState {
  day: string;
  pads: PondPad[];
}

export interface PlantResult {
  ok: boolean;
  reason?: "already-planted" | "unknown-croak" | "pond-busy";
  state: PondState;
}

/** Hard ceiling so one day's song stays a song and not a wall of noise. */
const MAX_PADS_PER_DAY = 400;

type Row = {
  id: string;
  croak: string;
  note_index: number;
  x: number;
  y: number;
  created_at: string;
};

function toPad(row: Row): PondPad {
  return {
    id: row.id,
    croak: row.croak,
    note: row.note_index,
    x: row.x,
    y: row.y,
    at: row.created_at,
  };
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function readPond(): Promise<PondState> {
  const day = pondDay();
  try {
    const db = await admin();
    const { data } = await db
      .from("pond_pads")
      .select("id, croak, note_index, x, y, created_at")
      .eq("day", day)
      .order("created_at", { ascending: true })
      .limit(MAX_PADS_PER_DAY);
    return { day, pads: ((data ?? []) as Row[]).map(toPad) };
  } catch {
    return { day, pads: [] };
  }
}

const clamp = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : (min + max) / 2;

export async function plantPad(input: {
  croak: string;
  x: number;
  y: number;
  planter: string;
}): Promise<PlantResult> {
  const day = pondDay();
  const croak = croakByWord(input.croak);
  if (!croak) return { ok: false, reason: "unknown-croak", state: await readPond() };

  try {
    const db = await admin();

    const { data: existing } = await db
      .from("pond_planters")
      .select("pad_id")
      .eq("day", day)
      .eq("planter_hash", input.planter)
      .maybeSingle();
    if (existing) return { ok: false, reason: "already-planted", state: await readPond() };

    const { count } = await db
      .from("pond_pads")
      .select("id", { count: "exact", head: true })
      .eq("day", day);
    if ((count ?? 0) >= MAX_PADS_PER_DAY) {
      return { ok: false, reason: "pond-busy", state: await readPond() };
    }

    const { data: pad, error } = await db
      .from("pond_pads")
      .insert({
        day,
        croak: croak.word,
        note_index: croak.note,
        x: clamp(input.x, 4, 96),
        y: clamp(input.y, 8, 92),
      })
      .select("id, croak, note_index, x, y, created_at")
      .single();
    if (error || !pad) return { ok: false, reason: "pond-busy", state: await readPond() };

    const { error: claimError } = await db
      .from("pond_planters")
      .insert({ day, planter_hash: input.planter, pad_id: pad.id });
    if (claimError) {
      // Someone from this browser planted a beat earlier — undo the duplicate.
      await db.from("pond_pads").delete().eq("id", pad.id);
      return { ok: false, reason: "already-planted", state: await readPond() };
    }

    return { ok: true, state: await readPond() };
  } catch {
    return { ok: false, reason: "pond-busy", state: { day, pads: [] } };
  }
}
