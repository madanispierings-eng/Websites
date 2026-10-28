import "server-only";
import { z } from "zod";
import { createClient, getViewer } from "@/lib/supabase/server";
import type { ActionResult, AnswerFeedback, PracticeQuestion, SessionReview } from "./types";

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
  answer_key_missing: "Bij deze vraag ontbreekt het antwoordmodel. We zijn op de hoogte gebracht.",
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
  limit: z.number().int().min(1).max(100),
  timeLimitSeconds: z.number().int().min(60).max(4 * 60 * 60).nullable(),
});

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
    .select("id, topic_id, stem, image_path, image_alt, topics(title), question_options(id, label, body, sort_order)")
    .in("id", ids);
  if (qErr) return fail<Out>(qErr.message);

  const byId = new Map(
    (rows as unknown as {
      id: string; topic_id: string; stem: string; image_path: string | null; image_alt: string | null;
      topics: { title: string } | null; question_options: { id: string; label: string; body: string; sort_order: number }[];
    }[]).map((r) => [r.id, r]),
  );

  const imagePaths = [...byId.values()].flatMap((r) => (r.image_path ? [r.image_path] : []));
  const signed: Record<string, string> = {};
  if (imagePaths.length) {
    const { data } = await supabase.storage.from("course-content").createSignedUrls(imagePaths, 60 * 60 * 2);
    data?.forEach((s) => {
      if (s.path && s.signedUrl) signed[s.path] = s.signedUrl;
    });
  }

  const questions: PracticeQuestion[] = ids.flatMap((id) => {
    const r = byId.get(id);
    if (!r) return [];
    return [{
      id: r.id,
      topicId: r.topic_id,
      topicTitle: r.topics?.title ?? "",
      stem: r.stem,
      imageUrl: r.image_path ? signed[r.image_path] ?? null : null,
      imageAlt: r.image_alt,
      options: [...r.question_options].sort((a, b) => a.sort_order - b.sort_order).map(({ id, label, body }) => ({ id, label, body })),
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
  is_correct: boolean; correct_option_id: string; explanation: string; concept: string | null;
  option_feedback: Record<string, string>;
};

const toFeedback = (r: RawFeedback): AnswerFeedback => ({
  isCorrect: r.is_correct,
  correctOptionId: r.correct_option_id,
  explanation: r.explanation,
  concept: r.concept,
  optionFeedback: r.option_feedback ?? {},
});

export async function submitAnswer(input: unknown) {
  type Out = { selectedOptionId: string; feedback: AnswerFeedback | null };
  const parsed = z.object({ sessionId: uuid, questionId: uuid, optionId: uuid }).safeParse(input);
  if (!parsed.success) return fail<Out>(undefined);
  const ctx = await context();
  if (!ctx) return fail<Out>("not_authenticated");

  const { data, error } = await ctx.supabase.rpc("submit_answer", {
    p_session_id: parsed.data.sessionId,
    p_question_id: parsed.data.questionId,
    p_option_id: parsed.data.optionId,
  });
  if (error) return fail<Out>(error.message);
  const r = data as RawFeedback & { selected_option_id: string };
  return {
    ok: true as const,
    data: { selectedOptionId: r.selected_option_id, feedback: "correct_option_id" in r ? toFeedback(r) : null },
  };
}

export async function finishSession(input: unknown) {
  const parsed = z.object({ sessionId: uuid }).safeParse(input);
  if (!parsed.success) return fail<SessionReview>(undefined);
  const ctx = await context();
  if (!ctx) return fail<SessionReview>("not_authenticated");

  const { data, error } = await ctx.supabase.rpc("finish_practice_session", { p_session_id: parsed.data.sessionId });
  if (error) return fail<SessionReview>(error.message);
  const r = data as { total: number; answered: number; correct: number; review: (RawFeedback & { question_id: string; selected_option_id: string | null })[] };
  return {
    ok: true as const,
    data: {
      total: r.total,
      answered: r.answered,
      correct: r.correct,
      review: r.review.map((x) => ({ ...toFeedback(x), questionId: x.question_id, selectedOptionId: x.selected_option_id })),
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
