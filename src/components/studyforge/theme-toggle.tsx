import { Moon, Sun } from "lucide-react";
import { useAppStore } from "@/lib/studyforge/store";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-md text-muted hover:text-fg hover:bg-surface-2 transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96]",
        className,
      )}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <span className="relative size-5">
        <Sun
          className={cn(
            "absolute inset-0 size-5 text-warn transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
            dark ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 size-5 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
            dark ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0",
          )}
        />
      </span>
    </button>
  );
}
