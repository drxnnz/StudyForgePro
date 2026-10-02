import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { useAppStore } from "@/lib/studyforge/store";
import { cn } from "@/lib/utils";

export function LibraryMenu({ setId }: { setId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useAppStore((s) => s.navigate);
  const mockDeleteSet = useAppStore((s) => s.mockDeleteSet);
  const duplicateSet = useAppStore((s) => s.duplicateSet);
  const exportStudyDeck = useAppStore((s) => s.exportStudyDeck);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-subtle hover:text-fg rounded-md hover:bg-surface-2 min-h-11 min-w-11 inline-flex items-center justify-center transition-[background-color,color] duration-150"
        aria-label="Study set actions"
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 mt-1 w-48 py-1 rounded-lg bg-surface shadow-overlay z-20 origin-top-right",
            "animate-[sf-enter_180ms_cubic-bezier(0.22,1,0.36,1)_both]",
          )}
        >
          <MenuItem
            icon={Play}
            label="Study"
            onClick={() => {
              setOpen(false);
              navigate("session-config", setId);
            }}
          />
          <MenuItem
            icon={Pencil}
            label="Review / Edit"
            onClick={() => {
              setOpen(false);
              navigate("detail", setId, "questions-review");
            }}
          />
          <MenuItem
            icon={Copy}
            label="Duplicate"
            onClick={() => {
              setOpen(false);
              duplicateSet(setId);
            }}
          />
          <MenuItem
            icon={Download}
            label="Export"
            onClick={() => {
              setOpen(false);
              exportStudyDeck(setId);
            }}
          />
          <div className="my-1 border-t border-border" />
          <MenuItem
            icon={Trash2}
            label="Delete"
            danger
            onClick={() => {
              setOpen(false);
              mockDeleteSet(setId);
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Play;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 min-h-10",
        "transition-[background-color] duration-150",
        danger
          ? "text-danger hover:bg-danger-soft"
          : "text-fg hover:bg-surface-2",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
