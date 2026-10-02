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
  const session = useAppStore((s) => s.session);
  const focusMode = view === "study" && session !== null;

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
    <div
      className={
        focusMode
          ? "flex h-[100dvh] w-full overflow-hidden bg-bg text-fg sf-study-focus-mode"
          : "flex h-[100dvh] w-full overflow-hidden bg-bg text-fg"
      }
      data-study-focus={focusMode ? "true" : "false"}
    >
      <a
        href="#page-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      {!focusMode && <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col h-full relative">
        {!focusMode && <MobileHeader />}
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
        {!focusMode && <MobileNav />}
      </div>
      <ToastHost />
      <ModalHost />
    </div>
  );
}
