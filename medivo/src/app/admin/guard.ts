import "server-only";
import { notFound, redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";

/** Server-side admin check. The database enforces the same rule through RLS (is_admin()). */
export async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer) redirect("/inloggen?volgende=/admin");
  if (viewer.role !== "admin") notFound();
  return viewer;
}
