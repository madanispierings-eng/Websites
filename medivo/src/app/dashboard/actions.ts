"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getViewer } from "@/lib/supabase/server";
import type { FormState } from "@/app/(auth)/actions";

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2, "Vul je naam in.").max(120, "Gebruik maximaal 120 tekens."),
      studyYear: z.union([z.literal(""), z.coerce.number().int().min(1).max(6)]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer je invoer." };

  const viewer = await getViewer();
  const supabase = await createClient();
  if (!viewer || !supabase) return { error: "Log opnieuw in om je gegevens te wijzigen." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, study_year: parsed.data.studyYear === "" ? null : parsed.data.studyYear })
    .eq("id", viewer.user.id);
  if (error) return { error: "Opslaan is niet gelukt. Probeer het opnieuw." };
  revalidatePath("/dashboard");
  return { success: "Je gegevens zijn opgeslagen." };
}
