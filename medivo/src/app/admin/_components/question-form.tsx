"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { FormMessage } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { saveQuestion, uploadImage, type QuestionInput } from "../content-actions";
import { FieldLabel, inputClass, rightsLabel, statusLabel, textareaClass } from "./ui";

type Option = { label: string; body: string; feedback: string };
type Status = keyof typeof statusLabel;
type Rights = keyof typeof rightsLabel;

export type QuestionDraft = {
  id: string | null;
  topicId: string;
  examId: string | null;
  stem: string;
  imagePath: string;
  imageUrl: string | null;
  imageAlt: string;
  difficulty: string;
  source: string;
  copyrightStatus: Rights;
  isPremium: boolean;
  reviewed: boolean;
  status: Status;
  options: Option[];
  correctLabel: string;
  explanation: string;
  concept: string;
};

const LABELS = "ABCDEFGH".split("");

export function QuestionForm({
  courseId,
  draft,
  topics,
  exams,
}: {
  courseId: string;
  draft: QuestionDraft;
  topics: { id: string; title: string }[];
  exams: { id: string; label: string }[];
}) {
  const [q, setQ] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof QuestionDraft>(k: K, v: QuestionDraft[K]) => setQ((s) => ({ ...s, [k]: v }));

  const setOption = (i: number, patch: Partial<Option>) =>
    setQ((s) => ({ ...s, options: s.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) }));

  function removeOption(i: number) {
    setQ((s) => {
      const removed = s.options[i].label;
      // Relabel so options stay A, B, C… without gaps.
      const options = s.options.filter((_, j) => j !== i).map((o, j) => ({ ...o, label: LABELS[j] }));
      const oldIndex = s.options.findIndex((o) => o.label === s.correctLabel);
      const correctLabel = removed === s.correctLabel ? "" : LABELS[oldIndex > i ? oldIndex - 1 : oldIndex];
      return { ...s, options, correctLabel };
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: QuestionInput = {
      id: q.id,
      courseId,
      topicId: q.topicId,
      examId: q.examId,
      stem: q.stem,
      imagePath: q.imagePath,
      imageAlt: q.imageAlt,
      difficulty: q.difficulty,
      source: q.source,
      copyrightStatus: q.copyrightStatus,
      isPremium: q.isPremium,
      reviewed: q.reviewed,
      status: q.status,
      options: q.options,
      correctLabel: q.correctLabel,
      explanation: q.explanation,
      concept: q.concept,
    };
    startSave(async () => {
      const res = await saveQuestion(input);
      // On success the action redirects; anything returned is an error.
      if (res?.error) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  function upload(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("courseId", courseId);
    fd.set("premium", String(q.isPremium));
    startUpload(async () => {
      const res = await uploadImage(fd);
      if (!res.ok) return setError(res.error);
      setQ((s) => ({ ...s, imagePath: res.path, imageUrl: res.url }));
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      <FormMessage error={error ?? undefined} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel htmlFor="q-topic">
          Onderwerp
          <select id="q-topic" value={q.topicId} onChange={(e) => set("topicId", e.target.value)} className={inputClass}>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </FieldLabel>
        <FieldLabel htmlFor="q-exam" hint="Optioneel: hoort deze vraag bij een (proef)tentamen?">
          Tentamen
          <select id="q-exam" value={q.examId ?? ""} onChange={(e) => set("examId", e.target.value || null)} className={inputClass}>
            <option value="">Geen</option>
            {exams.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </FieldLabel>
      </div>

      <FieldLabel htmlFor="q-stem">
        Vraag
        <textarea id="q-stem" rows={5} value={q.stem} onChange={(e) => set("stem", e.target.value)} className={textareaClass} />
      </FieldLabel>

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="border-line text-navy">
            {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
            {q.imagePath ? "Andere afbeelding" : "Afbeelding toevoegen (optioneel)"}
          </Button>
          {q.imagePath ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setQ((s) => ({ ...s, imagePath: "", imageUrl: null, imageAlt: "" }))}>
              Afbeelding verwijderen
            </Button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </div>
        {q.imagePath ? (
          <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start">
            {q.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.imageUrl} alt="" className="max-h-40 rounded-md border border-line" />
            ) : (
              <div className="grid h-24 place-items-center rounded-md border border-dashed border-line text-xs text-muted-ink">Afbeelding</div>
            )}
            <FieldLabel htmlFor="q-alt" hint="Kort wat er te zien is, voor schermlezers.">
              Beschrijving van de afbeelding
              <input id="q-alt" value={q.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} className={inputClass} />
            </FieldLabel>
          </div>
        ) : null}
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-semibold text-navy">Antwoordopties · kies het juiste antwoord</legend>
        {q.options.map((o, i) => (
          <div key={o.label} className="grid gap-2 rounded-lg border border-line p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-navy">
                <input
                  type="radio"
                  name="correct"
                  checked={q.correctLabel === o.label}
                  onChange={() => set("correctLabel", o.label)}
                  className="size-4 accent-success"
                  aria-label={`${o.label} is het juiste antwoord`}
                />
                {o.label}.
              </label>
              <label htmlFor={`q-opt-${o.label}`} className="sr-only">Antwoordoptie {o.label}</label>
              <input id={`q-opt-${o.label}`} value={o.body} onChange={(e) => setOption(i, { body: e.target.value })} className={inputClass} />
              {q.options.length > 2 ? (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(i)} aria-label={`Optie ${o.label} verwijderen`}>
                  <Trash2 aria-hidden="true" />
                </Button>
              ) : null}
            </div>
            {q.correctLabel && q.correctLabel !== o.label ? (
              <div className="pl-10">
                <label htmlFor={`q-fb-${o.label}`} className="sr-only">Waarom {o.label} niet klopt</label>
                <input
                  id={`q-fb-${o.label}`}
                  value={o.feedback}
                  onChange={(e) => setOption(i, { feedback: e.target.value })}
                  placeholder="Waarom dit antwoord niet klopt (optioneel)"
                  className={`${inputClass} h-9 text-sm`}
                />
              </div>
            ) : null}
          </div>
        ))}
        {q.options.length < LABELS.length ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQ((s) => ({ ...s, options: [...s.options, { label: LABELS[s.options.length], body: "", feedback: "" }] }))}
            className="justify-self-start border-line text-navy"
          >
            <Plus aria-hidden="true" /> Optie toevoegen
          </Button>
        ) : null}
      </fieldset>

      <FieldLabel htmlFor="q-expl" hint="Wat studenten zien na het beantwoorden.">
        Uitleg bij het juiste antwoord
        <textarea id="q-expl" rows={5} value={q.explanation} onChange={(e) => set("explanation", e.target.value)} className={textareaClass} />
      </FieldLabel>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <FieldLabel htmlFor="q-concept">
          Onderliggend concept (optioneel)
          <input id="q-concept" value={q.concept} onChange={(e) => set("concept", e.target.value)} className={inputClass} />
        </FieldLabel>
        <FieldLabel htmlFor="q-diff">
          Moeilijkheid
          <select id="q-diff" value={q.difficulty} onChange={(e) => set("difficulty", e.target.value)} className={inputClass}>
            <option value="">–</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </FieldLabel>
      </div>

      <fieldset className="grid gap-4 rounded-lg border border-line bg-canvas p-4">
        <legend className="px-1 text-sm font-semibold text-navy">Bron en publicatie</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldLabel htmlFor="q-source">
            Bron
            <input id="q-source" value={q.source} onChange={(e) => set("source", e.target.value)} className={inputClass} />
          </FieldLabel>
          <FieldLabel htmlFor="q-rights">
            Rechten
            <select id="q-rights" value={q.copyrightStatus} onChange={(e) => set("copyrightStatus", e.target.value as Rights)} className={inputClass}>
              {Object.entries(rightsLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel htmlFor="q-status">
            Status
            <select id="q-status" value={q.status} onChange={(e) => set("status", e.target.value as Status)} className={inputClass}>
              {Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FieldLabel>
        </div>
        <label className="flex items-start gap-3 text-sm text-navy">
          <input type="checkbox" checked={q.reviewed} onChange={(e) => set("reviewed", e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-navy" />
          <span>
            <span className="font-medium">Ik heb deze vraag inhoudelijk gecontroleerd</span>
            <span className="block text-xs text-muted-ink">Verplicht om te publiceren.</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-navy">
          <input type="checkbox" checked={q.isPremium} onChange={(e) => set("isPremium", e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-navy" />
          <span>
            <span className="font-medium">Alleen voor betalende gebruikers</span>
            <span className="block text-xs text-muted-ink">Zolang betalen nog niet aanstaat, zien studenten deze vraag dan niet.</span>
          </span>
        </label>
      </fieldset>

      <Button type="submit" disabled={saving} className="h-11 justify-self-start px-6 font-semibold">
        {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Vraag opslaan
      </Button>
    </form>
  );
}
