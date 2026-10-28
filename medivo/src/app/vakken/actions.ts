"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getViewer } from "@/lib/supabase/server";

const uuid = z.string().uuid();

/** Remembers the course for "recently visited" on the dashboard. Silently ignored for visitors. */
export async function recordVisit(courseId: string) {
  const id = uuid.safeParse(courseId);
  const viewer = await getViewer();
  const supabase = await createClient();
  if (!id.success || !viewer || !supabase) return;
  await supabase
    .from("course_visits")
    .upsert({ user_id: viewer.user.id, course_id: id.data, last_visited_at: new Date().toISOString() });
}

export async function setObjectiveCompleted(input: { objectiveId: string; completed: boolean; path: string }) {
  const parsed = z.object({ objectiveId: uuid, completed: z.boolean(), path: z.string().startsWith("/vakken/") }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Ongeldig verzoek." };
  const viewer = await getViewer();
  const supabase = await createClient();
  if (!viewer || !supabase) return { ok: false as const, error: "Log in om leerdoelen af te vinken." };

  const { objectiveId, completed } = parsed.data;
  const { error } = completed
    ? await supabase.from("objective_completions").upsert({ user_id: viewer.user.id, objective_id: objectiveId })
    : await supabase.from("objective_completions").delete().eq("user_id", viewer.user.id).eq("objective_id", objectiveId);
  if (error) return { ok: false as const, error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  revalidatePath(parsed.data.path);
  return { ok: true as const };
}
