import type { AnswerFeedback, PracticeMode, PracticeQuestion, SessionReview } from "./types";

export type AnswerState = {
  selectedOptionId: string | null;
  status: "idle" | "submitting" | "answered";
  feedback: AnswerFeedback | null;
  error: string | null;
};

export type EngineState = {
  sessionId: string;
  mode: PracticeMode;
  questions: PracticeQuestion[];
  index: number;
  answers: Record<string, AnswerState>;
  bookmarks: Record<string, boolean>;
  finished: SessionReview | null;
};

export type EngineAction =
  | { type: "select"; optionId: string }
  | { type: "submit-start" }
  | { type: "submit-success"; questionId: string; selectedOptionId: string; feedback: AnswerFeedback | null }
  | { type: "submit-failure"; questionId: string; error: string }
  | { type: "go"; index: number }
  | { type: "bookmark"; questionId: string; bookmarked: boolean }
  | { type: "finished"; review: SessionReview };

const emptyAnswer: AnswerState = { selectedOptionId: null, status: "idle", feedback: null, error: null };

export function createEngine(
  sessionId: string,
  mode: PracticeMode,
  questions: PracticeQuestion[],
  bookmarkedIds: string[] = [],
): EngineState {
  const bookmarks = Object.fromEntries(bookmarkedIds.map((id) => [id, true]));
  return { sessionId, mode, questions, index: 0, answers: {}, bookmarks, finished: null };
}

export const currentQuestion = (s: EngineState) => s.questions[s.index] ?? null;
export const answerFor = (s: EngineState, questionId: string) => s.answers[questionId] ?? emptyAnswer;
export const answeredCount = (s: EngineState) => Object.values(s.answers).filter((a) => a.status === "answered").length;

/** True when a submit for the current question may be sent: a choice is made and nothing is in flight or recorded. */
export function canSubmit(s: EngineState) {
  const q = currentQuestion(s);
  if (!q || s.finished) return false;
  const a = answerFor(s, q.id);
  return a.selectedOptionId !== null && a.status === "idle";
}

export function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case "select": {
      const q = currentQuestion(state);
      if (!q || state.finished) return state;
      const a = answerFor(state, q.id);
      // Once submitted (or while submitting) the choice is locked.
      if (a.status !== "idle" || !q.options.some((o) => o.id === action.optionId)) return state;
      return { ...state, answers: { ...state.answers, [q.id]: { ...a, selectedOptionId: action.optionId, error: null } } };
    }
    case "submit-start": {
      if (!canSubmit(state)) return state;
      const q = currentQuestion(state)!;
      return { ...state, answers: { ...state.answers, [q.id]: { ...answerFor(state, q.id), status: "submitting", error: null } } };
    }
    case "submit-success": {
      // The server is the source of truth: a duplicate submit returns the first recorded answer.
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: {
            selectedOptionId: action.selectedOptionId,
            status: "answered",
            feedback: action.feedback,
            error: null,
          },
        },
      };
    }
    case "submit-failure": {
      const a = answerFor(state, action.questionId);
      if (a.status !== "submitting") return state;
      return { ...state, answers: { ...state.answers, [action.questionId]: { ...a, status: "idle", error: action.error } } };
    }
    case "go": {
      if (action.index < 0 || action.index >= state.questions.length) return state;
      return { ...state, index: action.index };
    }
    case "bookmark":
      return { ...state, bookmarks: { ...state.bookmarks, [action.questionId]: action.bookmarked } };
    case "finished": {
      const answers = { ...state.answers };
      for (const r of action.review.review) {
        answers[r.questionId] = {
          selectedOptionId: r.selectedOptionId,
          status: "answered",
          feedback: {
            isCorrect: r.isCorrect,
            correctOptionId: r.correctOptionId,
            explanation: r.explanation,
            concept: r.concept,
            optionFeedback: r.optionFeedback,
          },
          error: null,
        };
      }
      return { ...state, answers, finished: action.review, index: 0 };
    }
  }
}
