"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/(auth)/actions";
import { requireAdmin } from "./guard";

const courseSchema = z.object({
  id: z.string().uuid(),
  description: z.string().trim().max(1200, "Maximaal 1200 tekens."),
  ec: z.union([z.literal(""), z.coerce.number().positive("EC moet groter dan 0 zijn.").max(60)]),
  status: z.enum(["draft", "published", "archived"]),
});

export async function updateCourse(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = courseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de invoer." };
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase is niet geconfigureerd." };

  const { id, description, ec, status } = parsed.data;
  const { error } = await supabase
    .from("courses")
    .update({ description: description || null, ec: ec === "" ? null : ec, status })
    .eq("id", id);
  if (error) return { error: `Opslaan mislukt: ${error.message}` };
  revalidatePath("/admin");
  revalidatePath("/vakken", "layout");
  return { success: "Opgeslagen." };
}
