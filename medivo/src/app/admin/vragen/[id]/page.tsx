import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";
import { adminDb } from "../../_components/data";
import { Panel } from "../../_components/ui";
import { QuestionPage } from "../question-page";

const typeLabel: Record<string, string> = {
  multiple_choice: "meerdere antwoorden mogelijk",
  dropdowns: "keuzelijsten (list-box, koppel- of invulvraag)",
  numeric: "rekenvraag met kort antwoord",
  open: "open vraag",
};

export const metadata: Metadata = { title: "Vraag bewerken", robots: { index: false, follow: false } };

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminDb();
  const { data: q } = await supabase
    .from("questions")
    .select("id, topic_id, exam_id, type, stem, image_path, image_alt, difficulty, source, copyright_status, is_premium, reviewed_at, status, question_options(id, label, body, sort_order), question_answer_keys(correct_option_id, explanation, concept, option_feedback)")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  // The editor only knows single-choice questions; saving another type through it would break its answer key.
  if (q.type !== "single_choice") {
    return (
      <main id="inhoud" className={cn(container, "flex-1 space-y-6 py-10")}>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy">Vraag bekijken</h1>
        <Panel title="Dit vraagtype kun je hier nog niet bewerken" description={`Type: ${typeLabel[q.type as string] ?? q.type}. Deze vraag is ingevoerd via een import.`}>
          <p className="whitespace-pre-line text-sm leading-relaxed text-navy">{q.stem}</p>
        </Panel>
      </main>
    );
  }

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
