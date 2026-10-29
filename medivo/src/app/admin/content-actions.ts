"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { blocksSchema } from "@/lib/content/blocks";
import { parseMarkup } from "@/lib/content/markup";
import { slugify } from "@/lib/content/text";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/(auth)/actions";
import { requireAdmin } from "./guard";

// All writes run with the admin's own session, so RLS (is_admin()) checks every one of them again.

const uuid = z.string().uuid();
const status = z.enum(["draft", "published", "archived"]);
const rights = z.enum(["unknown", "permission_requested", "licensed", "own_work", "public_domain"]);
const checkbox = z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean());
const optionalUuid = z.preprocess((v) => (v === "" || v == null ? null : v), uuid.nullable());

async function db() {
  const viewer = await requireAdmin();
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is niet geconfigureerd.");
  return { supabase, viewer };
}

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Controleer de invoer.";

function friendly(message: string) {
  if (message.includes("questions_publishable") || message.includes("summaries_reviewed_before_publish"))
    return "Publiceren kan pas als je aanvinkt dat je de inhoud hebt gecontroleerd (en de rechten geregeld zijn).";
  if (message.includes("exams_rights_before_publish"))
    return "Een tentamen kan pas gepubliceerd worden als de rechten geregeld zijn (bijv. eigen werk).";
  if (message.includes("option_in_use"))
    return "Je kunt geen antwoordoptie verwijderen die studenten al hebben gekozen. Pas de tekst aan in plaats van te verwijderen.";
  if (message.includes("correct_option_missing")) return "Kies welk antwoord juist is.";
  if (message.includes("need_two_options")) return "Een vraag heeft minimaal twee antwoordopties nodig.";
  if (message.includes("admin_save_question") && message.includes("does not exist"))
    return "De database mist nog een update. Voer het nieuwste migratiebestand uit in de Supabase SQL Editor.";
  return `Opslaan mislukt: ${message}`;
}

// ---------------------------------------------------------------- topics

