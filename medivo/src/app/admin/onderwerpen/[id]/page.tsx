import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { FormMessage } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { blocksSchema } from "@/lib/content/blocks";
import { toMarkup } from "@/lib/content/markup";
import { container } from "@/lib/site";
import { cn } from "@/lib/utils";
import { adminDb, getAdminTopics, signedUrls } from "../../_components/data";
import { ObjectivesForm, TopicForm } from "../../_components/forms";
import { SummaryEditor } from "../../_components/summary-editor";
import { AdminCrumbs, Panel, StatusBadge } from "../../_components/ui";

export const metadata: Metadata = { title: "Onderwerp beheren", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ nieuw?: string; opgeslagen?: string }> };

export default async function AdminTopicPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { nieuw, opgeslagen } = await searchParams;
  const supabase = await adminDb();

  const { data: topic } = await supabase
    .from("topics")
    .select("id, course_id, parent_id, title, slug, sort_order, status, courses(title, slug)")
    .eq("id", id)
    .maybeSingle();
  if (!topic) notFound();
  const course = (Array.isArray(topic.courses) ? topic.courses[0] : topic.courses) as { title: string; slug: string };

  const [topics, objectives, summaries, questions] = await Promise.all([
    getAdminTopics(topic.course_id),
    supabase.from("learning_objectives").select("body, status, source").eq("topic_id", id).order("sort_order"),
    supabase.from("summaries").select("id, title, content, is_premium, reviewed_at, status").eq("topic_id", id).order("created_at"),
    supabase.from("questions").select("id, stem, status, is_premium").eq("topic_id", id).order("created_at"),
  ]);

  const summary = summaries.data?.[0] ?? null;
  const blocks = summary ? blocksSchema.safeParse(summary.content) : null;
  const imagePaths = blocks?.success ? blocks.data.flatMap((b) => (b.type === "image" ? [b.path] : [])) : [];
  const imageUrls = await signedUrls(imagePaths);
  const objs = objectives.data ?? [];

  return (
    <main id="inhoud" className={cn(container, "flex-1 space-y-6 py-10")}>
      <div>
        <AdminCrumbs items={[{ href: `/admin/vakken/${course.slug}`, label: course.title }, { label: topic.title }]} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-navy">{topic.title}</h1>
          <StatusBadge status={topic.status} />
        </div>
      </div>

      {nieuw ? <FormMessage success="Onderwerp aangemaakt. Voeg hieronder de inhoud toe en publiceer het onderwerp als alles klaar is." /> : null}
      {opgeslagen === "vraag" ? <FormMessage success="Vraag opgeslagen." /> : null}

      <Panel id="onderwerp" title="Onderwerp" description="Studenten zien de inhoud pas als het onderwerp én de inhoud zelf gepubliceerd zijn.">
        <TopicForm
          courseId={topic.course_id}
          topic={{ id: topic.id, title: topic.title, parentId: topic.parent_id, sortOrder: topic.sort_order, status: topic.status }}
          parents={topics.filter((t) => !t.parent_id && t.id !== topic.id).map((t) => ({ id: t.id, title: t.title }))}
        />
      </Panel>

      <Panel id="samenvatting" title="Samenvatting">
        {summaries.data && summaries.data.length > 1 ? (
          <p className="mb-4 text-sm text-muted-ink">Dit onderwerp heeft {summaries.data.length} hoofdstukken; hier bewerk je het eerste.</p>
        ) : null}
        <SummaryEditor
          courseId={topic.course_id}
          topicId={topic.id}
          initialImageUrls={imageUrls}
          summary={
            summary
              ? {
                  id: summary.id,
                  title: summary.title,
                  markup: blocks?.success ? toMarkup(blocks.data) : "",
                  isPremium: summary.is_premium,
                  reviewed: Boolean(summary.reviewed_at),
                  status: summary.status,
                }
              : null
          }
        />
      </Panel>

      <Panel id="leerdoelen" title="Leerdoelen">
        <ObjectivesForm
          topicId={topic.id}
          lines={objs.map((o) => o.body).join("\n")}
          published={objs.length > 0 && objs.every((o) => o.status === "published")}
          source={objs[0]?.source ?? ""}
        />
      </Panel>

      <Panel
        id="vragen"
        title="Oefenvragen"
        actions={
          <Button asChild size="sm">
            <Link href={`/admin/vragen/nieuw?onderwerp=${topic.id}`}><Plus aria-hidden="true" /> Nieuwe vraag</Link>
          </Button>
        }
      >
        {questions.data?.length ? (
          <ol className="divide-y divide-line rounded-lg border border-line">
            {questions.data.map((q, i) => (
              <li key={q.id}>
                <Link href={`/admin/vragen/${q.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-canvas">
                  <span className="w-6 text-right text-xs tabular-nums text-muted-ink">{i + 1}</span>
                  <span className="line-clamp-1 flex-1 text-navy">{q.stem}</span>
                  {q.is_premium ? <span className="text-xs text-muted-ink">Betaald</span> : null}
                  <StatusBadge status={q.status} />
                  <ChevronRight className="size-4 text-navy/50" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-ink">Nog geen vragen bij dit onderwerp.</p>
        )}
      </Panel>
    </main>
  );
}
