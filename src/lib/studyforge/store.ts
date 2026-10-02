import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INITIAL_SETS, INITIAL_TRASH, flattenQuestions, correctLabel } from "./data";
import { normalizeAnswer } from "@/lib/utils";
import type {
  CreateMethod, LearningRecord, Mastery, ModalName, Question, SessionConfig,
  StudySession, StudySet, ToastItem, TrashSet, ViewName,
} from "./types";
import { VIEW_ORDER } from "./types";

interface AppStore {
  theme: "light" | "dark";
  view: ViewName;
  navDirection: "forward" | "backward";
  createMethod: CreateMethod | null;
  studySets: StudySet[];
  trashSets: TrashSet[];
  learningRecords: Record<string, LearningRecord>;
  activeSetId: string | null;
  sessionConfig: SessionConfig;
  session: StudySession | null;
  sidebarExpanded: boolean;
  filterReview: "all" | Mastery;
  selectedFile: { name: string; size: string } | null;
  libraryQuery: string;
  questionQuery: string;
  toast: ToastItem | null;
  modal: { name: ModalName; questionId?: string } | null;
  scrollTo: string | null;
  typedAnswer: string;
  transitioning: boolean;
  tourActive: boolean;
  tourStep: number;
  helpQuery: string;

  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  navigate: (view: ViewName, id?: string | null, scrollTo?: string | null) => void;
  setCreateMethod: (method: CreateMethod | null) => void;
  setLibraryQuery: (q: string) => void;
  setQuestionQuery: (q: string) => void;
  setFilterReview: (f: "all" | Mastery) => void;
  setHelpQuery: (q: string) => void;
  toggleLesson: (lessonId: string) => void;
  mockSelectFile: () => void;
  mockRemoveFile: () => void;
  mockDeleteSet: (id: string) => void;
  duplicateSet: (id: string) => void;
  importStudyDeckText: (text: string, title?: string) => boolean;
  restoreTrashSet: (id: string) => void;
  permanentlyDeleteTrashSet: (id: string) => void;
  emptyTrash: () => void;
  exportStudyDeck: (setId: string) => void;
  shareStudyDeck: (setId: string) => Promise<void>;
  showToast: (message: string, type?: ToastItem["type"]) => void;
  clearToast: () => void;
  openModal: (name: ModalName, questionId?: string) => void;
  closeModal: () => void;
  setSessionConfig: (partial: Partial<SessionConfig>) => void;
  startSession: () => void;
  selectChoice: (value: string) => void;
  setTypedAnswer: (value: string) => void;
  submitTyped: () => void;
  flipCard: () => void;
  gradeFlashcard: (knew: boolean) => void;
  revealHint: () => void;
  nextQuestion: () => void;
  exitSession: () => void;
  setTransitioning: (v: boolean) => void;
  startTour: () => void;
  nextTour: () => void;
  closeTour: () => void;
}

function navDirection(from: ViewName, to: ViewName): "forward" | "backward" {
  if (from === "results" && to === "library") return "backward";
  if (from === "study" && (to === "detail" || to === "library")) return "backward";
  return (VIEW_ORDER[to] ?? 0) >= (VIEW_ORDER[from] ?? 0) ? "forward" : "backward";
}

function gradeQuestion(question: Question, given: string): boolean {
  if (question.type === "mcq" || question.type === "tf") {
    if (typeof question.correctAnswer === "number") return question.choices[question.correctAnswer] === given;
    return String(question.correctAnswer) === given;
  }
  return normalizeAnswer(given) === normalizeAnswer(String(question.correctAnswer));
}

function recordFor(id: string, records: Record<string, LearningRecord>): LearningRecord {
  return records[id] ?? {
    questionId: id, state: "UNSEEN", attempts: 0, correct: 0, wrong: 0,
    reviewCount: 0, lapses: 0, intervalDays: 0, dueAt: Date.now(), retention: 0,
    forgettingRisk: 1, lastReviewedAt: null,
  };
}

