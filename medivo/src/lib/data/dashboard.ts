import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DashboardData = {
  recent: { slug: string; title: string; studyYear: number; visitedAt: string }[];
  attempts: { answered: number; correct: number };
  sessions: { id: string; courseTitle: string; mode: string; startedAt: string; finished: boolean; total: number }[];
  bookmarks: { questionId: string; stem: string; courseSlug: string; courseTitle: string }[];
  subscriptions: { id: string; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; product: string | null }[];
  profile: { fullName: string | null; studyYear: number | null };
};

export async function getDashboard(userId: string): Promise<DashboardData | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const [visits, answered, correct, sessions, bookmarks, subs, profile] = await Promise.all([
    supabase.from("course_visits").select("last_visited_at, courses(slug, title, study_year)").eq("user_id", userId).order("last_visited_at", { ascending: false }).limit(4),
    supabase.from("question_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("question_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_correct", true),
    supabase.from("practice_sessions").select("id, mode, started_at, finished_at, question_ids, courses(title)").eq("user_id", userId).order("started_at", { ascending: false }).limit(5),
    supabase.from("bookmarks").select("question_id, created_at, questions(stem, courses(slug, title))").eq("user_id", userId).order("created_at", { ascending: false }).limit(6),
    supabase.from("subscriptions").select("id, status, current_period_end, cancel_at_period_end, products(name)").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("profiles").select("full_name, study_year").eq("id", userId).maybeSingle(),
  ]);

  type One<T> = T | T[] | null;
  const one = <T,>(v: One<T>): T | null => (Array.isArray(v) ? v[0] ?? null : v);

  return {
    recent: (visits.data ?? []).flatMap((v) => {
      const c = one(v.courses as One<{ slug: string; title: string; study_year: number }>);
      return c ? [{ slug: c.slug, title: c.title, studyYear: c.study_year, visitedAt: v.last_visited_at }] : [];
    }),
    attempts: { answered: answered.count ?? 0, correct: correct.count ?? 0 },
    sessions: (sessions.data ?? []).map((s) => ({
      id: s.id,
      courseTitle: one(s.courses as One<{ title: string }>)?.title ?? "",
      mode: s.mode,
      startedAt: s.started_at,
      finished: Boolean(s.finished_at),
      total: (s.question_ids as string[]).length,
    })),
    bookmarks: (bookmarks.data ?? []).flatMap((b) => {
      const q = one(b.questions as One<{ stem: string; courses: One<{ slug: string; title: string }> }>);
      const c = q ? one(q.courses) : null;
      return q && c ? [{ questionId: b.question_id, stem: q.stem, courseSlug: c.slug, courseTitle: c.title }] : [];
    }),
    subscriptions: (subs.data ?? []).map((s) => ({
      id: s.id,
      status: s.status,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: s.cancel_at_period_end,
      product: one(s.products as One<{ name: string }>)?.name ?? null,
    })),
    profile: { fullName: profile.data?.full_name ?? null, studyYear: profile.data?.study_year ?? null },
  };
}
