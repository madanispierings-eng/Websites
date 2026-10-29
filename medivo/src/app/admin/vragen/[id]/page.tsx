import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "../../_components/data";
import { QuestionPage } from "../question-page";

export const metadata: Metadata = { title: "Vraag bewerken", robots: { index: false, follow: false } };

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminDb();
  const { data: q } = await supabase
    .from("questions")
    .select("id, topic_id, exam_id, stem, image_path, image_alt, difficulty, source, copyright_status, is_premium, reviewed_at, status, question_options(id, label, body, sort_order), question_answer_keys(correct_option_id, explanation, concept, option_feedback)")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  const options = [...(q.question_options as { id: string; label: string; body: string; sort_order: number }[])].sort((a, b) => a.sort_order - b.sort_order);
  const keyRaw = q.question_answer_keys as unknown;
  const key = (Array.isArray(keyRaw) ? keyRaw[0] : keyRaw) as
    | { correct_option_id: string; explanation: string; concept: string | null; option_feedback: Record<string, string> }
    | null;

  return (
    <QuestionPage
      topicId={q.topic_id}
      draft={{
        id: q.id,
        examId: q.exam_id,
        stem: q.stem,
        imagePath: q.image_path ?? "",
        imageUrl: null,
        imageAlt: q.image_alt ?? "",
        difficulty: q.difficulty ? String(q.difficulty) : "",
        source: q.source,
        copyrightStatus: q.copyright_status,
        isPremium: q.is_premium,
        reviewed: Boolean(q.reviewed_at),
        status: q.status,
        options: options.map((o) => ({ label: o.label, body: o.body, feedback: key?.option_feedback?.[o.id] ?? "" })),
        correctLabel: options.find((o) => o.id === key?.correct_option_id)?.label ?? "",
        explanation: key?.explanation ?? "",
        concept: key?.concept ?? "",
      }}
    />
  );
}