async function uniqueTopicSlug(supabase: Awaited<ReturnType<typeof db>>["supabase"], courseId: string, title: string, ownId?: string) {
  const base = slugify(title) || "onderwerp";
  const { data } = await supabase.from("topics").select("id, slug").eq("course_id", courseId).like("slug", `${base}%`);
  const taken = new Set((data ?? []).filter((t) => t.id !== ownId).map((t) => t.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

const topicSchema = z.object({
  courseId: uuid,
  title: z.string().trim().min(2, "Geef het onderwerp een titel.").max(160),
  parentId: optionalUuid,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export async function createTopic(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = topicSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { supabase } = await db();
  const { courseId, title, parentId, sortOrder } = parsed.data;
  const slug = await uniqueTopicSlug(supabase, courseId, title);
  const { data, error } = await supabase
    .from("topics")
    .insert({ course_id: courseId, title, parent_id: parentId, sort_order: sortOrder, slug, status: "draft" })
    .select("id")
    .single();
  if (error) return { error: friendly(error.message) };
  redirect(`/admin/onderwerpen/${data.id}?nieuw=1`);
}

export async function updateTopic(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = topicSchema.extend({ id: uuid, status }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { supabase } = await db();
  const { id, courseId, title, parentId, sortOrder, status: st } = parsed.data;
  if (parentId === id) return { error: "Een onderwerp kan geen subonderwerp van zichzelf zijn." };
  const slug = await uniqueTopicSlug(supabase, courseId, title, id);
  const { error } = await supabase
    .from("topics")
    .update({ title, parent_id: parentId, sort_order: sortOrder, slug, status: st })
    .eq("id", id);
  if (error) return { error: friendly(error.message) };
  revalidatePath("/admin", "layout");
  revalidatePath("/vakken", "layout");
  return { success: "Onderwerp opgeslagen." };
}

// ---------------------------------------------------------------- learning objectives

export async function saveObjectives(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ topicId: uuid, lines: z.string().max(20000), published: checkbox, source: z.string().trim().max(300) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { supabase } = await db();
  const { topicId, published, source } = parsed.data;
  const wanted = parsed.data.lines
    .split("\n")
    .map((l) => l.trim().replace(/^[-*•]\s*|^\d+[.)]\s*/, ""))
    .filter(Boolean);

  const { data: existing, error: readErr } = await supabase.from("learning_objectives").select("id, body").eq("topic_id", topicId);
  if (readErr) return { error: friendly(readErr.message) };

  // Unchanged lines keep their id, so students' ticks survive edits elsewhere in the list.
  const pool = new Map<string, string[]>();
  for (const o of existing ?? []) pool.set(o.body, [...(pool.get(o.body) ?? []), o.id]);
  const keepIds: string[] = [];
  const rows = wanted.map((body, i) => {
    const id = pool.get(body)?.shift();
    if (id) keepIds.push(id);
    return { id: id ?? randomUUID(), topic_id: topicId, body, sort_order: i, status: published ? "published" : "draft", source: source || null };
  });
  const remove = (existing ?? []).map((o) => o.id).filter((id) => !keepIds.includes(id));

  if (remove.length) {
    const { error } = await supabase.from("learning_objectives").delete().in("id", remove);
    if (error) return { error: friendly(error.message) };
  }
  if (rows.length) {
    const { error } = await supabase.from("learning_objectives").upsert(rows);
    if (error) return { error: friendly(error.message) };
  }
  revalidatePath("/vakken", "layout");
  return { success: `${rows.length} leerdoelen opgeslagen${published ? " en gepubliceerd" : " als concept"}.` };
}

// ---------------------------------------------------------------- summaries

export async function saveSummary(_: FormState, formData: FormData): Promise<FormState & { id?: string }> {
  const parsed = z
    .object({
      id: optionalUuid,
      topicId: uuid,
      title: z.string().trim().min(2, "Geef de samenvatting een titel.").max(200),
      markup: z.string().max(400000),
      isPremium: checkbox,
      reviewed: checkbox,
      status,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { supabase, viewer } = await db();
  const d = parsed.data;

  const content = blocksSchema.safeParse(parseMarkup(d.markup));
  if (!content.success) return { error: "De tekst kon niet worden omgezet. Controleer tabellen en afbeeldingen." };

  const row = {
    topic_id: d.topicId,
    title: d.title,
    content: content.data,
    is_premium: d.isPremium,
    reviewed_at: d.reviewed ? new Date().toISOString() : null,
    reviewed_by: d.reviewed ? viewer.user.id : null,
    status: d.status,
  };
  const { data, error } = d.id
    ? await supabase.from("summaries").update(row).eq("id", d.id).select("id").single()
    : await supabase.from("summaries").insert(row).select("id").single();
  if (error) return { error: friendly(error.message) };
  revalidatePath("/vakken", "layout");
  return { success: d.status === "published" ? "Samenvatting gepubliceerd." : "Samenvatting opgeslagen als concept.", id: data.id };
}

// ---------------------------------------------------------------- uploads

const IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };

/** Stores an image in the private bucket and returns its path plus a short-lived preview URL. */
export async function uploadImage(formData: FormData): Promise<{ ok: true; path: string; url: string } | { ok: false; error: string }> {
  const parsed = z.object({ courseId: uuid, premium: checkbox }).safeParse(Object.fromEntries(formData));
  const file = formData.get("file");
  if (!parsed.success || !(file instanceof File)) return { ok: false, error: "Kies een afbeelding." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, error: "Gebruik een PNG-, JPG-, WebP- of SVG-afbeelding." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "De afbeelding is groter dan 10 MB." };

  const { supabase } = await db();
  const path = `${parsed.data.courseId}/${parsed.data.premium ? "premium" : "free"}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("course-content").upload(path, file, { contentType: file.type });
  if (error) return { ok: false, error: `Uploaden mislukt: ${error.message}` };
  const { data } = await supabase.storage.from("course-content").createSignedUrl(path, 60 * 60);
  return { ok: true, path, url: data?.signedUrl ?? "" };
}

// ---------------------------------------------------------------- exams

export async function saveExam(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      id: optionalUuid,
      courseId: uuid,
      // Optional: reconstructed exams often have no known year.
      examYear: z.union([z.literal(""), z.coerce.number().int().min(1990, "Vul een geldig jaar in.").max(2100, "Vul een geldig jaar in.")]),
      examType: z.enum(["regular", "resit", "midterm", "practice"]),
      title: z.string().trim().max(200),
      questionCount: z.union([z.literal(""), z.coerce.number().int().min(0).max(1000)]),
      hasExplanations: checkbox,
      source: z.string().trim().min(2, "Vermeld de bron, bijvoorbeeld 'Eigen werk'.").max(300),
      rightsStatus: rights,
      isPremium: checkbox,
      status,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { supabase } = await db();
  const d = parsed.data;
  const row = {
    course_id: d.courseId,
    exam_year: d.examYear === "" ? null : d.examYear,
    exam_type: d.examType,
    title: d.title || null,
    question_count: d.questionCount === "" ? null : d.questionCount,
    has_explanations: d.hasExplanations,
    source: d.source,
    rights_status: d.rightsStatus,
    is_premium: d.isPremium,
    status: d.status,
  };
  const { error } = d.id ? await supabase.from("exams").update(row).eq("id", d.id) : await supabase.from("exams").insert(row);
  if (error) return { error: friendly(error.message) };
  revalidatePath("/admin", "layout");
  revalidatePath("/vakken", "layout");
  return { success: d.id ? "Tentamen bijgewerkt." : "Tentamen toegevoegd." };
}

// ---------------------------------------------------------------- questions

const questionSchema = z.object({
  id: optionalUuid,
  courseId: uuid,
  topicId: uuid,
  examId: optionalUuid,
  stem: z.string().trim().min(5, "Schrijf de vraag uit.").max(8000),
  imagePath: z.string().max(500).default(""),
  imageAlt: z.string().trim().max(300).default(""),
  difficulty: z.union([z.literal(""), z.coerce.number().int().min(1).max(5)]),
  source: z.string().trim().min(2, "Vermeld de bron, bijvoorbeeld 'Eigen werk'.").max(300),
  copyrightStatus: rights,
  isPremium: checkbox,
  reviewed: checkbox,
  status,
  options: z
    .array(z.object({ label: z.string().regex(/^[A-Z]$/), body: z.string().trim().min(1, "Vul alle antwoordopties in."), feedback: z.string().trim().max(2000) }))
    .min(2, "Een vraag heeft minimaal twee antwoordopties nodig.")
    .max(8),
  correctLabel: z.string().regex(/^[A-Z]$/, "Kies welk antwoord juist is."),
  explanation: z.string().trim().min(5, "Schrijf een uitleg bij het juiste antwoord.").max(8000),
  concept: z.string().trim().max(1000),
});

export type QuestionInput = z.input<typeof questionSchema>;

export async function saveQuestion(input: QuestionInput): Promise<FormState> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const d = parsed.data;
  if (d.imagePath && !d.imageAlt) return { error: "Beschrijf de afbeelding kort (voor schermlezers)." };
  const { supabase } = await db();
  const { error } = await supabase.rpc("admin_save_question", {
    p: {
      id: d.id,
      course_id: d.courseId,
      topic_id: d.topicId,
      exam_id: d.examId,
      stem: d.stem,
      image_path: d.imagePath,
      image_alt: d.imageAlt,
      difficulty: d.difficulty === "" ? "" : String(d.difficulty),
      source: d.source,
      copyright_status: d.copyrightStatus,
      is_premium: d.isPremium,
      reviewed: d.reviewed,
      status: d.status,
      options: d.options.map(({ label, body }) => ({ label, body })),
      correct_label: d.correctLabel,
      explanation: d.explanation,
      concept: d.concept,
      option_feedback: Object.fromEntries(d.options.filter((o) => o.feedback).map((o) => [o.label, o.feedback])),
    },
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/admin", "layout");
  revalidatePath("/vakken", "layout");
  redirect(`/admin/onderwerpen/${d.topicId}?opgeslagen=vraag#vragen`);
}
