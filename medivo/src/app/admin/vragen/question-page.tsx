import { notFound } from "next/navigation";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";
import { adminDb, examLabel, getAdminExams, getAdminTopics, signedUrls, topicTree } from "../_components/data";
import { QuestionForm, type QuestionDraft } from "../_components/question-form";
import { AdminCrumbs, Panel } from "../_components/ui";

/** Shared by "new question" and "edit question": loads the course context around a topic. */
export async function QuestionPage({ topicId, draft }: { topicId: string; draft: Omit<QuestionDraft, "topicId"> }) {
  const supabase = await adminDb();
  const { data: topic } = await supabase.from("topics").select("id, title, course_id, courses(title, slug)").eq("id", topicId).maybeSingle();
  if (!topic) notFound();
  const course = (Array.isArray(topic.courses) ? topic.courses[0] : topic.courses) as { title: string; slug: string };
  const [topics, exams] = await Promise.all([getAdminTopics(topic.course_id), getAdminExams(topic.course_id)]);
  const imageUrl = draft.imagePath ? (await signedUrls([draft.imagePath]))[draft.imagePath] ?? null : null;

  return (
    <main id="inhoud" className={cn(container, "flex-1 space-y-6 py-10")}>
      <div>
        <AdminCrumbs
          items={[
            { href: `/admin/vakken/${course.slug}`, label: course.title },
            { href: `/admin/onderwerpen/${topic.id}#vragen`, label: topic.title },
            { label: draft.id ? "Vraag bewerken" : "Nieuwe vraag" },
          ]}
        />
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-navy">{draft.id ? "Vraag bewerken" : "Nieuwe vraag"}</h1>
      </div>
      <Panel title="Vraag" description="Studenten zien het juiste antwoord en de uitleg pas nadat ze hebben geantwoord.">
        <QuestionForm
          courseId={topic.course_id}
          draft={{ ...draft, topicId: topic.id, imageUrl }}
          topics={topicTree(topics).map((t) => ({ id: t.id, title: t.depth ? `— ${t.title}` : t.title }))}
          exams={exams.map((e) => ({ id: e.id, label: examLabel(e) }))}
        />
      </Panel>
    </main>
  );
}