function updateLearning(records: Record<string, LearningRecord>, q: Question, correct: boolean) {
  const now = Date.now();
  const prev = recordFor(q.id, records);
  const attempts = prev.attempts + 1;
  const correctCount = prev.correct + (correct ? 1 : 0);
  const wrong = prev.wrong + (correct ? 0 : 1);
  const lapses = prev.lapses + (correct ? 0 : 1);
  const reviewCount = prev.reviewCount + 1;
  const accuracy = correctCount / attempts;
  const intervalDays = correct ? Math.min(90, Math.max(1, Math.round((prev.intervalDays || 1) * (accuracy >= 0.8 ? 2 : 1.25)))) : 0;
  const retention = Math.round(Math.min(1, accuracy) * 100);
  const forgettingRisk = correct ? Math.max(0.05, 1 - retention / 120) : 0.85;
  const state: LearningRecord["state"] = correct
    ? (accuracy >= 0.9 && attempts >= 3 ? "MASTERED" : accuracy >= 0.7 ? "STABLE" : "RECOVERING")
    : (attempts === 1 ? "LEARNING" : "STRUGGLING");
  const record = { ...prev, attempts, correct: correctCount, wrong, lapses, reviewCount, intervalDays,
    dueAt: now + intervalDays * 86400000, retention, forgettingRisk, lastReviewedAt: now, state };
  records[q.id] = record;
  return records;
}

function allQuestions(sets: StudySet[]) { return sets.flatMap(flattenQuestions); }

