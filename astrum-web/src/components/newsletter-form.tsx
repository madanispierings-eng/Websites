"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitNetlifyForm } from "@/lib/forms";

export function NewsletterForm() {
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "failed">("idle");
  const id = React.useId();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setStatus("sending");
    try {
      await submitNetlifyForm(form);
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <form name="marktupdates" method="POST" onSubmit={onSubmit} className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
      <input type="hidden" name="form-name" value="marktupdates" />
      <p hidden>
        <label>
          Niet invullen <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-vn`} className="text-small font-normal text-muted-foreground">Voornaam</Label>
        <Input id={`${id}-vn`} name="voornaam" autoComplete="given-name" required className="h-12" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-em`} className="text-small font-normal text-muted-foreground">E-mail</Label>
        <Input id={`${id}-em`} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} required className="h-12" />
      </div>
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Aanmelden…" : "Aanmelden"}
      </Button>
      <p role="status" className="text-small md:col-span-3 empty:hidden">
        {status === "sent" && "Dank je. Je staat op de lijst; afmelden kan met één klik."}
        {status === "failed" && "Aanmelden lukte niet. Probeer het later opnieuw."}
      </p>
    </form>
  );
}
