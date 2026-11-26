import "server-only";
import { cache } from "react";
import { contentImageUrl } from "@/lib/content/images";
import { createClient, getViewer } from "@/lib/supabase/server";

/** A structure the student must be able to name and point out. */
export type AnatomyStructure = {
  id: string;
  slug: string;
  name: string;
  synonyms: string[];
  dutchName: string | null;
  level: "toepassen" | "basis";
  region: string;
  regionSort: number;
  /** One line: what it is. Shown when the student picked this structure by mistake. */
  summary: string;
  explanation: string;
  clinical: string | null;
};

export type AnatomyMarker = { id: string; structureId: string | null; x: number; y: number;
  /** Where the leader line ends (on the structure), as a fraction of the image; null when not set. */
  tip: { x: number; y: number } | null };

/** One practicum (as on Brightspace): what you must know and the checklist of structures. */
export type AnatomyUnit = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  mustKnow: string | null;
  /** Checklist in order, grouped by category. Only structures the viewer may read. */
  items: { structureId: string; category: string }[];
};

export type AnatomyImage = {
  id: string;
  unitId: string | null;
  slug: string;
  title: string;
  region: string;
  url: string;
  width: number;
  height: number;
  credit: string;
  markers: AnatomyMarker[];
};

export type AnatomyProgress = { box: number; reviews: number; lastCorrect: boolean; lastConfidence: string; dueAt: string };

/** Structures and plates of a course that the viewer may read (RLS returns nothing without access). */
export const getAnatomy = cache(async (courseId: string): Promise<{ structures: AnatomyStructure[]; images: AnatomyImage[]; units: AnatomyUnit[] }> => {
  const supabase = await createClient();
  if (!supabase) return { structures: [], images: [], units: [] };
  const [{ data: s }, { data: i }, { data: u }] = await Promise.all([
    supabase
      .from("anatomy_structures")
      .select("id, slug, name, synonyms, dutch_name, level, region, region_sort, summary, explanation, clinical")
      .eq("course_id", courseId)
      .eq("status", "published")
      .order("region_sort")
      .order("name"),
    supabase
      .from("anatomy_images")
      .select("id, unit_id, slug, title, region, image_path, width, height, credit, anatomy_markers(id, structure_id, x, y, tip_x, tip_y, sort_order)")
      .eq("course_id", courseId)
      .eq("status", "published")
      .order("sort_order"),
    supabase
      .from("anatomy_units")
      .select("id, slug, title, subtitle, must_know, anatomy_unit_structures(structure_id, category, sort_order)")
      .eq("course_id", courseId)
      .eq("status", "published")
      .order("sort_order"),
  ]);
  const structures: AnatomyStructure[] = (s ?? []).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    synonyms: (r.synonyms as string[]) ?? [],
    dutchName: (r.dutch_name as string | null) ?? null,
    level: r.level as "toepassen" | "basis",
    region: r.region as string,
    regionSort: r.region_sort as number,
    summary: r.summary as string,
    explanation: r.explanation as string,
    clinical: (r.clinical as string | null) ?? null,
  }));
  const known = new Set(structures.map((x) => x.id));
  const images: AnatomyImage[] = (i ?? []).map((r) => ({
    id: r.id as string,
    unitId: (r.unit_id as string | null) ?? null,
    slug: r.slug as string,
    title: r.title as string,
    region: r.region as string,
    url: contentImageUrl(r.image_path as string),
    width: r.width as number,
    height: r.height as number,
    credit: r.credit as string,
    markers: ((r.anatomy_markers as { id: string; structure_id: string | null; x: number | string; y: number | string; tip_x: number | string | null; tip_y: number | string | null; sort_order: number }[]) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        id: m.id,
        structureId: m.structure_id && known.has(m.structure_id) ? m.structure_id : null,
        x: Number(m.x),
        y: Number(m.y),
        tip: m.tip_x !== null && m.tip_y !== null ? { x: Number(m.tip_x), y: Number(m.tip_y) } : null,
      })),
  }));
  const units: AnatomyUnit[] = (u ?? []).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    subtitle: (r.subtitle as string | null) ?? null,
    mustKnow: (r.must_know as string | null) ?? null,
    items: ((r.anatomy_unit_structures as { structure_id: string; category: string; sort_order: number }[]) ?? [])
      .filter((x) => known.has(x.structure_id))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((x) => ({ structureId: x.structure_id, category: x.category })),
  }));
  return { structures, images, units };
});

/** The viewer's own progress per structure. */
export const getAnatomyProgress = cache(async (): Promise<Record<string, AnatomyProgress>> => {
  const [viewer, supabase] = await Promise.all([getViewer(), createClient()]);
  if (!viewer || !supabase) return {};
  const { data } = await supabase
    .from("anatomy_progress")
    .select("structure_id, box, reviews, last_correct, last_confidence, due_at")
    .eq("user_id", viewer.user.id);
  return Object.fromEntries(
    (data ?? []).map((r) => [
      r.structure_id as string,
      { box: r.box as number, reviews: r.reviews as number, lastCorrect: r.last_correct as boolean, lastConfidence: r.last_confidence as string, dueAt: r.due_at as string },
    ]),
  );
});
