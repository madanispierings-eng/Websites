"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const input = z.object({
  structureId: z.string().uuid(),
  correct: z.boolean(),
  confidence: z.enum(["zeker", "twijfel", "gok"]),
});

/** Records one answer; the database decides when the structure comes back (spaced repetition). */
export async function reviewAnatomy(raw: unknown): Promise<{ ok: true; box: number; dueAt: string } | { ok: false }> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  if (!supabase) return { ok: false };
  const { data, error } = await supabase.rpc("review_anatomy", {
    p_structure_id: parsed.data.structureId,
    p_correct: parsed.data.correct,
    p_confidence: parsed.data.confidence,
  });
  if (error || !data) return { ok: false };
  const d = data as { box: number; due_at: string };
  return { ok: true, box: d.box, dueAt: d.due_at };
}
