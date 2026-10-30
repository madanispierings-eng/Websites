import type { AnswerFeedback, PracticeMode, PracticeQuestion, QuestionResponse, RetryInfo, SessionReview } from "./types";

export type AnswerState = {
  response: QuestionResponse | null;
  status: "idle" | "submitting" | "answered";
  feedback: AnswerFeedback | null;
  error: string | null;
  /** Set after a wrong first answer on a question with a hint: the second attempt is open. */
  retry: (RetryInfo & { first: QuestionResponse }) | null;
  /** The student opened the hint of an open question before answering. */
  hintOpened: boolean;
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
  | { type: "respond"; response: QuestionResponse }
  | { type: "submit-start" }
  | { type: "submit-success"; questionId: string; response: QuestionResponse; feedback: AnswerFeedback | null; retry?: RetryInfo | null }
  | { type: "revealed"; questionId: string; feedback: AnswerFeedback }
  | { type: "open-hint"; questionId: string }
  | { type: "submit-failure"; questionId: string; error: string }
  | { type: "graded"; questionId: string; score: number; isCorrect: boolean }
  | { type: "go"; index: number }
  | { type: "bookmark"; questionId: string; bookmarked: boolean }
  | { type: "finished"; review: SessionReview };

const emptyAnswer: AnswerState = { response: null, status: "idle", feedback: null, error: null, retry: null, hintOpened: false };

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

/** Whether the hint panel belongs on screen: during a second attempt, or opened by hand on an open question. */
export const hintVisible = (s: EngineState, q: PracticeQuestion) => {
  const a = answerFor(s, q.id);
  return Boolean(q.hint) && s.mode !== "exam" && (a.retry !== null || a.hintOpened || Boolean(a.feedback?.usedHint));
};

/** Whether a response fits the question: known options and choices only, and something actually filled in. */
export function isComplete(q: PracticeQuestion, r: QuestionResponse | null): boolean {
  if (!r) return false;
  const optionIds = new Set(q.options.map((o) => o.id));
  switch (q.type) {
    case "single_choice":
      return "option_id" in r && optionIds.has(r.option_id);
    case "multiple_choice":
      return "option_ids" in r && r.option_ids.length > 0 && r.option_ids.every((id) => optionIds.has(id));
    case "dropdowns":
      return (
        "answers" in r &&
        r.answers.length === q.items.length &&
        r.answers.some((a) => a !== null) &&
        r.answers.every((a, i) => a === null || q.items[i].choices.includes(a))
      );
    case "numeric":
      return "value" in r && r.value.trim().length > 0 && r.value.length <= 60;
    case "open":
      return "text" in r && r.text.trim().length > 0 && r.text.length <= 8000;
  }
}

/** True when a submit for the current question may be sent: an answer is given and nothing is in flight or recorded. */
export function canSubmit(s: EngineState) {
  const q = currentQuestion(s);
  if (!q || s.finished) return false;
  const a = answerFor(s, q.id);
  return a.status === "idle" && isComplete(q, a.response);
}

/** Some but not all points: partly right on a dropdown question, or a partial self-mark on an open one. */
export const isPartial = (fb: AnswerFeedback) => fb.score !== null && fb.score > 0 && fb.score < fb.maxScore;

export function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case "respond": {
      const q = currentQuestion(state);
      if (!q || state.finished) return state;
      const a = answerFor(state, q.id);
      // Once submitted (or while submitting) the answer is locked. Half-filled answers are fine while editing.
      if (a.status !== "idle") return state;
      const r = action.response;
      const shapeOk =
        (q.type === "single_choice" && "option_id" in r && q.options.some((o) => o.id === r.option_id)) ||
        (q.type === "multiple_choice" && "option_ids" in r && r.option_ids.every((id) => q.options.some((o) => o.id === id))) ||
        (q.type === "dropdowns" && "answers" in r && r.answers.length === q.items.length) ||
        (q.type === "numeric" && "value" in r) ||
        (q.type === "open" && "text" in r);
      if (!shapeOk) return state;
      // A second attempt cannot pick the option that was already wrong.
      if (a.retry && "option_id" in r && a.retry.wrongOptionIds.includes(r.option_id)) return state;
      return { ...state, answers: { ...state.answers, [q.id]: { ...a, response: r, error: null } } };
    }
    case "submit-start": {
      if (!canSubmit(state)) return state;
      const q = currentQuestion(state)!;
      return { ...state, answers: { ...state.answers, [q.id]: { ...answerFor(state, q.id), status: "submitting", error: null } } };
    }
    case "submit-success": {
      const a = answerFor(state, action.questionId);
      if (action.retry) {
        // Wrong, with a hint: back to editing. A single choice starts empty again; other types keep the answer to adjust.
        const response = "option_id" in action.response ? null : action.response;
        return {
          ...state,
          answers: { ...state.answers, [action.questionId]: { ...a, response, status: "idle", feedback: null, error: null, retry: { ...action.retry, first: action.response } } },
        };
      }
      // The server is the source of truth: a duplicate submit returns the first recorded answer.
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: { ...a, response: action.response, status: "answered", feedback: action.feedback, error: null, retry: null },
        },
      };
    }
    case "revealed": {
      const a = answerFor(state, action.questionId);
      if (a.status === "answered") return state;
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: { ...a, status: "answered", feedback: action.feedback, error: null, retry: null } },
      };
    }
    case "open-hint": {
      const a = answerFor(state, action.questionId);
      return { ...state, answers: { ...state.answers, [action.questionId]: { ...a, hintOpened: true } } };
    }
    case "submit-failure": {
      const a = answerFor(state, action.questionId);
      if (a.status !== "submitting") return state;
      return { ...state, answers: { ...state.answers, [action.questionId]: { ...a, status: "idle", error: action.error } } };
    }
    case "graded": {
      const a = answerFor(state, action.questionId);
      if (!a.feedback) return state;
      const feedback = { ...a.feedback, score: action.score, isCorrect: action.isCorrect };
      const finished = state.finished
        ? {
            ...state.finished,
            scored: state.finished.scored - (a.feedback.score ?? 0) + action.score,
            correct: state.finished.correct - (a.feedback.isCorrect ? 1 : 0) + (action.isCorrect ? 1 : 0),
          }
        : null;
      return { ...state, finished, answers: { ...state.answers, [action.questionId]: { ...a, feedback } } };
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
        const { questionId, response, ...feedback } = r;
        answers[questionId] = { ...answerFor(state, questionId), response, status: "answered", feedback, error: null, retry: null };
      }
      return { ...state, answers, finished: action.review, index: 0 };
    }
  }
}
