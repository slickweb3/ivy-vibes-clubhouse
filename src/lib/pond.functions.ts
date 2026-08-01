/**
 * Public server functions for the Chorus Pond. Thin wrappers only.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CROAK_WORDS } from "@/lib/pond-vocabulary";
import type { PlantResult, PondState } from "@/lib/pond.server";

export const getPond = createServerFn({ method: "GET" }).handler(async (): Promise<PondState> => {
  const { readPond } = await import("@/lib/pond.server");
  return readPond();
});

const plantSchema = z.object({
  croak: z.enum(CROAK_WORDS as [string, ...string[]]),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  planter: z.string().min(8).max(64),
});

export const plantPondPad = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => plantSchema.parse(data))
  .handler(async ({ data }): Promise<PlantResult> => {
    const { plantPad } = await import("@/lib/pond.server");
    return plantPad(data);
  });
