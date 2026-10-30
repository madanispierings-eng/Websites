"use server";

import * as flashcards from "@/lib/flashcards/server";

// Thin server-action wrapper; validation and authorisation happen in lib/flashcards/server and the database.
export async function reviewFlashcard(input: unknown) {
  return flashcards.reviewFlashcard(input);
}
