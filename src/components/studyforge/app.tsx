import { useEffect } from "react";
import { Sidebar, MobileHeader, MobileNav } from "./sidebar";
import { ToastHost } from "./toast";
import { ModalHost } from "./modals";
import { HomeView, HelpView, LibraryView, TrashView } from "./views-home";
import {
  CreateView,
  GeneratedPreviewView,
  ProcessingView,
} from "./views-create";
import { DetailView } from "./views-detail";
import { ResultsView, SessionConfigView, StudyView } from "./views-study";
import { useAppStore } from "@/lib/studyforge/store";
import type { ViewName } from "@/lib/studyforge/types";
import { Button } from "@/components/ui/button";
import { X, ChevronRight } from "lucide-react";

function renderView(view: ViewName) {
  switch (view) {
    case "home":
      return <HomeView />;
    case "library":
      return <LibraryView />;
    case "trash":
      return <TrashView />;
    case "help":
      return <HelpView />;
    case "create":
      return <CreateView />;
    case "processing":
      return <ProcessingView />;
    case "generated-preview":
      return <GeneratedPreviewView />;
    case "detail":
      return <DetailView />;
    case "session-config":
      return <SessionConfigView />;
    case "study":
      return <StudyView />;
    case "results":
      return <ResultsView />;
    default:
      return <HomeView />;
  }
}

export function StudyForgeApp() {
  const view = useAppStore((s) => s.view);
  const direction = useAppStore((s) => s.navDirection);
  const theme = useAppStore((s) => s.theme);
  const tourActive = useAppStore((s) => s.tourActive);
  const tourStep = useAppStore((s) => s.tourStep);
  const nextTour = useAppStore((s) => s.nextTour);
  const closeTour = useAppStore((s) => s.closeTour);

  useEffect(() => {
    const expired = useAppStore.getState().trashSets.filter((x) => x.expiresAt && x.expiresAt <= Date.now()).map((x) => x.id);
    if (expired.length) useAppStore.setState({ trashSets: useAppStore.getState().trashSets.filter((x) => !expired.includes(x.id)) });
  }, []);

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    const store = useAppStore.getState();
    if (dark && store.theme !== "dark") store.setTheme("dark");
    if (!dark && store.theme !== "light") store.setTheme("light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-bg text-fg">
      <a
        href="#page-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col h-full relative">
        <MobileHeader />
        <main
          id="page-stage"
          className="flex-1 relative overflow-hidden bg-bg"
        >
          <div
            key={view}
            id="page-content"
            className={
              direction === "forward"
                ? "page-in-forward absolute inset-0 overflow-y-auto sf-scroll w-full h-full px-4 sm:px-8 md:px-10 lg:px-12 py-6 sm:py-8 lg:py-12"
                : "page-in-backward absolute inset-0 overflow-y-auto sf-scroll w-full h-full px-4 sm:px-8 md:px-10 lg:px-12 py-6 sm:py-8 lg:py-12"
            }
          >
            <div className="max-w-[1400px] mx-auto pb-16 w-full">
              {renderView(view)}
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
      <ToastHost />
      <ModalHost />
      {tourActive && <GuidedTour step={tourStep} onNext={nextTour} onClose={closeTour} />}
    </div>
  );
}


function GuidedTour({ step, onNext, onClose }: { step: number; onNext: () => void; onClose: () => void }) {
  const steps = [
    ["Home dashboard", "Your local learning overview shows study sets, attempts, accuracy, and cards due for review."],
    ["Library", "Search across titles, subjects, documents, and topics. Export or share a StudyDeck directly from a set."],
    ["Study engine", "Choose MCQ, Type Answer, True / False, or Flashcards. Speedrun and due-only review are available."],
    ["Adaptive learning", "Each answer updates review history, mastery state, retention, lapses, and the next due date."],
    ["Recovery", "Deleted sets go to a recoverable 30-day Trash, while Help Center explains the learning tools."],
  ] as const;
  const [title, body] = steps[step] ?? steps[0];
  return <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-fg/20 dark:bg-bg/60 backdrop-blur-[2px]">
    <div role="dialog" aria-modal="true" aria-labelledby="tour-title" className="w-full max-w-lg sf-card p-6 sm:p-8 shadow-overlay animate-[sf-enter_250ms_cubic-bezier(0.22,1,0.36,1)_both]">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-accent">Guided Tour · {step + 1}/5</p><h2 id="tour-title" className="text-2xl text-fg mt-2">{title}</h2></div><button type="button" onClick={onClose} aria-label="Close tour" className="p-2 rounded-md text-muted hover:bg-surface-2"><X className="size-5" /></button></div>
      <p className="text-muted leading-relaxed mt-4">{body}</p>
      <div className="flex items-center justify-between gap-3 mt-7"><div className="flex gap-1.5" aria-hidden="true">{steps.map((_, i) => <span key={i} className={i === step ? "size-2 rounded-full bg-accent" : "size-2 rounded-full bg-surface-2"} />)}</div><Button onClick={onNext}>{step === steps.length - 1 ? "Finish" : "Next"}<ChevronRight className="size-4" /></Button></div>
    </div>
  </div>;
}
