"use server";

import * as practice from "@/lib/practice/server";

// Thin server-action wrappers; all validation and authorisation happens in lib/practice/server and the database.
export async function startSession(courseId: string, input: unknown) {
  return practice.startSession(courseId, input);
}
export async function submitAnswer(input: unknown) {
  return practice.submitAnswer(input);
}
export async function finishSession(input: unknown) {
  return practice.finishSession(input);
}
export async function toggleBookmark(input: unknown) {
  return practice.toggleBookmark(input);
}
export async function selfGrade(input: unknown) {
  return practice.selfGrade(input);
}
