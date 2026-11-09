"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resetTopicProgress } from "./actions";

/** Resets the viewer's practice progress for one topic (keeps the questions). Confirms first; destructive. */
export function ResetTopicButton({ topicId, topicTitle, courseSlug, compact = false }: { topicId: string; topicTitle: string; courseSlug: string; compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await resetTopicProgress({ topicId, courseSlug });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null); }}>
      <AlertDialogTrigger
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium text-muted-ink transition-colors hover:bg-canvas hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue",
          compact ? "grid size-7 place-items-center" : "px-2 py-1",
        )}
        title={`Voortgang voor ${topicTitle} terug op nul`}
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        {compact ? <span className="sr-only">Reset voortgang {topicTitle}</span> : "Reset"}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Voortgang resetten?</AlertDialogTitle>
          <AlertDialogDescription>
            Hiermee wis je je antwoorden voor <span className="font-medium text-navy">{topicTitle}</span>. Het aantal gemaakte
            oefenvragen en je score gaan terug naar nul, zodat je bij een nieuwe oefensessie weer vers ziet op welk niveau je zit.
            <br />
            <br />
            De vragen zelf blijven staan, en je proeftentamens blijven bewaard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={pending}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-line text-navy")}
          >
            Annuleren
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); confirm(); }}
            disabled={pending}
            className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
            Ja, reset voortgang
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
