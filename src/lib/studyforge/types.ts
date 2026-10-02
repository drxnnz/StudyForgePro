export type ViewName =
  | "home" | "library" | "import" | "ai" | "trash" | "help" | "create" | "processing"
  | "generated-preview" | "detail" | "session-config" | "study" | "results";

export type QuestionType = "mcq" | "tf" | "type" | "flashcard";
export type Mastery = "needs-review" | "learning" | "mastered";
export type CreateMethod = "manual" | "txt" | "ai";
export type StudyMode = "mcq" | "type" | "tf" | "flashcards";
export type ToastType = "success" | "info" | "error";
export type ModalName = "editQuestion" | "deleteConfirm" | "generationOptions";
export type SessionCount = "all" | 10 | 20 | 30 | 50 | 100;

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  choices: string[];
  correctAnswer: number | string;
  explanation: string;
  example?: string;
  mastery: Mastery;
  hints: string[];
  tags: string[];
  lessonId?: string;
}

export interface Lesson {
  id: string;
  title: string;
  expanded: boolean;
  questions: Question[];
}

export interface StudySet {
  id: string;
  title: string;
  subject: string;
  documentName: string;
  progress: number;
  totalQuestions: number;
  estimatedTime: string;
  lastStudied: string;
  topics: string[];
  lessons: Lesson[];
}

export interface TrashSet {
  id: string;
  title: string;
  totalQuestions: number;
  deletedDate: string;
  deletedAt: number;
  expiresAt: number;
  snapshot: StudySet;
}

export interface LearningRecord {
  questionId: string;
  state: "UNSEEN" | "LEARNING" | "STRUGGLING" | "RECOVERING" | "STABLE" | "MASTERED";
  attempts: number;
  correct: number;
  wrong: number;
  reviewCount: number;
  lapses: number;
  intervalDays: number;
  dueAt: number;
  retention: number;
  forgettingRisk: number;
  lastReviewedAt: number | null;
}

export interface SessionConfig {
  mode: StudyMode;
  count: SessionCount;
  speedrun: boolean;
  timerSeconds: number;
  reviewDueOnly: boolean;
}

export interface SessionAnswer {
  questionId: string;
  correct: boolean;
  given: string;
}

export interface StudySession {
  setId: string;
  mode: StudyMode;
  questions: Question[];
  index: number;
  answers: SessionAnswer[];
  revealed: boolean;
  selected: string | null;
  flipped: boolean;
  hintLevel: number;
  startedAt: number;
  finishedAt: number | null;
  timeLimitSeconds: number | null;
}

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export const VIEW_ORDER: Record<ViewName, number> = {
  home: 0, library: 1, import: 2, ai: 3, trash: 4, help: 5, create: 6, processing: 7,
  "generated-preview": 6, detail: 7, "session-config": 8, study: 9, results: 10,
};
