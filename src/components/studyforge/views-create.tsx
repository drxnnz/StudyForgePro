import { useMemo, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  FileUp,
  Loader2,
  PenLine,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/studyforge/store";
import { buildStudyForgePrompt, type StudyForgePromptLanguage } from "@/lib/studyforge/studydeck";

export function CreateView() {
  const method = useAppStore((s) => s.createMethod);
  const setCreateMethod = useAppStore((s) => s.setCreateMethod);

  if (!method) {
    return (
      <div className="max-w-[1000px] mx-auto space-y-8">
        <header className="text-center mb-6 sm:mb-10 stagger-in">
          <h1 className="text-[clamp(1.7rem,3.5vw,2.4rem)] text-fg mb-2">
            Create Study Material
          </h1>
          <p className="text-muted text-lg">
            Choose how you want to create your study material.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-in">
          <MethodCard
            icon={PenLine}
            title="Manual"
            description="Create questions and answers yourself."
            onClick={() => setCreateMethod("manual")}
          />
          <MethodCard
            icon={FileText}
            title="TXT / Paste"
            description="Paste your study material and turn it into study content."
            onClick={() => setCreateMethod("txt")}
          />
          <MethodCard
            icon={Zap}
            title="AI"
            description="Upload a document and generate an interactive study quiz."
            onClick={() => setCreateMethod("ai")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      <button
        type="button"
        onClick={() => setCreateMethod(null)}
        className="group flex items-center text-sm font-medium text-muted hover:text-fg min-h-11 transition-colors duration-150"
      >
        <ArrowLeft className="size-4 mr-1.5 transition-transform duration-150 group-hover:-translate-x-1" />
        Back to Create
      </button>
      {method === "manual" && <ManualWorkflow />}
      {method === "txt" && <TxtWorkflow />}
      {method === "ai" && <AiWorkflow />}
    </div>
  );
}

function MethodCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof PenLine;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sf-card-interactive p-6 sm:p-8 text-left flex flex-col justify-between group min-h-[240px]"
    >
      <div>
        <div className="size-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-6 transition-transform duration-200 group-hover:scale-105">
          <Icon className="size-6" />
        </div>
        <h3 className="font-sans font-semibold text-lg text-fg mb-2">{title}</h3>
        <p className="text-sm text-muted leading-relaxed">{description}</p>
      </div>
      <div className="mt-8 flex items-center text-sm font-semibold text-accent transition-transform duration-200 group-hover:translate-x-1">
        Get started
        <span className="ml-1" aria-hidden="true">
          →
        </span>
      </div>
    </button>
  );
}

function ManualWorkflow() {
  const showToast = useAppStore((s) => s.showToast);
  const openModal = useAppStore((s) => s.openModal);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl text-fg tracking-tight mb-1">Manual</h1>
        <p className="text-muted">Create questions and answers yourself.</p>
      </header>
      <div className="sf-card p-6 sm:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              Subject / Study Set
            </label>
            <div className="flex gap-2">
              <input type="text" placeholder="e.g. History 101" className="sf-input" />
              <Button variant="secondary" size="icon" title="New Subject" type="button">
                <Plus className="size-5" />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-2">Lesson</label>
            <div className="flex gap-2">
              <select className="sf-input appearance-none">
                <option>Lesson 1 - Pre-Colonial</option>
              </select>
              <Button variant="secondary" size="icon" title="New Lesson" type="button">
                <Plus className="size-5" />
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              Question / Front
            </label>
            <textarea
              rows={3}
              placeholder="Type your question here..."
              className="sf-input resize-none min-h-[5.5rem]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              Answer / Back
            </label>
            <textarea
              rows={2}
              placeholder="Type the correct answer..."
              className="sf-input resize-none"
            />
          </div>
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-accent hover:underline flex items-center min-h-11">
              Show optional fields
            </summary>
            <div className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Explanation
                </label>
                <textarea rows={2} className="sf-input resize-none text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Hint 1
                  </label>
                  <input type="text" className="sf-input text-sm py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Hint 2
                  </label>
                  <input type="text" className="sf-input text-sm py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="comma separated"
                    className="sf-input text-sm py-2"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={() => showToast("Card added successfully!")}>
            <Plus className="size-5" /> Add Card
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-sans font-semibold text-lg text-fg mb-4">
          Current Lesson Cards (2)
        </h3>
        <div className="sf-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium text-fg mb-1">
              What was the system of writing used by early Filipinos?
            </p>
            <p className="text-sm text-muted">A: Baybayin</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              size="icon"
              title="Edit"
              onClick={() => openModal("editQuestion")}
            >
              <PenLine className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              className="text-danger hover:bg-danger-soft"
              onClick={() => openModal("deleteConfirm")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromptLanguageSelector({
  value: selectedValue,
  onChange,
}: {
  value: StudyForgePromptLanguage;
  onChange: (value: StudyForgePromptLanguage) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-fg">Question &amp; Content Language</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {([
          ["english", "English"],
          ["tagalog", "Tagalog"],
          ["taglish", "Taglish"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`min-h-11 rounded-lg border px-3 text-sm font-medium transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] ${
              value === selectedValue
                ? "border-accent bg-accent-soft text-accent"
                : "border-border bg-surface text-muted hover:border-accent/50 hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        Only generated study content changes language. The StudyForge interface stays in English.
      </p>
    </div>
  );
}

function CopyPromptButton({ prompt }: { prompt: string }) {
  const showToast = useAppStore((s) => s.showToast);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      showToast("Canonical StudyForge prompt copied.");
    } catch {
      showToast("Could not copy the prompt. Select the prompt text manually.", "error");
    }
  };
  return <Button variant="secondary" onClick={copy}>Copy Prompt</Button>;
}

function TxtWorkflow() {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<StudyForgePromptLanguage>("english");
  const [showPrompt, setShowPrompt] = useState(false);
  const importStudyDeckText = useAppStore((s) => s.importStudyDeckText);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useAppStore((s) => s.navigate);
  const prompt = useMemo(() => buildStudyForgePrompt({
    language,
    subject: title.trim(),
    autoDetectSubject: !title.trim(),
    studyMaterial: text,
    delivery: "paste",
  }), [language, title, text]);
  const onImport = () => {
    if (!text.trim()) { showToast("Paste a complete StudyDeck-v1 document first.", "error"); return; }
    if (importStudyDeckText(text, title.trim() || "Imported StudyDeck")) navigate("library");
  };
  return <div className="sf-card p-6 sm:p-8 space-y-6">
    <div><h2 className="font-sans font-semibold text-xl text-fg mb-1">StudyDeck Import / Paste</h2><p className="text-sm text-muted">Paste a StudyDeck-v1 document generated from the canonical StudyForge prompt.</p></div>
    <PromptLanguageSelector value={language} onChange={setLanguage} />
    <div><label className="block text-sm font-medium text-fg mb-2">Study set name <span className="text-muted font-normal">(optional)</span></label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leave blank to detect the subject from the source" className="sf-input" /></div>
    <div className="flex flex-col sm:flex-row gap-2">
      <CopyPromptButton prompt={prompt} />
      <Button variant="ghost" onClick={() => setShowPrompt((value) => !value)}>{showPrompt ? "Hide Prompt" : "Preview Prompt"}</Button>
    </div>
    {showPrompt && <textarea readOnly value={prompt} className="sf-input min-h-[20rem] resize-y font-mono text-xs leading-relaxed" aria-label="Canonical StudyForge prompt" />}
    <label className="inline-flex items-center gap-2 min-h-11 px-4 rounded-md bg-surface-2 text-fg text-sm font-medium cursor-pointer w-fit"><FileUp className="size-4" /> Load .txt / .tsv<input type="file" accept=".txt,.tsv,text/plain,text/tab-separated-values" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setText(String(reader.result ?? "")); reader.readAsText(file); }} /></label>
    <textarea rows={14} value={text} onChange={(e) => setText(e.target.value)} placeholder={'#format:studydeck-v1\n#separator:Tab\n#columns:Deck\tLesson\tFront\tBack\tExplanation\tHint 1\tHint 2\tHint 3\tTags'} className="sf-input resize-y min-h-[16rem] font-mono text-xs" />
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border"><p className="text-xs text-muted">The same validator and normalizer is used before cards enter the app.</p><Button className="px-8" onClick={onImport}><Plus className="size-5" /> Validate &amp; Import</Button></div>
  </div>;
}

function AiWorkflow() {
  const [language, setLanguage] = useState<StudyForgePromptLanguage>("english");
  const [showPrompt, setShowPrompt] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const selectedFile = useAppStore((s) => s.selectedFile);
  const mockSelectFile = useAppStore((s) => s.mockSelectFile);
  const mockRemoveFile = useAppStore((s) => s.mockRemoveFile);
  const importStudyDeckText = useAppStore((s) => s.importStudyDeckText);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useAppStore((s) => s.navigate);
  const openModal = useAppStore((s) => s.openModal);
  const prompt = useMemo(() => buildStudyForgePrompt({
    language,
    autoDetectSubject: true,
    studyMaterial: sourceText,
    delivery: "ai",
  }), [language, sourceText]);
  const validateAiOutput = () => {
    if (!aiOutput.trim()) { showToast("Paste the Gemini StudyDeck-v1 response first.", "error"); return; }
    if (importStudyDeckText(aiOutput, selectedFile?.name?.replace(/\.[^.]+$/, "") || "AI Generated StudyDeck")) navigate("library");
  };

  return (
    <div className="sf-card p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="font-sans font-semibold text-xl text-fg mb-1">AI Study Quiz</h2>
        <p className="text-sm text-muted">Use the same canonical StudyForge prompt and StudyDeck-v1 validator for Gemini output.</p>
      </div>
      <PromptLanguageSelector value={language} onChange={setLanguage} />
      {!selectedFile ? (
        <button type="button" onClick={mockSelectFile} className="w-full border border-dashed border-border-strong p-12 sm:p-16 rounded-xl flex flex-col items-center justify-center text-center hover:border-accent transition-[border-color,transform] duration-200 bg-bg/50">
          <div className="size-16 rounded-full bg-accent-soft text-accent flex items-center justify-center mb-4"><FileUp className="size-8" /></div>
          <h3 className="font-sans font-semibold text-lg text-fg mb-1">Drag and drop documents</h3>
          <p className="text-sm text-subtle mb-4">Supported formats: PDF, DOCX, TXT</p>
          <span className="inline-flex items-center justify-center min-h-11 px-4 rounded-md bg-surface shadow-card text-sm font-medium">Browse Files</span>
        </button>
      ) : (
        <div className="p-5 rounded-lg bg-bg border border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0"><div className="size-12 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0"><FileText className="size-6" /></div><div className="min-w-0"><p className="font-medium text-fg truncate">{selectedFile.name}</p><p className="text-xs text-muted">PDF · {selectedFile.size}</p></div></div>
          <button type="button" onClick={mockRemoveFile} className="p-2 text-subtle hover:text-danger min-h-11 min-w-11 inline-flex items-center justify-center" aria-label="Remove file"><X className="size-5" /></button>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-fg mb-2">Extracted study material <span className="text-muted font-normal">(used as the source for the canonical prompt)</span></label>
        <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} rows={7} className="sf-input resize-y font-mono text-xs" placeholder="Document text supplied to Gemini goes here..." />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <CopyPromptButton prompt={prompt} />
        <Button variant="ghost" onClick={() => setShowPrompt((value) => !value)}>{showPrompt ? "Hide Prompt" : "Preview Prompt"}</Button>
        <Button variant="secondary" onClick={() => openModal("generationOptions")}><Settings2 className="size-5" /> Generation Options</Button>
      </div>
      {showPrompt && <textarea readOnly value={prompt} className="sf-input min-h-[20rem] resize-y font-mono text-xs leading-relaxed" aria-label="Canonical StudyForge AI prompt" />}
      <div className="pt-4 border-t border-border space-y-3">
        <label className="block text-sm font-medium text-fg">Gemini StudyDeck-v1 response</label>
        <textarea value={aiOutput} onChange={(e) => setAiOutput(e.target.value)} rows={10} className="sf-input resize-y font-mono text-xs" placeholder="#format:studydeck-v1 ..." />
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2"><Button variant="secondary" onClick={validateAiOutput}>Validate &amp; Import AI Output</Button><Button className="px-8" onClick={() => navigate("processing")} disabled={!selectedFile}><Sparkles className="size-5" /> Generate Study Quiz</Button></div>
      </div>
    </div>
  );
}

export function ProcessingView() {
  const view = useAppStore((s) => s.view);
  const navigate = useAppStore((s) => s.navigate);
  const transitioning = useAppStore((s) => s.transitioning);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (useAppStore.getState().view === "processing" && !useAppStore.getState().transitioning) {
        navigate("generated-preview");
      }
    }, 2500);
    return () => window.clearTimeout(t);
  }, [view, navigate, transitioning]);

  return (
    <div className="max-w-[720px] mx-auto text-center py-16 space-y-8">
      <div className="size-24 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto">
        <Loader2 className="size-12 animate-spin" />
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl sm:text-3xl text-fg">Analyzing Material...</h2>
        <p className="text-muted text-lg">
          Extracting key concepts and generating intelligent study questions.
        </p>
      </div>
      <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden max-w-md mx-auto">
        <div className="h-full w-[70%] bg-accent rounded-full shimmer" />
      </div>
    </div>
  );
}

export function GeneratedPreviewView() {
  const navigate = useAppStore((s) => s.navigate);
  const showToast = useAppStore((s) => s.showToast);

  return (
    <div className="max-w-[900px] mx-auto space-y-8">
      <div className="text-center space-y-3 mb-8 stagger-in">
        <div className="inline-flex items-center justify-center size-12 rounded-full bg-success-soft text-success mb-2">
          <Check className="size-6" />
        </div>
        <h1 className="text-3xl text-fg">Study Set Generated</h1>
        <p className="text-muted">Please review the extracted material before studying.</p>
      </div>

      <div className="sf-card overflow-hidden">
        <div className="p-6 border-b border-border bg-bg-warm/40">
          <h2 className="font-sans font-semibold text-xl text-fg mb-1">
            Philippine History: Pre-Colonial to Spanish Era
          </h2>
          <p className="text-sm text-muted mb-4">Source: PH_History_101.pdf</p>
          <div className="flex flex-wrap gap-2 text-sm font-medium">
            <span className="bg-surface px-3 py-1 rounded-md shadow-card">25 Questions</span>
            <span className="bg-surface px-3 py-1 rounded-md shadow-card">2 Lessons</span>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <PreviewLesson
            title="Lesson 1 - Pre-Colonial Period"
            items={[
              "What was the system of writing used by early Filipinos?",
              "The Barangay was the basic socio-political unit.",
            ]}
          />
          <PreviewLesson
            title="Lesson 2 - Spanish Era"
            items={["Who led the Spanish expedition in 1521?"]}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            className="flex-1 sm:flex-none"
            onClick={() => navigate("detail", "set_1")}
          >
            Continue Editing
          </Button>
          <Button
            variant="secondary"
            className="flex-1 sm:flex-none text-danger"
            onClick={() => showToast("This feature is part of the prototype.", "info")}
          >
            Regenerate
          </Button>
        </div>
        <Button className="px-8" onClick={() => navigate("session-config", "set_1")}>
          Start Studying
        </Button>
      </div>
    </div>
  );
}

function PreviewLesson({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 border-b border-border pb-2">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <p key={item} className="text-sm font-medium text-fg">
            <span className="text-accent mr-2 tabular-nums">Q{i + 1}</span>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
