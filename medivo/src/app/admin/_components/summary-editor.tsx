"use client";

import { useActionState, useDeferredValue, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { ContentBlocks } from "@/components/content-blocks";
import { FormMessage, SubmitButton } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { parseMarkup } from "@/lib/content/markup";
import type { FormState } from "@/app/(auth)/actions";
import { saveSummary, uploadImage } from "../content-actions";
import { PublishFields } from "./publish-fields";
import { FieldLabel, inputClass, textareaClass } from "./ui";

const snippets = [
  { label: "Kop", text: "## Kop\n" },
  { label: "Subkop", text: "### Subkop\n" },
  { label: "Opsomming", text: "- eerste punt\n- tweede punt\n" },
  { label: "Genummerd", text: "1. eerste stap\n2. tweede stap\n" },
  { label: "Tabel", text: "| Kolom 1 | Kolom 2 |\n|---|---|\n| … | … |\n" },
  { label: "Let op", text: "> Let op: \n" },
  { label: "Klinisch", text: "> Klinisch: \n" },
  { label: "Formule", text: "$$ … $$\n" },
  { label: "Bron", text: "[1] \n" },
];

export function SummaryEditor({
  courseId,
  topicId,
  summary,
  initialImageUrls,
}: {
  courseId: string;
  topicId: string;
  summary: { id: string; title: string; markup: string; isPremium: boolean; reviewed: boolean; status: "draft" | "published" | "archived" } | null;
  initialImageUrls: Record<string, string>;
}) {
  const [state, action] = useActionState<FormState & { id?: string }, FormData>(saveSummary, {});
  const [text, setText] = useState(summary?.markup ?? "");
  const [imageUrls, setImageUrls] = useState(initialImageUrls);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = parseMarkup(useDeferredValue(text));
  const id = state.id ?? summary?.id ?? "";

  function insert(snippet: string) {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const pad = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const next = before + pad + snippet + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = (before + pad + snippet).length;
      el?.setSelectionRange(pos, pos);
    });
  }

  function upload(file: File) {
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("courseId", courseId);
    fd.set("premium", String(summary?.isPremium ?? false));
    startUpload(async () => {
      const res = await uploadImage(fd);
      if (!res.ok) return setUploadError(res.error);
      setImageUrls((m) => ({ ...m, [res.path]: res.url }));
      insert(`![Beschrijf hier wat de afbeelding laat zien](${res.path}) "Onderschrift (optioneel)"\n`);
    });
  }

  return (
    <form action={action} className="grid gap-5">
      <FormMessage error={state.error} success={state.success} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="topicId" value={topicId} />
      <FieldLabel htmlFor="sum-title">
        Titel van het hoofdstuk
        <input id="sum-title" name="title" required defaultValue={summary?.title} className={inputClass} />
      </FieldLabel>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="grid content-start gap-2">
          <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Opmaak invoegen">
            {snippets.map((s) => (
              <Button key={s.label} type="button" variant="outline" size="sm" onClick={() => insert(s.text)} className="h-8 border-line text-navy">
                {s.label}
              </Button>
            ))}
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="h-8 border-line text-navy">
              {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
              Afbeelding
            </Button>
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
          {uploadError ? <p role="alert" className="text-sm text-danger">{uploadError}</p> : null}
          <label htmlFor="sum-text" className="sr-only">Tekst van de samenvatting</label>
          <textarea
            id="sum-text"
            ref={ref}
            name="markup"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={24}
            className={`${textareaClass} font-mono text-[0.85rem]`}
            placeholder={"## Inleiding\n\nSchrijf hier je samenvatting. Gebruik **vet**, *cursief* en ==vakterm==.\n\n- Een opsomming begint met een streepje"}
          />
          <details className="text-xs text-muted-ink">
            <summary className="cursor-pointer font-medium text-navy">Hoe werkt de opmaak?</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><code>## Kop</code> en <code>### Subkop</code> aan het begin van een regel.</li>
              <li><code>**vet**</code>, <code>*cursief*</code> en <code>==vakterm==</code> binnen een zin.</li>
              <li>Lijsten beginnen met <code>-</code> of <code>1.</code>; een witregel scheidt alinea&apos;s.</li>
              <li>Tabellen met <code>|</code> tussen de kolommen; de eerste rij is de kop.</li>
              <li><code>&gt; Let op:</code>, <code>&gt; Klinisch:</code> of <code>&gt; Belangrijk:</code> maakt een gekleurd kader.</li>
              <li>Tekst uit Word kun je gewoon plakken; zet daarna de kopjes en lijsten goed.</li>
            </ul>
          </details>
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-ink">Voorbeeld zoals studenten het zien</p>
          <div className="max-h-[42rem] overflow-y-auto rounded-lg border border-line bg-white p-5">
            {preview.length ? (
              <ContentBlocks blocks={preview} imageUrls={imageUrls} idPrefix="voorbeeld" />
            ) : (
              <p className="text-sm text-muted-ink">Begin links met typen.</p>
            )}
          </div>
        </div>
      </div>

      <PublishFields prefix="sum" status={summary?.status ?? "draft"} reviewed={summary?.reviewed} isPremium={summary?.isPremium ?? false} />
      <SubmitButton className="w-auto justify-self-start px-5">Samenvatting opslaan</SubmitButton>
    </form>
  );
}
