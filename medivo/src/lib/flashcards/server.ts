import "server-only";
import { cache } from "react";
import { z } from "zod";
import { createClient, getViewer } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/practice/types";
import type { CardProgress, Flashcard } from "./deck";

/** The published cards the viewer may read (RLS: signed in and access to the course), with their own schedule. */
export const getFlashcardDeck = cache(async (courseId: string) => {
  const [viewer, supabase] = await Promise.all([getViewer(), createClient()]);
  if (!viewer || !supabase) return { cards: [] as Flashcard[], progress: {} as Record<string, CardProgress> };
  const { data, error } = await supabase
    .from("flashcards")
    .select("id, topic_id, front, back, sort_order")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("sort_order");
  if (error) throw new Error(`Flashcards konden niet worden geladen: ${error.message}`);
  const cards: Flashcard[] = (data ?? []).map((r) => ({ id: r.id, topicId: r.topic_id, front: r.front, back: r.back }));

  const progress: Record<string, CardProgress> = {};
  if (cards.length) {
    const { data: rows } = await supabase
      .from("flashcard_progress")
      .select("flashcard_id, box, last_known, due_at, flashcards!inner(course_id)")
      .eq("flashcards.course_id", courseId);
    for (const r of rows ?? []) progress[r.flashcard_id] = { box: r.box, lastKnown: r.last_known, dueAt: r.due_at };
  }
  return { cards, progress };
});

export async function reviewFlashcard(input: unknown): Promise<ActionResult<CardProgress>> {
  const parsed = z.object({ flashcardId: z.string().uuid(), known: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Er ging iets mis. Probeer het opnieuw." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Log in om je voortgang op te slaan." };
  const { data, error } = await supabase.rpc("review_flashcard", { p_flashcard_id: parsed.data.flashcardId, p_known: parsed.data.known });
  if (error) {
    return { ok: false, error: error.message.includes("not_authenticated") ? "Log in om je voortgang op te slaan." : "Je antwoord is niet opgeslagen. Probeer het opnieuw." };
  }
  const r = data as { box: number; last_known: boolean; due_at: string };
  return { ok: true, data: { box: r.box, lastKnown: r.last_known, dueAt: r.due_at } };
}
