import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useAppStore } from "@/lib/studyforge/store";
import { cn } from "@/lib/utils";

export function ToastHost() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);
  if (!toast) return null;

  const Icon =
    toast.type === "error" ? CircleAlert : toast.type === "info" ? Info : CircleCheck;

  return (
    <div
      className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2 sm:bottom-6 lg:bottom-6"
      role="status"
      aria-live="polite"
    >
      <div
        key={toast.id}
        className={cn(
          "pointer-events-auto flex items-start gap-3 rounded-lg bg-fg px-4 py-3 text-sm text-bg shadow-overlay",
          "animate-[sf-toast-in_220ms_cubic-bezier(0.22,1,0.36,1)_both]",
        )}
      >
        <Icon className="mt-0.5 size-4 shrink-0 opacity-90" />
        <p className="flex-1 leading-snug font-medium">{toast.message}</p>
        <button
          type="button"
          onClick={clearToast}
          className="rounded-sm p-1 text-bg/70 hover:text-bg min-h-8 min-w-8 inline-flex items-center justify-center"
          aria-label="Dismiss notification"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
