import { useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/studyforge/store";
import { cn } from "@/lib/utils";

export function ModalHost() {
  const modal = useAppStore((s) => s.modal);
  const closeModal = useAppStore((s) => s.closeModal);
  const showToast = useAppStore((s) => s.showToast);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, closeModal]);

  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modal]);

  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-fg/30 dark:bg-bg/70"
        onClick={closeModal}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-lg max-h-[90dvh] overflow-y-auto sf-scroll",
          "rounded-t-2xl sm:rounded-xl bg-surface shadow-overlay p-6 space-y-4",
          "animate-[sf-enter_250ms_cubic-bezier(0.22,1,0.36,1)_both]",
        )}
      >
        {modal.name === "editQuestion" && (
          <>
            <h3 className="text-lg text-fg">Edit Question</h3>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Question / Front
              </label>
              <textarea
                rows={2}
                defaultValue="What was the system of writing used by early Filipinos?"
                className="sf-input resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Answer / Back
              </label>
              <input type="text" defaultValue="Baybayin" className="sf-input" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  closeModal();
                  showToast("Changes saved.");
                }}
              >
                Save Changes
              </Button>
            </div>
          </>
        )}

        {modal.name === "deleteConfirm" && (
          <div className="text-center space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
              <Trash2 className="size-6" />
            </div>
            <h3 className="text-lg text-fg">Delete Item?</h3>
            <p className="text-sm text-muted">This action cannot be undone.</p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  closeModal();
                  showToast("Item deleted.", "info");
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}

        {modal.name === "generationOptions" && (
          <>
            <h3 className="text-lg text-fg">Generation Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Question Count
                </label>
                <select className="sf-input appearance-none">
                  <option>25 Questions (Recommended)</option>
                  <option>10 Questions</option>
                  <option>50 Questions</option>
                </select>
              </div>
              <fieldset>
                <legend className="block text-xs font-medium text-muted mb-2">
                  Focus Types
                </legend>
                <div className="space-y-2">
                  {["Multiple Choice", "True / False", "Flashcards"].map((label) => (
                    <label
                      key={label}
                      className="flex items-center gap-2.5 text-sm text-fg min-h-11"
                    >
                      <input
                        type="checkbox"
                        defaultChecked
                        className="size-4 rounded-xs accent-[var(--sf-accent)]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  closeModal();
                  showToast("Generation options applied.");
                }}
              >
                Apply Options
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
