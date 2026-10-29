"use client";

import { FormMessage, SubmitButton } from "@/components/forms/fields";
import type { FormState } from "@/app/(auth)/actions";
import { createTopic, saveExam, saveObjectives, updateTopic } from "../content-actions";
import { PublishFields } from "./publish-fields";
import { useFormAction } from "@/components/forms/use-form-action";
import { FieldLabel, inputClass, textareaClass } from "./ui";

type TopicOption = { id: string; title: string };

export function TopicForm({
  courseId,
  topic,
  parents,
}: {
  courseId: string;
  topic?: { id: string; title: string; parentId: string | null; sortOrder: number; status: "draft" | "published" | "archived" };
  parents: TopicOption[];
}) {
  const [state, onSubmit, pending] = useFormAction<FormState>(topic ? updateTopic : createTopic, {});
  const p = topic ? `topic-${topic.id}` : "topic-new";
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormMessage error={state.error} success={state.success} />
      <input type="hidden" name="courseId" value={courseId} />
      {topic ? <input type="hidden" name="id" value={topic.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem_7rem]">
        <FieldLabel htmlFor={`${p}-title`}>
          Titel
          <input id={`${p}-title`} name="title" required defaultValue={topic?.title} className={inputClass} />
        </FieldLabel>
        <FieldLabel htmlFor={`${p}-parent`}>
          Hoort bij
          <select id={`${p}-parent`} name="parentId" defaultValue={topic?.parentId ?? ""} className={inputClass}>
            <option value="">Hoofdonderwerp</option>
            {parents.filter((t) => t.id !== topic?.id).map((t) => <option key={t.id} value={t.id}>Sub van: {t.title}</option>)}
          </select>
        </FieldLabel>
        <FieldLabel htmlFor={`${p}-order`}>
          Volgorde
          <input id={`${p}-order`} name="sortOrder" type="number" min={0} defaultValue={topic?.sortOrder ?? 0} className={inputClass} />
        </FieldLabel>
      </div>
      {topic ? (
        <FieldLabel htmlFor={`${p}-status`} hint="Studenten zien een onderwerp pas als het gepubliceerd is.">
          Status
          <select id={`${p}-status`} name="status" defaultValue={topic.status} className={`${inputClass} sm:max-w-xs`}>
            <option value="draft">Concept</option>
            <option value="published">Gepubliceerd</option>
            <option value="archived">Gearchiveerd</option>
          </select>
        </FieldLabel>
      ) : null}
      <SubmitButton pending={pending} className="w-auto justify-self-start px-5">{topic ? "Opslaan" : "Onderwerp toevoegen"}</SubmitButton>
    </form>
  );
}

export function ObjectivesForm({ topicId, lines, published, source }: { topicId: string; lines: string; published: boolean; source: string }) {
  const [state, onSubmit, pending] = useFormAction<FormState>(saveObjectives, {});
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormMessage error={state.error} success={state.success} />
      <input type="hidden" name="topicId" value={topicId} />
      <FieldLabel htmlFor="obj-lines" hint="Eén leerdoel per regel.">
        Leerdoelen
        <textarea id="obj-lines" name="lines" rows={8} defaultValue={lines} className={textareaClass} placeholder={"De student kan …\nDe student kan …"} />
      </FieldLabel>
      <FieldLabel htmlFor="obj-source" hint="Bijvoorbeeld de studiehandleiding of 'Eigen formulering'.">
        Bron (optioneel)
        <input id="obj-source" name="source" defaultValue={source} className={inputClass} />
      </FieldLabel>
      <label className="flex items-center gap-3 text-sm font-medium text-navy">
        <input type="checkbox" name="published" defaultChecked={published} className="size-4 accent-navy" />
        Gepubliceerd (zichtbaar voor studenten)
      </label>
      <SubmitButton pending={pending} className="w-auto justify-self-start px-5">Leerdoelen opslaan</SubmitButton>
    </form>
  );
}

export type ExamRow = {
  id: string;
  exam_year: number;
  exam_type: "regular" | "resit" | "midterm" | "practice";
  title: string | null;
  question_count: number | null;
  has_explanations: boolean;
  source: string;
  rights_status: "unknown" | "permission_requested" | "licensed" | "own_work" | "public_domain";
  is_premium: boolean;
  status: "draft" | "published" | "archived";
};

export function ExamForm({ courseId, exam }: { courseId: string; exam?: ExamRow }) {
  const [state, onSubmit, pending] = useFormAction<FormState>(saveExam, {});
  const p = exam ? `exam-${exam.id}` : "exam-new";
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <FormMessage error={state.error} success={state.success} />
      <input type="hidden" name="courseId" value={courseId} />
      {exam ? <input type="hidden" name="id" value={exam.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-[7rem_12rem_minmax(0,1fr)]">
        <FieldLabel htmlFor={`${p}-year`}>
          Jaar
          <input id={`${p}-year`} name="examYear" type="number" required defaultValue={exam?.exam_year ?? new Date().getFullYear()} className={inputClass} />
        </FieldLabel>
        <FieldLabel htmlFor={`${p}-type`}>
          Soort
          <select id={`${p}-type`} name="examType" defaultValue={exam?.exam_type ?? "practice"} className={inputClass}>
            <option value="practice">Proeftentamen</option>
            <option value="regular">Tentamen</option>
            <option value="resit">Hertentamen</option>
            <option value="midterm">Deeltoets</option>
          </select>
        </FieldLabel>
        <FieldLabel htmlFor={`${p}-title`}>
          Titel (optioneel)
          <input id={`${p}-title`} name="title" defaultValue={exam?.title ?? ""} className={inputClass} />
        </FieldLabel>
      </div>
      <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <FieldLabel htmlFor={`${p}-count`}>
          Aantal vragen
          <input id={`${p}-count`} name="questionCount" type="number" min={0} defaultValue={exam?.question_count ?? ""} className={inputClass} />
        </FieldLabel>
        <FieldLabel htmlFor={`${p}-source`}>
          Bron
          <input id={`${p}-source`} name="source" required defaultValue={exam?.source ?? "Eigen werk"} className={inputClass} />
        </FieldLabel>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium text-navy">
        <input type="checkbox" name="hasExplanations" defaultChecked={exam?.has_explanations ?? true} className="size-4 accent-navy" />
        Met uitwerkingen
      </label>
      <PublishFields prefix={p} status={exam?.status ?? "draft"} isPremium={exam?.is_premium ?? false} rights={exam?.rights_status ?? "own_work"} showReview={false} />
      <SubmitButton pending={pending} className="w-auto justify-self-start px-5">{exam ? "Tentamen opslaan" : "Tentamen toevoegen"}</SubmitButton>
    </form>
  );
}
