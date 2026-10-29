export type StudyYear = 1 | 2 | 3;

export type Course = {
  id: string;
  slug: string;
  title: string;
  studyYear: number;
  /** Null when the EC value has not been verified yet. */
  ec: number | null;
  description: string | null;
  university: string;
  program: string;
};

export type Topic = {
  id: string;
  parentId: string | null;
  slug: string;
  title: string;
  sortOrder: number;
};

export type TopicNode = Topic & { children: Topic[] };

export type LearningObjective = { id: string; topicId: string; body: string; source: string | null };

export type Exam = {
  id: string;
  examYear: number | null;
  examType: "regular" | "resit" | "midterm" | "practice";
  title: string | null;
  questionCount: number | null;
  hasExplanations: boolean;
  source: string;
};
