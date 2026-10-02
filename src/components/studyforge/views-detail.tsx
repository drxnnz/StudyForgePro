import { useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Play,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, getSetAnalytics } from "@/lib/studyforge/store";
import { correctLabel } from "@/lib/studyforge/data";
import type { Lesson, Mastery, Question } from "@/lib/studyforge/types";
import { cn } from "@/lib/utils";

export function DetailView() {
  const studySets = useAppStore((s) => s.studySets);
  const activeSetId = useAppStore((s) => s.activeSetId);
  const navigate = useAppStore((s) => s.navigate);
  const filterReview = useAppStore((s) => s.filterReview);
  const setFilterReview = useAppStore((s) => s.setFilterReview);
  const questionQuery = useAppStore((s) => s.questionQuery);
  const setQuestionQuery = useAppStore((s) => s.setQuestionQuery);
  const scrollTo = useAppStore((s) => s.scrollTo);

  const set = studySets.find((s) => s.id === activeSetId) ?? studySets[0];

  useEffect(() => {
    if (scrollTo) {
      document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [scrollTo]);

  if (!set) {
    return (
      <div className="text-center py-16 text-muted">
        Study set not found.
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate("library")}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const analytics = getSetAnalytics(set);

  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      <button
        type="button"
        onClick={() => navigate("library")}
        className="group flex items-center text-sm font-medium text-muted hover:text-fg min-h-11 transition-colors duration-150"
      >
        <ArrowLeft className="size-4 mr-1.5 transition-transform duration-150 group-hover:-translate-x-1" />
        Back to Library
      </button>

      <div className="sf-card p-7 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="text-xs font-semibold px-3 py-1 bg-accent-soft text-accent rounded-full mb-3 inline-block tracking-wide">
              {set.subject}
            </span>
            <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] text-fg leading-tight">
              {set.title}
            </h1>
          </div>
          <Button
            size="lg"
            className="shrink-0 px-7"
            onClick={() => navigate("session-config", set.id)}
          >
            <Play className="size-5 ml-0.5" /> Start Session
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-border">
          <Stat label="Questions" value={String(set.totalQuestions)} />
          <Stat label="Est. Time" value={set.estimatedTime} />
          <Stat label="Progress" value={`${set.progress}%`} />
          <Stat label="Source" value={set.documentName} />
        </div>
      </div>

      <div className="sf-card p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <AnalyticsStat label="Accuracy" value={`${analytics.accuracy}%`} />
        <AnalyticsStat label="Attempts" value={String(analytics.attempts)} />
        <AnalyticsStat label="Reviews" value={String(analytics.reviews)} />
        <AnalyticsStat label="Mastered" value={String(analytics.mastered)} />
        <AnalyticsStat label="Due" value={String(analytics.due)} />
      </div>

      <div className="space-y-3">
        <h2 className="font-sans font-semibold text-lg text-fg">Topics Covered</h2>
        <div className="flex flex-wrap gap-2">
          {set.topics.map((t) => (
            <span
              key={t}
              className="px-4 py-2 bg-surface-2 text-sm font-medium text-fg rounded-md"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div id="questions-review" className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl text-fg">Questions & Review</h2>
            <p className="text-sm text-muted">
              Inspect, edit, and understand generated material.
            </p>
          </div>
          <div className="flex gap-1 bg-surface-2 p-1 rounded-md w-full sm:w-auto overflow-x-auto">
            {(
              [
                ["all", "All"],
                ["needs-review", "Needs Review"],
                ["mastered", "Mastered"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilterReview(val as "all" | Mastery)}
                className={cn(
                  "px-4 py-2 rounded-sm text-sm font-medium min-h-10 min-w-[max-content] transition-[background-color,color,box-shadow] duration-150",
                  filterReview === val
                    ? "bg-surface text-fg shadow-card"
                    : "text-muted hover:text-fg",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-subtle" />
          <input
            type="search"
            value={questionQuery}
            onChange={(e) => setQuestionQuery(e.target.value)}
            placeholder="Search questions..."
            className="sf-input pl-10 bg-surface"
            aria-label="Search questions"
          />
        </div>

        <div className="space-y-4">
          {set.lessons.map((lesson) => (
            <LessonSection
              key={lesson.id}
              lesson={lesson}
              filter={filterReview}
              query={questionQuery}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-xs text-subtle block mb-1 font-medium">{label}</span>
      <span className="text-lg font-semibold font-sans text-fg truncate block tabular-nums">
        {value}
      </span>
    </div>
  );
}

function LessonSection({
  lesson,
  filter,
  query,
}: {
  lesson: Lesson;
  filter: "all" | Mastery;
  query: string;
}) {
  const toggleLesson = useAppStore((s) => s.toggleLesson);
  const openModal = useAppStore((s) => s.openModal);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useAppStore((s) => s.navigate);
  const startSession = useAppStore((s) => s.startSession);

  let qs = lesson.questions;
  if (filter !== "all") qs = qs.filter((q) => q.mastery === filter);
  const qtext = query.trim().toLowerCase();
  if (qtext) qs = qs.filter((q) => q.prompt.toLowerCase().includes(qtext));
  if (qs.length === 0) return null;

  return (
    <div className="sf-card overflow-hidden">
      <button
        type="button"
        onClick={() => toggleLesson(lesson.id)}
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-bg-warm/40 hover:bg-surface-2/80 transition-[background-color] duration-150 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronRight
            className={cn(
              "size-5 text-subtle shrink-0 transition-transform duration-200",
              lesson.expanded && "rotate-90",
            )}
          />
          <h3 className="font-sans font-semibold text-fg text-base sm:text-lg truncate">
            {lesson.title}
          </h3>
        </div>
        <span className="text-sm font-medium text-muted bg-surface-2 px-2.5 py-0.5 rounded-full tabular-nums">
          {qs.length}
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          lesson.expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border p-4 sm:p-5 space-y-3">
            {qs.map((q, idx) => (
              <QuestionRow
                key={q.id}
                q={q}
                idx={idx}
                onEdit={() => openModal("editQuestion", q.id)}
                onDelete={() => openModal("deleteConfirm", q.id)}
                onPractice={() => {
                  showToast("Starting a focused practice on this item.", "info");
                  navigate("session-config");
                  startSession();
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionRow({
  q,
  idx,
  onEdit,
  onDelete,
  onPractice,
}: {
  q: Question;
  idx: number;
  onEdit: () => void;
  onDelete: () => void;
  onPractice: () => void;
}) {
  return (
    <details className="group bg-surface rounded-lg shadow-card overflow-hidden open:shadow-card-hover">
      <summary className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-bg-warm/30 transition-[background-color] duration-150 list-none">
        <div className="flex items-start sm:items-center gap-3 overflow-hidden min-w-0">
          <div className="shrink-0 flex items-center justify-center size-6 rounded-sm bg-surface-2 text-xs font-bold text-muted tabular-nums">
            {idx + 1}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-fg truncate max-w-[220px] sm:max-w-md lg:max-w-xl">
              {q.prompt}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-subtle">
                {q.type}
              </span>
              {q.mastery === "needs-review" && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-warn">
                  Needs Review
                </span>
              )}
              {q.mastery === "mastered" && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-success">
                  Mastered
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1 shrink-0 self-end sm:self-auto items-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onPractice();
            }}
            className="text-xs font-medium text-accent hover:bg-accent-soft px-3 py-1.5 rounded-md min-h-10"
          >
            Practice
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onEdit();
            }}
            className="text-subtle hover:text-fg p-2 rounded-md min-h-10 min-w-10 inline-flex items-center justify-center"
            aria-label="Edit question"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="text-subtle hover:text-danger p-2 rounded-md min-h-10 min-w-10 inline-flex items-center justify-center"
            aria-label="Delete question"
          >
            <Trash2 className="size-4" />
          </button>
          <ChevronRight className="size-4 text-subtle ml-1 transition-transform duration-200 group-open:rotate-90" />
        </div>
      </summary>
      <div className="px-4 pb-5 pt-2 border-t border-border bg-bg/40">
        <div className="space-y-4">
          <div>
            <span className="block text-xs font-bold text-subtle uppercase tracking-wider mb-1">
              Answer
            </span>
            <p className="text-sm font-medium text-fg bg-success-soft border border-success/20 px-3 py-2 rounded-md">
              {correctLabel(q)}
            </p>
          </div>
          {q.explanation ? (
            <div>
              <span className="block text-xs font-bold text-subtle uppercase tracking-wider mb-1">
                Explanation
              </span>
              <p className="text-sm text-muted leading-relaxed">{q.explanation}</p>
            </div>
          ) : null}
          {q.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {q.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-surface-2 text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}


function AnalyticsStat({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-[10px] uppercase tracking-wider text-subtle">{label}</span><span className="text-lg font-semibold text-fg tabular-nums">{value}</span></div>;
}
