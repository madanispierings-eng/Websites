"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  name,
  label,
  error,
  hint,
  ...props
}: React.ComponentProps<typeof Input> & { name: string; label: string; error?: string; hint?: string }) {
  const errorId = `${name}-fout`;
  const hintId = `${name}-hint`;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name} className="text-sm font-medium text-navy">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={[error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined}
        className="h-11 bg-white text-base sm:text-sm"
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-ink">{hint}</p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-danger">{error}</p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ children, className, pending: pendingProp }: { children: React.ReactNode; className?: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} className={cn("h-11 w-full font-semibold", className)}>
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </Button>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        error ? "border-danger/25 bg-danger-soft text-danger" : "border-success/25 bg-success-soft text-success-ink",
      )}
    >
      {error ?? success}
    </div>
  );
}
