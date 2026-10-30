import "server-only";
import { cache } from "react";
import { blocksSchema, type ContentBlock } from "@/lib/content/blocks";
import { imageUrlsFor } from "@/lib/content/images";
import type { CourseProgress } from "@/lib/progress/summary";
import { createClient, getViewer } from "@/lib/supabase/server";

export type CourseOverview = {
  summaries: number;
  objectives: number;
  exams: number;
  questions: number;
  flashcards: number;
  hasAccess: boolean;
};

const EMPTY: CourseOverview = { summaries: 0, objectives: 0, exams: 0, questions: 0, flashcards: 0, hasAccess: false };

export const getCourseOverview = cache(async (courseId: string): Promise<CourseOverview> => {
  const supabase = await createClient();
  if (!supabase) return EMPTY;
  const { data, error } = await supabase.rpc("course_content_overview", { p_course_id: courseId });
  if (error) throw new Error(`Vakoverzicht kon niet worden geladen: ${error.message}`);
  if (!data) return EMPTY;
  return {
    summaries: Number(data.summaries),
    objectives: Number(data.objectives),
    exams: Number(data.exams),
    questions: Number(data.questions),
    flashcards: Number(data.flashcards ?? 0),
    hasAccess: Boolean(data.has_access),
  };
});

export type Summary = {
  id: string;
  topicId: string;
  title: string;
  blocks: ContentBlock[];
  /** Image addresses keyed by storage path; /inhoud/… signs a fresh URL on every load. */
  imageUrls: Record<string, string>;
  pdfUrl: string | null;
  invalid: boolean;
};

const CONTENT_BUCKET = "course-content";
const SIGNED_URL_SECONDS = 60 * 60;

/** Summaries the viewer may read (RLS filters out premium content without an entitlement). */
export const getSummaries = cache(async (courseId: string): Promise<Summary[]> => {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("summaries")
    .select("id, topic_id, title, content, pdf_path, pdf_download_allowed, topics!inner(course_id, sort_order)")
    .eq("topics.course_id", courseId)
    .eq("status", "published");
  if (error) throw new Error(`Samenvattingen konden niet worden geladen: ${error.message}`);

  const rows = data as unknown as {
    id: string; topic_id: string; title: string; content: unknown; pdf_path: string | null; pdf_download_allowed: boolean;
    topics: { sort_order: number };
  }[];
  rows.sort((a, b) => a.topics.sort_order - b.topics.sort_order);

  return Promise.all(
    rows.map(async (row) => {
      const parsed = blocksSchema.safeParse(row.content);
      const blocks = parsed.success ? parsed.data : [];
      const imageUrls = imageUrlsFor(blocks);
      let pdfUrl: string | null = null;
      if (row.pdf_path && row.pdf_download_allowed) {
        const { data: signed } = await supabase.storage.from(CONTENT_BUCKET).createSignedUrl(row.pdf_path, SIGNED_URL_SECONDS, { download: true });
        pdfUrl = signed?.signedUrl ?? null;
      }
      return { id: row.id, topicId: row.topic_id, title: row.title, blocks, imageUrls, pdfUrl, invalid: !parsed.success };
    }),
  );
});

export const getCompletedObjectives = cache(async (): Promise<Set<string>> => {
  const viewer = await getViewer();
  const supabase = await createClient();
  if (!viewer || !supabase) return new Set();
  const { data } = await supabase.from("objective_completions").select("objective_id").eq("user_id", viewer.user.id);
  return new Set((data ?? []).map((r) => r.objective_id));
});

export const getTopicStats = cache(async (courseId: string): Promise<Record<string, { answered: number; correct: number }>> => {
  const viewer = await getViewer();
  const supabase = await createClient();
  if (!viewer || !supabase) return {};
  const { data } = await supabase.rpc("my_topic_stats", { p_course_id: courseId });
  return Object.fromEntries(
    ((data ?? []) as { topic_id: string; answered: number; correct: number }[]).map((r) => [
      r.topic_id,
      { answered: Number(r.answered), correct: Number(r.correct) },
    ]),
  );
});

type RawTopicProgress = {
  id: string; title: string; slug: string;
  questions_total: number; questions_answered: number; questions_correct: number;
  flashcards_total: number; flashcards_mastered: number; flashcards_learning: number; flashcards_again: number; flashcards_due: number;
  objectives_total: number; objectives_done: number;
};

/** The viewer's own progress in a course, or null when signed out. */
export const getCourseProgress = cache(async (courseId: string): Promise<CourseProgress | null> => {
  const viewer = await getViewer();
  const supabase = await createClient();
  if (!viewer || !supabase) return null;
  const { data, error } = await supabase.rpc("my_course_progress", { p_course_id: courseId });
  if (error || !data) return null;
  const d = data as {
    answers_given: number; to_repeat: number; topics: RawTopicProgress[];
    exams: { id: string; finished_at: string; exam_title: string | null; questions: number; points: number | string; scored: number | string }[];
  };
  return {
    answersGiven: Number(d.answers_given),
    toRepeat: Number(d.to_repeat),
    topics: d.topics.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      questionsTotal: Number(t.questions_total),
      questionsAnswered: Number(t.questions_answered),
      questionsCorrect: Number(t.questions_correct),
      flashcardsTotal: Number(t.flashcards_total),
      flashcardsMastered: Number(t.flashcards_mastered),
      flashcardsLearning: Number(t.flashcards_learning),
      flashcardsAgain: Number(t.flashcards_again),
      flashcardsDue: Number(t.flashcards_due),
      objectivesTotal: Number(t.objectives_total),
      objectivesDone: Number(t.objectives_done),
    })),
    exams: d.exams.map((e) => ({ id: e.id, finishedAt: e.finished_at, examTitle: e.exam_title, questions: Number(e.questions), points: Number(e.points), scored: Number(e.scored) })),
  };
});
