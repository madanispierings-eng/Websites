"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContactFields } from "@/components/contact-form";

type Prefill = { topic?: string; message?: string };
type BookingContextValue = { openBooking: (prefill?: Prefill) => void };

const BookingContext = React.createContext<BookingContextValue | null>(null);

export function useBooking() {
  const ctx = React.useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [prefill, setPrefill] = React.useState<Prefill>({});

  const value = React.useMemo<BookingContextValue>(
    () => ({
      openBooking: (p = {}) => {
        setPrefill(p);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <BookingContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-lenis-prevent className="max-h-[calc(100svh-24px)] overflow-y-auto overscroll-contain bg-paper p-6 text-ink shadow-2xl ring-0 sm:max-w-xl sm:p-10" /* taste-skill-ignore: dialog floats */>
          <DialogHeader className="gap-3 text-left">
            <DialogTitle className="text-head font-normal">Plan een gesprek</DialogTitle>
            <DialogDescription className="text-body text-stone">
              Vertel kort waar je staat. We nemen contact op voor een vrijblijvend gesprek, op een moment dat jou past.
            </DialogDescription>
          </DialogHeader>
          <ContactFields key={JSON.stringify(prefill)} defaultTopic={prefill.topic} defaultMessage={prefill.message} />
        </DialogContent>
      </Dialog>
    </BookingContext.Provider>
  );
}

export function BookingButton({
  children = "Plan een gesprek",
  topic,
  message,
  className,
  variant = "default",
}: {
  children?: React.ReactNode;
  topic?: string;
  message?: string | (() => string);
  className?: string;
  variant?: "default" | "secondary" | "link";
}) {
  const { openBooking } = useBooking();
  const pathname = usePathname();
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      data-page={pathname}
      onClick={() => openBooking({ topic, message: typeof message === "function" ? message() : message })}
    >
      {children}
    </Button>
  );
}
