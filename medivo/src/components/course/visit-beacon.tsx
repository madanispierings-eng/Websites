"use client";

import { useEffect } from "react";
import { recordVisit } from "@/app/vakken/actions";

/** Records the visit after render, so a page view never waits on a write. */
export function VisitBeacon({ courseId }: { courseId: string }) {
  useEffect(() => {
    void recordVisit(courseId);
  }, [courseId]);
  return null;
}
