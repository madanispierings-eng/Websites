"use server";

import * as progress from "@/lib/progress/server";

// Thin server-action wrapper; all validation and authorisation happens in lib/progress/server and the database.
export async function resetTopicProgress(input: unknown) {
  return progress.resetTopicProgress(input);
}
