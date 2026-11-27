import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** One disease from a course's ziektebeeldenlijst, with the depth at which the student must know it. */
export type Disorder = {
  id: string;
  slug: string;
  name: string;
  /** 1 = volledig kennen, 2 = herkennen voor de differentiaaldiagnose, null = niet in de niveaulijst. */
  level: 1 | 2 | null;
  summary: string;
  keyPoints: string[];
  /** Uitleg in de summary-markup (### kopjes, lijsten, **vet**). */
  explanation: string;
  /** Ids of the themes (topics) this disease belongs to, in theme order. */
  themeIds: string[];
};

export type DisorderTheme = {
  id: string;
  /** "Thema 1" */
  label: string;
  /** "Acute buikpijn" */
  title: string;
  disorders: Disorder[];
};

type Row = {
  id: string;
  slug: string;
  name: string;
  level: number | null;
  summary: string;
  key_points: string[] | null;
  explanation: string;
  sort_order: number;
  disorder_topics: { topic_id: string; sort_order: number; topics: { title: string; sort_order: number } | null }[];
};

function splitTitle(title: string): { label: string; title: string } {
  const m = title.match(/^(.+?)\s+[–-]\s+(.+)$/);
  return m ? { label: m[1], title: m[2] } : { label: title, title: "" };
}

/**
 * Published ziektebeelden for a course that the viewer may read, grouped per theme in the order of
 * the theme list (RLS hides premium content without an entitlement, so a locked viewer gets []).
 * A disease that belongs to several themes appears in each of them.
 */
export const getDisorderThemes = cache(async (courseId: string): Promise<DisorderTheme[]> => {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("disorders")
    .select("id, slug, name, level, summary, key_points, explanation, sort_order, disorder_topics(topic_id, sort_order, topics(title, sort_order))")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  const rows = (data ?? []) as unknown as Row[];

  const themes = new Map<string, { sort: number; title: string; items: { order: number; d: Disorder }[] }>();
  for (const r of rows) {
    const links = [...r.disorder_topics].sort((a, b) => (a.topics?.sort_order ?? 0) - (b.topics?.sort_order ?? 0));
    const d: Disorder = {
      id: r.id,
      slug: r.slug,
      name: r.name,
      level: r.level === 1 || r.level === 2 ? r.level : null,
      summary: r.summary,
      keyPoints: r.key_points ?? [],
      explanation: r.explanation,
      themeIds: links.map((l) => l.topic_id),
    };
    for (const l of links) {
      if (!l.topics) continue;
      const t = themes.get(l.topic_id) ?? { sort: l.topics.sort_order, title: l.topics.title, items: [] };
      t.items.push({ order: l.sort_order, d });
      themes.set(l.topic_id, t);
    }
  }
  return [...themes.entries()]
    .sort((a, b) => a[1].sort - b[1].sort)
    .map(([id, t]) => ({
      id,
      ...splitTitle(t.title),
      disorders: t.items.sort((a, b) => a.order - b.order).map((x) => x.d),
    }));
});
