import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getViewer } from "@/lib/supabase/server";

export type ResetResult = { ok: true; deleted: number } | { ok: false; error: string };

const input = z.object({ topicId: z.string().uuid(), courseSlug: z.string().min(1).max(120) });

/**
 * Reset the viewer's own practice progress for one topic. The questions stay; only the viewer's
 * answers for this topic's practice questions are removed, so the next practice session shows a clean level.
 * Exam (and exam-simulation) results are left untouched. Authorisation lives in the database RPC.
 */
export async function resetTopicProgress(raw: unknown): Promise<ResetResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ongeldig verzoek." };

  const [viewer, supabase] = await Promise.all([getViewer(), createClient()]);
  if (!viewer || !supabase) return { ok: false, error: "Log in om je voortgang te beheren." };

  const { data, error } = await supabase.rpc("reset_topic_progress", { p_topic_id: parsed.data.topicId });
  if (error) return { ok: false, error: "Er ging iets mis. Probeer het opnieuw." };

  const base = `/vakken/${parsed.data.courseSlug}`;
  revalidatePath(`${base}/voortgang`);
  revalidatePath(base);
  return { ok: true, deleted: Number(data ?? 0) };
}
