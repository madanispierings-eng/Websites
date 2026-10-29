import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ExamRow } from "./forms";

// Admin reads go through the admin's session; RLS lets admins see drafts as well.

export async function adminDb() {
  const supabase = await createClient();
  if (!supabase) notFound();
  return supabase;
}

export type AdminTopic = { id: string; parent_id: string | null; title: string; slug: string; sort_order: number; status: "draft" | "published" | "archived" };

export async function getAdminCourse(slug: string) {
  const supabase = await adminDb();
  const { data } = await supabase
    .from("courses")
    .select("id, title, slug, study_year, ec, description, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();
  return data as { id: string; title: string; slug: string; study_year: number; ec: number | null; description: string | null; status: string };
}

export async function getAdminTopics(courseId: string) {
  const supabase = await adminDb();
  const { data } = await supabase
    .from("topics")
    .select("id, parent_id, title, slug, sort_order, status")
    .eq("course_id", courseId)
    .order("sort_order")
    .order("created_at");
  return (data ?? []) as AdminTopic[];
}

/** Topics ordered as a tree: each main topic followed by its subtopics. */
export function topicTree(topics: AdminTopic[]) {
  return topics
    .filter((t) => !t.parent_id)
    .flatMap((t) => [{ ...t, depth: 0 }, ...topics.filter((c) => c.parent_id === t.id).map((c) => ({ ...c, depth: 1 }))]);
}

export async function getAdminExams(courseId: string) {
  const supabase = await adminDb();
  const { data } = await supabase
    .from("exams")
    .select("id, exam_year, exam_type, title, question_count, has_explanations, source, rights_status, is_premium, status")
    .eq("course_id", courseId)
    .order("exam_year", { ascending: false });
  return (data ?? []) as ExamRow[];
}

const examTypeLabel = { regular: "Tentamen", resit: "Hertentamen", midterm: "Deeltoets", practice: "Proeftentamen" } as const;
export const examLabel = (e: ExamRow) => `${e.exam_year} · ${e.title || examTypeLabel[e.exam_type]}`;

export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const supabase = await adminDb();
  const { data } = await supabase.storage.from("course-content").createSignedUrls(paths, 60 * 60);
  const out: Record<string, string> = {};
  for (const s of data ?? []) if (s.path && s.signedUrl) out[s.path] = s.signedUrl;
  return out;
}