function enrichMcq(q: Question, set: StudySet): Question {
  if (q.type !== "mcq") return q;
  const existing = q.choices.filter(Boolean).map((x) => x.trim());
  const correct = correctLabel(q).trim();
  const seen = new Set(existing.map((x) => x.toLowerCase()));
  seen.add(correct.toLowerCase());
  const lesson = set.lessons.find((l) => l.questions.some((x) => x.id === q.id));
  const candidates = flattenQuestions(set)
    .filter((x) => x.id !== q.id)
    .map((x) => ({ label: correctLabel(x).trim(), score:
      (lesson?.questions.some((lq) => lq.id === x.id) ? 60 : 0) +
      (x.tags.some((t) => q.tags.some((qt) => qt.toLowerCase() === t.toLowerCase())) ? 35 : 0) +
      (x.type === q.type ? 10 : 0) }))
    .filter((x) => x.label && x.label.toLowerCase() !== correct.toLowerCase() && !seen.has(x.label.toLowerCase()))
    .sort((a, b) => b.score - a.score);
  const choices = [...existing];
  for (const c of candidates) { if (choices.length >= 4) break; choices.push(c.label); seen.add(c.label.toLowerCase()); }
  return { ...q, choices: choices.slice(0, 4) };
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
let toastId = 1;

export const useAppStore = create<AppStore>()(persist((set, get) => ({
  theme: "light", view: "home", navDirection: "forward", createMethod: null,
  studySets: INITIAL_SETS, trashSets: INITIAL_TRASH, learningRecords: {}, activeSetId: null,
  sessionConfig: { mode: "mcq", count: "all", speedrun: false, timerSeconds: 300, reviewDueOnly: false },
  session: null, sidebarExpanded: true, filterReview: "all", selectedFile: null,
  libraryQuery: "", questionQuery: "", toast: null, modal: null, scrollTo: null,
  typedAnswer: "", transitioning: false, tourActive: false, tourStep: 0, helpQuery: "",

  setTheme: (theme) => { set({ theme }); if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", theme === "dark"); },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  toggleSidebar: () => set({ sidebarExpanded: !get().sidebarExpanded }),
  navigate: (view, id = null, scrollTo = null) => {
    if (get().transitioning) return;
    const from = get().view;
    set({ activeSetId: id ?? get().activeSetId, scrollTo, view, navDirection: navDirection(from, view), ...(view === "create" ? { createMethod: null } : {}) });
  },
  setCreateMethod: (method) => set({ createMethod: method }),
  setLibraryQuery: (libraryQuery) => set({ libraryQuery }),
  setQuestionQuery: (questionQuery) => set({ questionQuery }),
  setFilterReview: (filterReview) => set({ filterReview }),
  setHelpQuery: (helpQuery) => set({ helpQuery }),
  toggleLesson: (lessonId) => set({ studySets: get().studySets.map((s) => ({ ...s, lessons: s.lessons.map((l) => l.id === lessonId ? { ...l, expanded: !l.expanded } : l) })) }),
  mockSelectFile: () => set({ selectedFile: { name: "PH_History_101.pdf", size: "2.4 MB" } }),
  mockRemoveFile: () => set({ selectedFile: null }),
  duplicateSet: (id) => {
    const item = get().studySets.find((s) => s.id === id); if (!item) return;
    const copy = structuredClone(item); const newId = `${item.id}_copy_${Date.now()}`;
    copy.id = newId; copy.title = `${item.title} Copy`; copy.lastStudied = "Never";
    copy.lessons = copy.lessons.map((lesson, li) => ({ ...lesson, id: `${newId}_lesson_${li}`, questions: lesson.questions.map((q, qi) => ({ ...q, id: `${newId}_q_${li}_${qi}` })) }));
    set({ studySets: [copy, ...get().studySets] }); get().showToast("Study set duplicated.");
  },
  importStudyDeckText: (text, title = "Imported StudyDeck") => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) { get().showToast("Import needs a header row and at least one card.", "error"); return false; }
    const parse = (line: string) => { const out: string[] = []; let cur = "", quoted = false; for (let i = 0; i < line.length; i++) { const c = line[i]; if (c === '"' && line[i + 1] === '"' && quoted) { cur += '"'; i++; } else if (c === '"') quoted = !quoted; else if (c === ',' && !quoted) { out.push(cur); cur = ""; } else cur += c; } out.push(cur); return out; };
    const header = parse(lines[0]).map((x) => x.trim().toLowerCase()); const required = ["deck", "lesson", "front", "back", "explanation", "hint 1", "hint 2", "hint 3", "tags"];
    if (!required.every((x) => header.includes(x))) { get().showToast("Import header must use the 9-column StudyDeck format.", "error"); return false; }
    const idx = (name: string) => header.indexOf(name); const lessons = new Map<string, import("./types").Lesson>();
    for (const line of lines.slice(1)) { const cells = parse(line); const lessonTitle = cells[idx("lesson")] || "Imported Lesson"; let lesson = lessons.get(lessonTitle); if (!lesson) { lesson = { id: `import_lesson_${Date.now()}_${lessons.size}`, title: lessonTitle, expanded: true, questions: [] }; lessons.set(lessonTitle, lesson); } const tags = (cells[idx("tags")] || "").split("|").map((x) => x.trim()).filter(Boolean); const type = tags.find((x) => x.startsWith("tf:")) ? "tf" : (cells[idx("hint 1")] || cells[idx("hint 2")] || cells[idx("hint 3")]) && (cells[idx("back")] || "").includes("|") ? "mcq" : "type"; const q: Question = { id: `import_q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, type, prompt: cells[idx("front")] || "", choices: type === "tf" ? ["True", "False"] : [], correctAnswer: type === "tf" ? ((cells[idx("back")] || "").toLowerCase() === "true" ? 0 : 1) : (cells[idx("back")] || ""), explanation: cells[idx("explanation")] || "", mastery: "needs-review", hints: [cells[idx("hint 1")] || "", cells[idx("hint 2")] || "", cells[idx("hint 3")] || ""].filter(Boolean), tags }; lesson.questions.push(q); }
    const setId = `set_import_${Date.now()}`; const studySet: StudySet = { id: setId, title, subject: title, documentName: "Imported StudyDeck", progress: 0, totalQuestions: [...lessons.values()].reduce((n, l) => n + l.questions.length, 0), estimatedTime: "New", lastStudied: "Never", topics: [...lessons.keys()], lessons: [...lessons.values()] };
    if (!studySet.totalQuestions) { get().showToast("No cards were found in the import.", "error"); return false; }
    set({ studySets: [studySet, ...get().studySets], activeSetId: setId }); get().showToast(`${studySet.totalQuestions} cards imported.`); return true;
  },
  mockDeleteSet: (id) => {
    const item = get().studySets.find((s) => s.id === id); if (!item) return;
    const now = Date.now(); const trash: TrashSet = { id: item.id, title: item.title, totalQuestions: item.totalQuestions, deletedDate: new Date(now).toLocaleDateString(), deletedAt: now, expiresAt: now + 30 * 86400000, snapshot: item };
    set({ studySets: get().studySets.filter((s) => s.id !== id), trashSets: [trash, ...get().trashSets] }); get().showToast("Study set moved to Trash for 30 days.", "info");
  },
  restoreTrashSet: (id) => {
    const item = get().trashSets.find((x) => x.id === id); if (!item) return;
    set({ studySets: [item.snapshot, ...get().studySets], trashSets: get().trashSets.filter((x) => x.id !== id) }); get().showToast("Study set restored.");
  },
  permanentlyDeleteTrashSet: (id) => set({ trashSets: get().trashSets.filter((x) => x.id !== id) }),
  emptyTrash: () => set({ trashSets: [] }),
  exportStudyDeck: (setId) => {
    const item = get().studySets.find((s) => s.id === setId); if (!item || typeof document === "undefined") return;
    const rows = ["Deck,Lesson,Front,Back,Explanation,Hint 1,Hint 2,Hint 3,Tags"];
    const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
    item.lessons.forEach((lesson) => lesson.questions.forEach((q) => {
      const tags = [...q.tags, ...(q.example ? [`__example__=${encodeURIComponent(q.example)}`] : [])].join("|");
      const hints = [q.hints[0] ?? "", q.hints[1] ?? "", q.hints[2] ?? ""];
      rows.push([item.title, lesson.title, q.prompt, correctLabel(q), q.explanation, ...hints, tags].map((v) => esc(v)).join(","));
    }));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${item.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "studyforge"}.csv`; a.click(); URL.revokeObjectURL(url);
    get().showToast("StudyDeck exported.");
  },
  shareStudyDeck: async (setId) => {
    const item = get().studySets.find((s) => s.id === setId); if (!item) return;
    if (typeof navigator !== "undefined" && navigator.share) { try { await navigator.share({ title: item.title, text: `${item.title} - ${item.totalQuestions} study items` }); return; } catch {} }
    get().exportStudyDeck(setId);
  },
  showToast: (message, type = "success") => { if (toastTimer) clearTimeout(toastTimer); const item = { id: toastId++, message, type }; set({ toast: item }); toastTimer = setTimeout(() => { if (get().toast?.id === item.id) set({ toast: null }); }, 3200); },
  clearToast: () => set({ toast: null }), openModal: (name, questionId) => set({ modal: { name, questionId } }), closeModal: () => set({ modal: null }),
  setSessionConfig: (partial) => set({ sessionConfig: { ...get().sessionConfig, ...partial } }),
  startSession: () => {
    const { activeSetId, studySets, sessionConfig, learningRecords } = get(); const studySet = studySets.find((s) => s.id === activeSetId) ?? studySets[0]; if (!studySet) return;
    let questions = flattenQuestions(studySet).filter((q) => {
      if (sessionConfig.mode === "flashcards") return true;
      return q.type === sessionConfig.mode;
    });
    if (sessionConfig.reviewDueOnly) questions = questions.filter((q) => recordFor(q.id, learningRecords).dueAt <= Date.now());
    if (sessionConfig.mode === "mcq") questions = questions.map((q) => enrichMcq(q, studySet));
    if (sessionConfig.count !== "all") questions = questions.slice(0, sessionConfig.count);
    if (!questions.length) { get().showToast("No matching cards are available for this session.", "info"); return; }
    set({ activeSetId: studySet.id, typedAnswer: "", session: { setId: studySet.id, mode: sessionConfig.mode, questions, index: 0, answers: [], revealed: false, selected: null, flipped: false, hintLevel: 0, startedAt: Date.now(), finishedAt: null, timeLimitSeconds: sessionConfig.speedrun ? sessionConfig.timerSeconds : null }, view: "study", navDirection: "forward" });
  },
  selectChoice: (value) => {
    const s = get().session; if (!s || s.revealed) return; const q = s.questions[s.index]; if (!q) return; const correct = gradeQuestion(q, value); const records = updateLearning({ ...get().learningRecords }, q, correct);
    set({ learningRecords: records, session: { ...s, selected: value, revealed: true, answers: [...s.answers, { questionId: q.id, correct, given: value }] } });
  },
  setTypedAnswer: (typedAnswer) => set({ typedAnswer }),
  submitTyped: () => { const s = get().session; const given = get().typedAnswer; if (!s || s.revealed) return; const q = s.questions[s.index]; if (!q) return; const correct = gradeQuestion(q, given); const records = updateLearning({ ...get().learningRecords }, q, correct); set({ learningRecords: records, session: { ...s, selected: given, revealed: true, answers: [...s.answers, { questionId: q.id, correct, given }] } }); },
  flipCard: () => { const s = get().session; if (s) set({ session: { ...s, flipped: !s.flipped } }); },
  gradeFlashcard: (knew) => { const s = get().session; if (!s) return; const q = s.questions[s.index]; if (!q) return; const records = updateLearning({ ...get().learningRecords }, q, knew); const answers = [...s.answers, { questionId: q.id, correct: knew, given: knew ? "knew" : "review" }]; finishOrNext(get, set, { ...s, answers, revealed: true }, records); },
  revealHint: () => { const s = get().session; if (!s) return; const q = s.questions[s.index]; if (q) set({ session: { ...s, hintLevel: Math.min(s.hintLevel + 1, q.hints.length) } }); },
  nextQuestion: () => { const s = get().session; if (!s) return; finishOrNext(get, set, s); },
  exitSession: () => set({ session: null, typedAnswer: "", view: "detail", navDirection: "backward" }),
  setTransitioning: (transitioning) => set({ transitioning }),
  startTour: () => set({ tourActive: true, tourStep: 0 }),
  nextTour: () => { const step = get().tourStep + 1; if (step >= 5) set({ tourActive: false, tourStep: 0 }); else set({ tourStep: step }); },
  closeTour: () => set({ tourActive: false, tourStep: 0 }),
}), { name: "studyforge-app", partialize: (s) => ({ theme: s.theme, sidebarExpanded: s.sidebarExpanded, studySets: s.studySets, trashSets: s.trashSets, learningRecords: s.learningRecords }) }));

function finishOrNext(get: () => AppStore, set: (p: Partial<AppStore>) => void, session: StudySession, records = get().learningRecords) {
  const isLast = session.index >= session.questions.length - 1;
  if (isLast) { set({ learningRecords: records, session: { ...session, finishedAt: Date.now() }, view: "results", navDirection: "forward" }); return; }
  set({ learningRecords: records, typedAnswer: "", session: { ...session, index: session.index + 1, revealed: false, selected: null, flipped: false, hintLevel: 0 } });
}

export function activeSet(): StudySet | undefined { const { studySets, activeSetId } = useAppStore.getState(); return studySets.find((s) => s.id === activeSetId) ?? studySets[0]; }
export function getLearningRecord(id: string) { return recordFor(id, useAppStore.getState().learningRecords); }
export function getSetAnalytics(set: StudySet) {
  const records = flattenQuestions(set).map((q) => getLearningRecord(q.id)); const attempts = records.reduce((n, r) => n + r.attempts, 0); const correct = records.reduce((n, r) => n + r.correct, 0);
  return { attempts, correct, accuracy: attempts ? Math.round(correct / attempts * 100) : 0, mastered: records.filter((r) => r.state === "MASTERED").length, due: records.filter((r) => r.dueAt <= Date.now()).length, reviews: records.reduce((n, r) => n + r.reviewCount, 0) };
}
