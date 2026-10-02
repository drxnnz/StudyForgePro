import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Home,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { useAppStore } from "@/lib/studyforge/store";
import type { ViewName } from "@/lib/studyforge/types";
import { cn } from "@/lib/utils";

const NAV = [
  { view: "home" as const, label: "Home", icon: Home },
  { view: "library" as const, label: "Library", icon: BookOpen },
  { view: "create" as const, label: "Create", icon: PlusCircle },
];

const SECONDARY = [
  { view: "trash" as const, label: "Trash", icon: Trash2 },
  { view: "help" as const, label: "Help Center", icon: CircleHelp },
];

function isActive(current: ViewName, target: ViewName) {
  if (target === "library") {
    return (
      current === "library" ||
      current === "detail" ||
      current === "session-config" ||
      current === "study" ||
      current === "results"
    );
  }
  if (target === "create") {
    return (
      current === "create" ||
      current === "processing" ||
      current === "generated-preview"
    );
  }
  return current === target;
}

export function Sidebar() {
  const expanded = useAppStore((s) => s.sidebarExpanded);
  const view = useAppStore((s) => s.view);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const navigate = useAppStore((s) => s.navigate);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-full shrink-0 bg-surface border-r border-border",
        "transition-[width] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        expanded ? "w-64" : "w-20",
      )}
    >
      <div
        className={cn(
          "relative flex items-center border-b border-border h-[4.25rem] px-4",
          expanded ? "justify-between" : "justify-center",
        )}
      >
        <button
          type="button"
          onClick={() => navigate("home")}
          className="flex items-center gap-2.5 min-h-11 overflow-hidden rounded-md px-1 -ml-1"
          aria-label="StudyForge home"
        >
          <Logo className="size-8 shrink-0" />
          <span
            className={cn(
              "font-display font-semibold text-lg tracking-tight text-fg whitespace-nowrap transition-[opacity,transform] duration-200",
              expanded ? "opacity-100" : "opacity-0 w-0 hidden",
            )}
          >
            StudyForge
          </span>
        </button>
        {expanded ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex size-11 items-center justify-center rounded-md text-subtle hover:text-fg hover:bg-surface-2 transition-[background-color,color] duration-150"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute inset-0 flex items-center justify-center bg-surface/90 opacity-0 hover:opacity-100 transition-opacity duration-150"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="size-5 text-accent" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto sf-scroll" aria-label="Main">
        {NAV.map((item) => (
          <NavItem
            key={item.view}
            {...item}
            expanded={expanded}
            active={isActive(view, item.view)}
            onClick={() => navigate(item.view)}
          />
        ))}
        <div className="pt-4 mt-3 border-t border-border" />
        {SECONDARY.map((item) => (
          <NavItem
            key={item.view}
            {...item}
            expanded={expanded}
            active={isActive(view, item.view)}
            onClick={() => navigate(item.view)}
          />
        ))}
      </nav>

      <div
        className={cn(
          "p-3 border-t border-border flex",
          expanded ? "justify-between items-center" : "justify-center",
        )}
      >
        {expanded && (
          <span className="text-xs font-medium text-subtle px-2">Appearance</span>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}

function NavItem({
  label,
  icon: Icon,
  expanded,
  active,
  onClick,
}: {
  label: string;
  icon: typeof Home;
  expanded: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "group relative w-full flex items-center min-h-11 rounded-md text-sm transition-[background-color,color,transform] duration-150 ease-out",
        expanded ? "px-3.5 gap-3" : "justify-center px-0",
        active
          ? "bg-accent-soft text-accent font-semibold"
          : "text-muted hover:bg-surface-2 hover:text-fg font-medium",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-accent" />
      )}
      <Icon
        className={cn(
          "size-5 shrink-0 transition-transform duration-200",
          active && "translate-x-px",
        )}
      />
      <span
        className={cn(
          "truncate transition-opacity duration-200",
          expanded ? "opacity-100" : "opacity-0 w-0 hidden",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function MobileHeader() {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={() => navigate("home")}
        className="flex items-center gap-2.5 min-h-11"
        aria-label="StudyForge home"
      >
        <Logo className="size-7" />
        <span className="font-display font-semibold text-base tracking-tight text-fg">
          StudyForge
        </span>
      </button>
      <ThemeToggle />
    </header>
  );
}

export function MobileNav() {
  const view = useAppStore((s) => s.view);
  const navigate = useAppStore((s) => s.navigate);
  const items = [
    ...NAV,
    { view: "help" as const, label: "Help", icon: CircleHelp },
  ];

  return (
    <nav
      className="lg:hidden shrink-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile"
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {items.map((item) => {
          const active = isActive(view, item.view);
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => navigate(item.view)}
              className={cn(
                "relative flex flex-col items-center justify-center min-h-12 min-w-14 px-3 py-1.5 rounded-md text-[10px] font-medium transition-[color,transform] duration-150",
                active ? "text-accent" : "text-subtle hover:text-fg",
              )}
            >
              {active && (
                <span className="absolute top-1 h-1 w-4 rounded-full bg-accent" />
              )}
              <Icon
                className={cn(
                  "size-5 mb-0.5 transition-transform duration-200",
                  active && "-translate-y-px",
                )}
              />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
