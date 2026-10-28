import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { fallbackCourses } from "./catalog-fallback";
import type { Course, Exam, LearningObjective, Topic, TopicNode } from "./types";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  study_year: number;
  ec: number | string | null;
  description: string | null;
  curriculum_versions: { programs: { name: string; universities: { name: string } } };
};

const COURSE_SELECT =
  "id, slug, title, study_year, ec, description, curriculum_versions!inner(is_current, programs!inner(name, universities!inner(name)))";

function toCourse(row: CourseRow): Course {
  const program = row.curriculum_versions.programs;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    studyYear: row.study_year,
    ec: row.ec === null ? null : Number(row.ec),
    description: row.description,
    university: program.universities.name,
    program: program.name,
  };
}

/** All published courses of the current curriculum, ordered by study year. */
export const getCourses = cache(async (): Promise<Course[]> => {
  const supabase = await createClient();
  if (!supabase) return fallbackCourses;
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("status", "published")
    .eq("curriculum_versions.is_current", true)
    .order("study_year")
    .order("sort_order");
  if (error) throw new Error(`Vakken konden niet worden geladen: ${error.message}`);
  return (data as unknown as CourseRow[]).map(toCourse);
});

export const getCourse = cache(async (slug: string): Promise<Course | null> => {
  const courses = await getCourses();
  return courses.find((c) => c.slug === slug) ?? null;
});

/** Topics as a two-level tree (topic → subtopics). Empty when no content has been published yet. */
export const getTopicTree = cache(async (courseId: string): Promise<TopicNode[]> => {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("topics")
    .select("id, parent_id, slug, title, sort_order")
    .eq("course_id", courseId)
    .order("sort_order");
  if (error) throw new Error(`Onderwerpen konden niet worden geladen: ${error.message}`);
  const topics: Topic[] = data.map((t) => ({
    id: t.id,
    parentId: t.parent_id,
    slug: t.slug,
    title: t.title,
    sortOrder: t.sort_order,
  }));
  return topics
    .filter((t) => !t.parentId)
    .map((t) => ({ ...t, children: topics.filter((c) => c.parentId === t.id) }));
});

export const getLearningObjectives = cache(async (courseId: string): Promise<LearningObjective[]> => {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("learning_objectives")
    .select("id, topic_id, body, source, topics!inner(course_id, sort_order)")
    .eq("topics.course_id", courseId)
    .order("sort_order");
  if (error) throw new Error(`Leerdoelen konden niet worden geladen: ${error.message}`);
  return data.map((o) => ({ id: o.id, topicId: o.topic_id, body: o.body, source: o.source }));
});

export const getExams = cache(async (courseId: string): Promise<Exam[]> => {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("exams")
    .select("id, exam_year, exam_type, title, question_count, has_explanations, source")
    .eq("course_id", courseId)
    .order("exam_year", { ascending: false });
  if (error) throw new Error(`Tentamens konden niet worden geladen: ${error.message}`);
  return data.map((e) => ({
    id: e.id,
    examYear: e.exam_year,
    examType: e.exam_type,
    title: e.title,
    questionCount: e.question_count,
    hasExplanations: e.has_explanations,
    source: e.source,
  }));
});

/** Published question count per topic (public: counts reveal no content). */
export const getQuestionCounts = cache(async (courseId: string): Promise<Record<string, number>> => {
  const supabase = await createClient();
  if (!supabase) return {};
  const { data, error } = await supabase.rpc("topic_question_counts", { p_course_id: courseId });
  if (error) throw new Error(`Aantallen oefenvragen konden niet worden geladen: ${error.message}`);
  return Object.fromEntries((data as { topic_id: string; question_count: number }[]).map((r) => [r.topic_id, Number(r.question_count)]));
});
