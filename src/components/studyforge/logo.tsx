import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M20 80 L50 18 L80 80 Z"
        className="fill-accent/20"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50 18 L50 80"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M35 50 L65 50"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="50" cy="18" r="4.5" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Logo className={compact ? "size-7" : "size-8"} />
      <span
        className={cn(
          "font-display font-semibold tracking-tight text-fg truncate",
          compact ? "text-base" : "text-lg",
        )}
      >
        StudyForge
      </span>
    </div>
  );
}
