import "server-only";
import { z } from "zod";
import { contentImageUrl } from "@/lib/content/images";
import { createClient, getViewer } from "@/lib/supabase/server";
import type { ActionResult, AnswerFeedback, AnswerKey, DropdownItem, PracticeQuestion, QuestionResponse, QuestionType, SessionReview } from "./types";

const uuid = z.string().uuid();

const errorMessages: Record<string, string> = {
  not_authenticated: "Log in om te oefenen.",
  no_questions_available: "Voor deze selectie zijn (nog) geen vragen beschikbaar.",
  topic_mode_needs_one_topic: "Kies eerst een onderwerp.",
  session_not_found: "Deze oefensessie bestaat niet meer. Start een nieuwe sessie.",
  session_finished: "Deze sessie is al afgerond.",
  time_expired: "De tijd is om. Je antwoorden tot nu toe zijn opgeslagen.",
  question_not_in_session: "Deze vraag hoort niet bij je sessie.",
  invalid_option: "Kies een van de antwoordopties.",
  invalid_answer: "Vul een antwoord in.",
  answer_key_missing: "Bij deze vraag ontbreekt het antwoordmodel. We zijn op de hoogte gebracht.",
  grade_after_finish: "Open vragen kijk je na nadat je het tentamen hebt ingeleverd.",
  not_gradable: "Deze vraag kun je niet zelf nakijken.",
  invalid_score: "Kies een score tussen 0 en het maximum, in stappen van een halve punt.",
};

function fail<T>(raw: string | undefined): ActionResult<T> {
  const key = Object.keys(errorMessages).find((k) => raw?.includes(k));
  return { ok: false, error: key ? errorMessages[key] : "Er ging iets mis. Probeer het opnieuw." };
}

async function context() {
  const [viewer, supabase] = await Promise.all([getViewer(), createClient()]);
  return viewer && supabase ? { viewer, supabase } : null;
}

const startInput = z.object({
  mode: z.enum(["topic", "mixed", "exam", "incorrect"]),
  topicIds: z.array(uuid).max(50),
  limit: z.number().int().min(1).max(200),
  timeLimitSeconds: z.number().int().min(60).max(4 * 60 * 60).nullable(),
  examId: uuid.nullable(),
});

const responseSchema: z.ZodType<QuestionResponse> = z.union([
  z.object({ option_id: uuid }).strict(),
  z.object({ option_ids: z.array(uuid).min(1).max(26) }).strict(),
  z.object({ answers: z.array(z.string().max(500).nullable()).min(1).max(40) }).strict(),
  z.object({ value: z.string().trim().min(1).max(60) }).strict(),
  z.object({ text: z.string().trim().min(1).max(8000) }).strict(),
]);

type QuestionRow = {
  id: string; topic_id: string; type: QuestionType; stem: string; context: string | null; points: number | string;
  content: { items?: DropdownItem[]; unit?: string } | null; image_path: string | null; image_alt: string | null;
  topics: { title: string } | null; question_options: { id: string; label: string; body: string; sort_order: number }[];
};

export async function startSession(courseId: string, input: unknown) {
  type Out = { sessionId: string; questions: PracticeQuestion[]; startedAt: string; timeLimitSeconds: number | null; bookmarkedIds: string[] };
  const parsed = startInput.safeParse(input);
  if (!parsed.success || !uuid.safeParse(courseId).success) return fail<Out>(undefined);
  const ctx = await context();
  if (!ctx) return fail<Out>("not_authenticated");
  const { supabase } = ctx;

  const { data: sessionId, error } = await supabase.rpc("start_practice_session", {
    p_course_id: courseId,
    p_mode: parsed.data.mode,
    p_topic_ids: parsed.data.topicIds,
    p_limit: parsed.data.limit,
    p_time_limit_seconds: parsed.data.timeLimitSeconds,
    p_exam_id: parsed.data.examId,
  });
  if (error) return fail<Out>(error.message);

  const { data: session, error: sErr } = await supabase
    .from("practice_sessions")
    .select("question_ids, started_at, time_limit_seconds")
    .eq("id", sessionId)
    .single();
  if (sErr) return fail<Out>(sErr.message);

  const ids: string[] = session.question_ids;
  const { data: rows, error: qErr } = await supabase
    .from("questions")
    .select("id, topic_id, type, stem, context, points, content, image_path, image_alt, topics(title), question_options(id, label, body, sort_order)")
    .in("id", ids);
  if (qErr) return fail<Out>(qErr.message);

  const byId = new Map((rows as unknown as QuestionRow[]).map((r) => [r.id, r]));
  const questions: PracticeQuestion[] = ids.flatMap((id) => {
    const r = byId.get(id);
    if (!r) return [];
    return [{
      id: r.id,
      topicId: r.topic_id,
      topicTitle: r.topics?.title ?? "",
      type: r.type,
      context: r.context,
      stem: r.stem,
      points: Number(r.points),
      imageUrl: r.image_path ? contentImageUrl(r.image_path) : null,
      imageAlt: r.image_alt,
      options: [...r.question_options].sort((a, b) => a.sort_order - b.sort_order).map(({ id, label, body }) => ({ id, label, body })),
      items: r.content?.items ?? [],
      unit: r.content?.unit ?? null,
    }];
  });

  const { data: marks } = await supabase.from("bookmarks").select("question_id").in("question_id", ids);

  return {
    ok: true as const,
    data: {
      sessionId: sessionId as string,
      questions,
      startedAt: session.started_at as string,
      timeLimitSeconds: session.time_limit_seconds as number | null,
      bookmarkedIds: (marks ?? []).map((m) => m.question_id as string),
    },
  };
}

