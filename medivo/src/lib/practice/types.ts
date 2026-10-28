export type PracticeMode = "topic" | "mixed" | "exam" | "incorrect";

export type PracticeOption = { id: string; label: string; body: string };

export type PracticeQuestion = {
  id: string;
  topicId: string;
  topicTitle: string;
  stem: string;
  imageUrl: string | null;
  imageAlt: string | null;
  options: PracticeOption[];
};

/** Feedback returned by the server after an answer has been recorded. Absent in exam mode until the end. */
export type AnswerFeedback = {
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string;
  concept: string | null;
  optionFeedback: Record<string, string>;
};

export type SubmitResult = { selectedOptionId: string; feedback: AnswerFeedback | null };

export type SessionReview = {
  total: number;
  answered: number;
  correct: number;
  review: (AnswerFeedback & { questionId: string; selectedOptionId: string | null })[];
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** The server operations the practice UI needs. Implemented with server actions in production. */
export type PracticeApi = {
  startSession: (input: { mode: PracticeMode; topicIds: string[]; limit: number; timeLimitSeconds: number | null }) => Promise<
    ActionResult<{ sessionId: string; questions: PracticeQuestion[]; startedAt: string; timeLimitSeconds: number | null; bookmarkedIds: string[] }>
  >;
  submitAnswer: (input: { sessionId: string; questionId: string; optionId: string }) => Promise<ActionResult<SubmitResult>>;
  finishSession: (input: { sessionId: string }) => Promise<ActionResult<SessionReview>>;
  toggleBookmark: (input: { questionId: string; bookmarked: boolean }) => Promise<ActionResult<{ bookmarked: boolean }>>;
};
