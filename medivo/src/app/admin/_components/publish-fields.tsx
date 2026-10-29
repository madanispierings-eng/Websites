import { inputClass, rightsLabel, statusLabel } from "./ui";

/** Status, review and access controls shared by summaries, exams and questions. */
export function PublishFields({
  prefix,
  status,
  reviewed,
  isPremium,
  rights,
  showReview = true,
}: {
  prefix: string;
  status: keyof typeof statusLabel;
  reviewed?: boolean;
  isPremium: boolean;
  rights?: keyof typeof rightsLabel | null;
  showReview?: boolean;
}) {
  return (
    <fieldset className="grid gap-4 rounded-lg border border-line bg-canvas p-4">
      <legend className="px-1 text-sm font-semibold text-navy">Publicatie</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={`${prefix}-status`} className="grid gap-1.5 text-sm font-medium text-navy">
          Status
          <select id={`${prefix}-status`} name="status" defaultValue={status} className={inputClass}>
            {Object.entries(statusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {rights !== undefined ? (
          <label htmlFor={`${prefix}-rights`} className="grid gap-1.5 text-sm font-medium text-navy">
            Rechten
            <select id={`${prefix}-rights`} name="rightsStatus" defaultValue={rights ?? "own_work"} className={inputClass}>
              {Object.entries(rightsLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      {showReview ? (
        <label className="flex items-start gap-3 text-sm text-navy">
          <input type="checkbox" name="reviewed" defaultChecked={reviewed} className="mt-0.5 size-4 shrink-0 accent-navy" />
          <span>
            <span className="font-medium">Ik heb dit inhoudelijk gecontroleerd</span>
            <span className="block text-xs text-muted-ink">Verplicht om te publiceren.</span>
          </span>
        </label>
      ) : null}
      <label className="flex items-start gap-3 text-sm text-navy">
        <input type="checkbox" name="isPremium" defaultChecked={isPremium} className="mt-0.5 size-4 shrink-0 accent-navy" />
        <span>
          <span className="font-medium">Alleen voor betalende gebruikers</span>
          <span className="block text-xs text-muted-ink">Zolang betalen nog niet aanstaat, zien studenten deze inhoud dan niet.</span>
        </span>
      </label>
    </fieldset>
  );
}