type RawFeedback = {
  is_correct: boolean; score: number | string | null; max_score: number | string; correct_option_id: string | null;
  answer: AnswerKey | null; explanation: string; concept: string | null; option_feedback: Record<string, string> | null;
};

const toFeedback = (r: RawFeedback): AnswerFeedback => ({
  isCorrect: r.is_correct,
  score: r.score === null ? null : Number(r.score),
  maxScore: Number(r.max_score),
  correctOptionId: r.correct_option_id,
  answer: r.answer ?? {},
  explanation: r.explanation ?? "",
  concept: r.concept,
  optionFeedback: r.option_feedback ?? {},
});

export async function submitAnswer(input: unknown) {
  type Out = { response: QuestionResponse; feedback: AnswerFeedback | null };
  const parsed = z.object({ sessionId: uuid, questionId: uuid, response: responseSchema }).safeParse(input);
  if (!parsed.success) return fail<Out>("invalid_answer");
  const ctx = await context();
  if (!ctx) return fail<Out>("not_authenticated");

  const { data, error } = await ctx.supabase.rpc("submit_response", {
    p_session_id: parsed.data.sessionId,
    p_question_id: parsed.data.questionId,
    p_response: parsed.data.response,
  });
  if (error) return fail<Out>(error.message);
  const r = data as RawFeedback & { response: QuestionResponse };
  return {
    ok: true as const,
    data: { response: r.response, feedback: "explanation" in r ? toFeedback(r) : null },
  };
}

export async function selfGrade(input: unknown) {
  type Out = { score: number; isCorrect: boolean };
  const parsed = z.object({ sessionId: uuid, questionId: uuid, score: z.number().min(0).max(100) }).safeParse(input);
  if (!parsed.success) return fail<Out>("invalid_score");
  const ctx = await context();
  if (!ctx) return fail<Out>("not_authenticated");

  const { data, error } = await ctx.supabase.rpc("self_grade", {
    p_session_id: parsed.data.sessionId,
    p_question_id: parsed.data.questionId,
    p_score: parsed.data.score,
  });
  if (error) return fail<Out>(error.message);
  const r = data as { score: number | string; is_correct: boolean };
  return { ok: true as const, data: { score: Number(r.score), isCorrect: r.is_correct } };
}

export async function finishSession(input: unknown) {
  const parsed = z.object({ sessionId: uuid }).safeParse(input);
  if (!parsed.success) return fail<SessionReview>(undefined);
  const ctx = await context();
  if (!ctx) return fail<SessionReview>("not_authenticated");

  const { data, error } = await ctx.supabase.rpc("finish_practice_session", { p_session_id: parsed.data.sessionId });
  if (error) return fail<SessionReview>(error.message);
  const r = data as {
    total: number; answered: number; correct: number; points: number | string; scored: number | string;
    review: (RawFeedback & { question_id: string; response: QuestionResponse | null })[];
  };
  return {
    ok: true as const,
    data: {
      total: r.total,
      answered: r.answered,
      correct: r.correct,
      points: Number(r.points),
      scored: Number(r.scored),
      review: r.review.map((x) => ({
        ...toFeedback(x),
        questionId: x.question_id,
        // An unanswered question has no attempt; the database reports its response as null.
        response: x.response && Object.keys(x.response).length ? x.response : null,
      })),
    },
  };
}

export async function toggleBookmark(input: unknown) {
  const parsed = z.object({ questionId: uuid, bookmarked: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail<{ bookmarked: boolean }>(undefined);
  const ctx = await context();
  if (!ctx) return fail<{ bookmarked: boolean }>("not_authenticated");
  const { viewer, supabase } = ctx;
  const { error } = parsed.data.bookmarked
    ? await supabase.from("bookmarks").upsert({ user_id: viewer.user.id, question_id: parsed.data.questionId })
    : await supabase.from("bookmarks").delete().eq("user_id", viewer.user.id).eq("question_id", parsed.data.questionId);
  if (error) return fail<{ bookmarked: boolean }>(error.message);
  return { ok: true as const, data: { bookmarked: parsed.data.bookmarked } };
}
