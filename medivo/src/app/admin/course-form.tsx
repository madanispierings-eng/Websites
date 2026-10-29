"use client";

import { useFormAction } from "@/components/forms/use-form-action";
import { FormMessage, SubmitButton } from "@/components/forms/fields";
import type { FormState } from "@/app/(auth)/actions";
import { updateCourse } from "./actions";

export type AdminCourse = { id: string; title: string; slug: string; study_year: number; ec: number | null; description: string | null; status: string };

export function CourseForm({ course }: { course: AdminCourse }) {
  const [state, onSubmit, pending] = useFormAction<FormState>(updateCourse, {});
  const p = `c-${course.id}`;
  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input type="hidden" name="id" value={course.id} />
      <div className="grid gap-3 sm:grid-cols-[8rem_10rem]">
        <label htmlFor={`${p}-ec`} className="grid gap-1 text-xs font-medium text-navy">
          EC
          <input id={`${p}-ec`} name="ec" inputMode="decimal" defaultValue={course.ec ?? ""} placeholder="Onbekend" className="h-9 rounded-md border border-input bg-white px-2 text-sm font-normal" />
        </label>
        <label htmlFor={`${p}-status`} className="grid gap-1 text-xs font-medium text-navy">
          Status
          <select id={`${p}-status`} name="status" defaultValue={course.status} className="h-9 rounded-md border border-input bg-white px-2 text-sm font-normal">
            <option value="draft">Concept</option>
            <option value="published">Gepubliceerd</option>
            <option value="archived">Gearchiveerd</option>
          </select>
        </label>
      </div>
      <label htmlFor={`${p}-desc`} className="grid gap-1 text-xs font-medium text-navy">
        Beschrijving
        <textarea id={`${p}-desc`} name="description" rows={3} defaultValue={course.description ?? ""} className="rounded-md border border-input bg-white px-2 py-1.5 text-sm font-normal" />
      </label>
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending} className="h-9 w-auto px-4">Opslaan</SubmitButton>
        <div className="flex-1"><FormMessage error={state.error} success={state.success} /></div>
      </div>
    </form>
  );
}
