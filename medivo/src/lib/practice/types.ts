import type { ContentBlock } from "@/lib/content/blocks";

export type PracticeMode = "topic" | "mixed" | "exam" | "incorrect";

/**
 * single_choice: one correct option · multiple_choice: "more answers possible" · dropdowns: list-box, matching and
 * fill-in (one choice per item) · numeric: very-short-answer calculation · open: written answer, marked by the student.
 */
export type QuestionType = "single_choice" | "multiple_choice" | "dropdowns" | "numeric" | "open";

export type PracticeOption = { id: string; label: string; body: string };

export type DropdownItem = { prompt: string; choices: string[]; points?: number };

export type PracticeQuestion = {
  id: string;
  topicId: string;
  topicTitle: string;
  type: QuestionType;
  /** Case text shared by the parts of an open exam question (markup), shown above the stem. */
  context: string | null;
  /** The question itself, in the summary markup (tables, formulas and images allowed). */
  stem: string;
  points: number;
  imageUrl: string | null;
  imageAlt: string | null;
  options: PracticeOption[];
  items: DropdownItem[];
  unit: string | null;
  /** The summary section that helps with this question, shown after a wrong first answer. */
  hint: { title: string; blocks: ContentBlock[] } | null;
};

/** What the student answered; the shape depends on the question type and is checked by the database. */
export type QuestionResponse =
  | { option_id: string }
  | { option_ids: string[] }
  | { answers: (string | null)[] }
  | { value: string }
  | { text: string };

/** The answer key as far as the UI needs it, per type. */
export type AnswerKey = {
  labels?: string[];
  answers?: string[];
  min?: number;
  max?: number;
  display?: string;
};

/** Feedback returned by the server after an answer has been recorded. Absent in exam mode until the end. */
export type AnswerFeedback = {
  isCorrect: boolean;
  /** Null while an open answer still has to be marked by the student. */
  score: number | null;
  maxScore: number;
  correctOptionId: string | null;
  answer: AnswerKey;
  explanation: string;
  concept: string | null;
  optionFeedback: Record<string, string>;
  /** Answered after reading the hint (a second attempt, or the answer shown after a wrong first one). */
  usedHint: boolean;
};

/** A wrong first answer with a hint available: what may be shown without giving the answer away. */
export type RetryInfo = { wrongOptionIds: string[]; wrongItems: number[] };

export type SubmitResult = { response: QuestionResponse; feedback: AnswerFeedback | null; retry: RetryInfo | null };

export type SessionReview = {
  total: number;
  answered: number;
  correct: number;
  withHint: number;
  points: number;
  scored: number;
  review: (AnswerFeedback & { questionId: string; response: QuestionResponse | null })[];
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type PracticeExam = { id: string; label: string; questionCount: number | null };

/** The server operations the practice UI needs. Implemented with server actions in production. */
export type PracticeApi = {
  startSession: (input: {
    mode: PracticeMode;
    topicIds: string[];
    limit: number;
    timeLimitSeconds: number | null;
    examId: string | null;
  }) => Promise<
    ActionResult<{ sessionId: string; questions: PracticeQuestion[]; startedAt: string; timeLimitSeconds: number | null; bookmarkedIds: string[] }>
  >;
  submitAnswer: (input: { sessionId: string; questionId: string; response: QuestionResponse }) => Promise<ActionResult<SubmitResult>>;
  revealAnswer: (input: { sessionId: string; questionId: string }) => Promise<ActionResult<{ feedback: AnswerFeedback }>>;
  selfGrade: (input: { sessionId: string; questionId: string; score: number }) => Promise<ActionResult<{ score: number; isCorrect: boolean }>>;
  finishSession: (input: { sessionId: string }) => Promise<ActionResult<SessionReview>>;
  toggleBookmark: (input: { questionId: string; bookmarked: boolean }) => Promise<ActionResult<{ bookmarked: boolean }>>;
};
