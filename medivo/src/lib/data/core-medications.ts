import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** One medication from a course's kernmedicatielijst, with the facts the student must know. */
export type CoreMedication = {
  id: string;
  category: string;
  subgroup: string | null;
  name: string;
  /** Werkingsmechanisme. */
  mechanism: string;
  /** Belangrijkste indicatie(s). */
  indications: string;
  /** 1-2 belangrijkste bijwerkingen. */
  sideEffects: string;
  /** Langere uitleg: wat is het, hoe werkt het. */
  explanation: string;
};

/** The medications grouped by category, in their intended order. */
export type MedicationGroup = { category: string; medications: CoreMedication[] };

/**
 * Published kernmedicatie for a course that the viewer may read (RLS filters premium content
 * without an entitlement, so this returns [] for a locked viewer).
 */
export const getCoreMedications = cache(async (courseId: string): Promise<CoreMedication[]> => {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("core_medications")
    .select("id, category, category_sort, subgroup, name, sort_order, mechanism, indications, side_effects, explanation")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("category_sort", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id as string,
    category: r.category as string,
    subgroup: (r.subgroup as string | null) ?? null,
    name: r.name as string,
    mechanism: r.mechanism as string,
    indications: r.indications as string,
    sideEffects: r.side_effects as string,
    explanation: r.explanation as string,
  }));
});

/** Groups the flat list by category, keeping the given order. */
export function groupMedications(meds: CoreMedication[]): MedicationGroup[] {
  const groups: MedicationGroup[] = [];
  for (const m of meds) {
    const last = groups[groups.length - 1];
    if (last && last.category === m.category) last.medications.push(m);
    else groups.push({ category: m.category, medications: [m] });
  }
  return groups;
}
