"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { submitNetlifyForm } from "@/lib/forms";
import { site } from "@/lib/site";

const topics = ["Kopen", "Verkopen", "Portfolio opbouwen", "Eerst advies"];
type Errors = Partial<Record<"naam" | "email", string>>;

function validate(form: HTMLFormElement): Errors {
  const data = new FormData(form);
  const errors: Errors = {};
  if (!String(data.get("naam") ?? "").trim()) errors.naam = "Vul je naam in.";
  const email = String(data.get("email") ?? "").trim();
  if (!email) errors.email = "Vul je e-mailadres in.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Dit e-mailadres klopt niet. Controleer het apenstaartje en de punt.";
  return errors;
}

export function ContactFields({ defaultTopic, defaultMessage }: { defaultTopic?: string; defaultMessage?: string }) {
  const pathname = usePathname();
  const [errors, setErrors] = React.useState<Errors>({});
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "failed">("idle");
  const summaryRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();

  const onBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    const name = (e.target as unknown as HTMLInputElement).name as keyof Errors;
    if (name !== "naam" && name !== "email") return;
    const next = validate(e.currentTarget);
    setErrors((prev) => ({ ...prev, [name]: next[name] }));
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setStatus("sending");
    try {
      await submitNetlifyForm(form);
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="grid gap-3 py-4">
        <p className="text-lead">Dank je. We nemen binnen één werkdag contact met je op.</p>
        <p className="text-stone">Liever meteen mailen? Dat kan altijd via {site.email}.</p>
      </div>
    );
  }

  const errorList = Object.entries(errors).filter(([, v]) => v);

  return (
    <form name="kennismaking" method="POST" noValidate onSubmit={onSubmit} onBlur={onBlur} className="grid gap-5">
      <input type="hidden" name="form-name" value="kennismaking" />
      <input type="hidden" name="pagina" value={pathname} />
      <p hidden>
        <label>
          Niet invullen <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      {errorList.length > 0 && (
        <div ref={summaryRef} role="alert" tabIndex={-1} aria-labelledby={`${id}-err`} className="bg-gold-light p-4 outline-none">
          <p id={`${id}-err`} className="font-medium">Nog niet verstuurd</p>
          <ul className="mt-1 list-disc pl-5">
            {errorList.map(([field, msg]) => (
              <li key={field}>
                <a className="link" href={`#${id}-${field}`}>{msg}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Field id={`${id}-naam`} label="Naam" error={errors.naam}>
        <Input id={`${id}-naam`} name="naam" autoComplete="name" aria-invalid={!!errors.naam} aria-describedby={errors.naam ? `${id}-naam-err` : undefined} />
      </Field>
      <Field id={`${id}-email`} label="E-mail" error={errors.email}>
        <Input id={`${id}-email`} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-email-err` : undefined} />
      </Field>
      <Field id={`${id}-tel`} label="Telefoon (optioneel)">
        <Input id={`${id}-tel`} name="telefoon" type="tel" inputMode="tel" autoComplete="tel" placeholder="+31 6 …" />
      </Field>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-body">Waar gaat het over?</legend>
        <RadioGroup name="onderwerp" defaultValue={defaultTopic ?? "Kopen"} className="flex flex-wrap gap-x-6 gap-y-2">
          {topics.map((t) => (
            <Label key={t} className="flex min-h-11 cursor-pointer items-center gap-2 text-body font-normal">
              <RadioGroupItem value={t} /> {t}
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <Field id={`${id}-bericht`} label="Bericht (optioneel)">
        <Textarea id={`${id}-bericht`} name="bericht" rows={4} defaultValue={defaultMessage} placeholder="Bijvoorbeeld: een appartement om te verhuren, vanaf 2027…" />
      </Field>

      <div className="grid gap-3">
        <Button type="submit" size="lg" disabled={status === "sending"} className="justify-self-start">
          {status === "sending" ? "Versturen…" : "Verstuur aanvraag"}
        </Button>
        {status === "failed" && (
          <p role="alert" className="text-destructive">
            Versturen lukte niet. Probeer het opnieuw, of mail ons op {site.email}.
          </p>
        )}
        <p className="text-small text-stone">We gebruiken je gegevens alleen om contact met je op te nemen over deze aanvraag.</p>
      </div>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-body font-normal">{label}</Label>
      {children}
      {error && (
        <p id={`${id}-err`} className="text-small text-destructive">{error}</p>
      )}
    </div>
  );
}
