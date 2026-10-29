"use client";

import { startTransition, useActionState } from "react";

/**
 * useActionState for forms that must keep their input. A plain `<form action>` makes React reset every
 * field after submitting, so after a validation error the user would have to fill everything in again.
 */
export function useFormAction<S>(action: (state: Awaited<S>, formData: FormData) => S | Promise<S>, initial: Awaited<S>) {
  const [state, dispatch, pending] = useActionState(action, initial);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };
  return [state, onSubmit, pending] as const;
}
