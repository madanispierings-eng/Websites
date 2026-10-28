import "server-only";
import { cache } from "react";
import { blocksSchema, type ContentBlock } from "@/lib/content/blocks";
import { createClient, getViewer } from "@/lib/supabase/server";

export type CourseOverview = {
  summaries: number;
  objectives: number;
  exams: number;
  questions: number;
  hasAccess: boolean;
};

const EMPTY: CourseOverview = { summaries: 0, objectives: 0, exams: 0, questions: 0, hasAccess: false };

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
    hasAccess: Boolean(data.has_access),
  };
});

export type Summary = {
  id: string;
  topicId: string;
  title: string;
  blocks: ContentBlock[];
  /** Signed URLs for images in private storage, keyed by storage path. */
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
      const paths = blocks.flatMap((b) => (b.type === "image" ? [b.path] : []));
      const imageUrls: Record<string, string> = {};
      if (paths.length) {
        const { data: signed } = await supabase.storage.from(CONTENT_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
        signed?.forEach((s) => {
          if (s.path && s.signedUrl) imageUrls[s.path] = s.signedUrl;
        });
      }
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
