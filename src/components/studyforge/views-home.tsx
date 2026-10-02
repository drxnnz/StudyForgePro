import { BookOpen, Clock, Search, Trash2, Download, Share2, RotateCcw, Clipboard, CheckCircle } from "lucide-react";
import { useState } from "react";
import { buildStudyDeckPrompt, parseStudyDeckCsv, validateStudyDeckRows } from "@/lib/studyforge/studydeck";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";
import { useAppStore, getSetAnalytics } from "@/lib/studyforge/store";
import { greetingForHour } from "@/lib/utils";
import { LibraryMenu } from "./library-menu";

export function HomeView() {
  const sets = useAppStore((s) => s.studySets); const navigate = useAppStore((s) => s.navigate); const records = useAppStore((s) => s.learningRecords); const startTour = useAppStore((s) => s.startTour);
  const all = sets.flatMap((s) => s.lessons.flatMap((l) => l.questions)); const attempts = all.reduce((n, q) => n + (records[q.id]?.attempts ?? 0), 0); const correct = all.reduce((n, q) => n + (records[q.id]?.correct ?? 0), 0); const accuracy = attempts ? Math.round(correct / attempts * 100) : 0; const due = all.filter((q) => (records[q.id]?.dueAt ?? 0) <= Date.now()).length;
  return <div className="space-y-10 max-w-[1400px] mx-auto stagger-in">
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><p className="text-sm font-medium text-accent mb-2 tracking-wide">StudyForge</p><h1 className="text-[clamp(1.85rem,4vw,3rem)] text-fg leading-[1.12] mb-2">{greetingForHour(new Date().getHours())}.</h1><p className="text-muted text-lg sm:text-xl leading-snug max-w-xl">A local-first study system that remembers what you need to review.</p></div><Button variant="secondary" onClick={startTour}>Take a tour</Button></header>
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Study sets" value={String(sets.length)} /><Metric label="Attempts" value={String(attempts)} /><Metric label="Accuracy" value={`${accuracy}%`} /><Metric label="Due reviews" value={String(due)} /></section>
    <section><div className="flex items-center justify-between mb-5"><h2 className="text-xl font-sans font-semibold tracking-tight text-fg">Continue Studying</h2><button type="button" onClick={() => navigate("library")} className="text-sm text-accent hover:underline font-medium min-h-11 px-2">View all</button></div><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{sets.map((set) => { const a = getSetAnalytics(set); return <button key={set.id} type="button" onClick={() => navigate("detail", set.id)} className="sf-card-interactive p-6 text-left flex flex-col justify-between min-h-[220px]"><div><div className="flex justify-between items-start mb-5"><div className="p-2.5 rounded-lg bg-accent-soft text-accent"><BookOpen className="size-5" /></div><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-2 text-muted">{set.subject}</span></div><h3 className="font-sans font-semibold text-lg text-fg mb-1 line-clamp-2 leading-snug">{set.title}</h3><p className="text-sm text-muted truncate">{set.documentName}</p></div><div className="space-y-2 pt-5 mt-6 border-t border-border"><div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted"><span>Learning</span><span className="tabular-nums text-fg">{a.accuracy}%</span></div><div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden"><div className="h-full origin-left rounded-full bg-accent transition-[width] duration-500" style={{ width: `${a.accuracy}%` }} /></div></div></button>; })}</div></section>
  </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="sf-card p-4 sm:p-5"><span className="block text-xs uppercase tracking-wider text-subtle">{label}</span><span className="text-2xl font-semibold text-fg tabular-nums">{value}</span></div>; }

export function LibraryView() {
  const sets = useAppStore((s) => s.studySets); const query = useAppStore((s) => s.libraryQuery); const setQuery = useAppStore((s) => s.setLibraryQuery); const navigate = useAppStore((s) => s.navigate); const exportSet = useAppStore((s) => s.exportStudyDeck); const shareSet = useAppStore((s) => s.shareStudyDeck);
  const filtered = sets.filter((s) => { const q = query.trim().toLowerCase(); return !q || [s.title, s.subject, s.documentName, ...s.topics].some((v) => v.toLowerCase().includes(q)); });
  if (!sets.length) return <EmptyState icon={<BookOpen className="size-10" />} title="Your Library is Empty" description="Create your first study set to start learning efficiently." action={<Button onClick={() => navigate("create")}>Create Study Set</Button>} />;
  return <div className="space-y-8 max-w-[1400px] mx-auto"><header className="flex flex-col md:flex-row md:items-start justify-between gap-6"><div><h1 className="text-[clamp(1.85rem,4vw,3rem)] text-fg leading-[1.12] mb-2">Library</h1><p className="text-muted text-lg">Search, review, export, share, and study your materials.</p></div><div className="relative w-full md:w-96 shrink-0"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-subtle" /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sets, subjects, topics..." className="sf-input pl-10" aria-label="Search study sets" /></div></header>{filtered.length === 0 ? <p className="text-muted text-center py-16">No sets match that search.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 stagger-in">{filtered.map((set) => <article key={set.id} className="sf-card p-6 sm:p-7 flex flex-col relative group"><div className="absolute top-5 right-5 z-10"><LibraryMenu setId={set.id} /></div><button type="button" onClick={() => navigate("detail", set.id)} className="flex-1 text-left pr-10"><span className="text-xs font-semibold px-3 py-1 bg-surface-2 text-muted rounded-md inline-block tracking-wide mb-4">{set.subject}</span><h3 className="font-sans font-semibold text-lg sm:text-xl text-fg mb-2 line-clamp-2 leading-snug">{set.title}</h3><p className="text-sm text-muted flex items-center mb-4"><Clock className="size-4 mr-1.5 shrink-0" />Last studied: {set.lastStudied}</p><div className="flex flex-wrap gap-2">{set.topics.slice(0, 3).map((t) => <span key={t} className="text-[11px] px-2 py-1 rounded-full bg-surface-2 text-muted">{t}</span>)}</div></button><div className="pt-4 border-t border-border flex flex-wrap gap-2 mt-5"><Button size="sm" variant="secondary" onClick={() => navigate("session-config", set.id)}>Study</Button><button title="Export" type="button" onClick={() => exportSet(set.id)} className="p-2 rounded-md text-muted hover:bg-surface-2" aria-label="Export StudyDeck"><Download className="size-4" /></button><button title="Share" type="button" onClick={() => void shareSet(set.id)} className="p-2 rounded-md text-muted hover:bg-surface-2" aria-label="Share study set"><Share2 className="size-4" /></button><span className="ml-auto text-sm font-semibold text-muted tabular-nums self-center">{set.totalQuestions} items</span></div></article>)}</div>}</div>;
}

export function TrashView() {
  const trash = useAppStore((s) => s.trashSets); const restore = useAppStore((s) => s.restoreTrashSet); const remove = useAppStore((s) => s.permanentlyDeleteTrashSet); const empty = useAppStore((s) => s.emptyTrash);
  return <div className="max-w-[1000px] mx-auto space-y-8"><header className="flex items-end justify-between gap-4"><div><h1 className="text-[clamp(1.85rem,4vw,3rem)] text-fg leading-[1.12] mb-2">Trash</h1><p className="text-muted text-lg">Deleted study sets stay recoverable for 30 days.</p></div>{trash.length > 0 && <Button variant="secondary" onClick={empty}>Empty Trash</Button>}</header>{trash.length === 0 ? <EmptyState icon={<Trash2 className="size-10" />} title="Trash is empty" description="Deleted study sets will appear here so you can restore them." /> : <div className="space-y-3">{trash.map((t) => <div key={t.id} className="sf-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h3 className="font-sans font-semibold text-fg">{t.title}</h3><p className="text-xs text-subtle mt-1">Deleted {t.deletedDate} · {t.totalQuestions} items · expires {new Date(t.expiresAt).toLocaleDateString()}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => restore(t.id)}><RotateCcw className="size-4" /> Restore</Button><Button variant="danger" onClick={() => remove(t.id)}>Delete forever</Button></div></div>)}</div>}</div>;
}

export function HelpView() {
  const query = useAppStore((s) => s.helpQuery); const setQuery = useAppStore((s) => s.setHelpQuery); const startTour = useAppStore((s) => s.startTour);
  const items = [{ q: "How does adaptive review work?", a: "StudyForge records attempts, accuracy, lapses, review count, retention, forgetting risk, and a learning state per card. Due cards can be targeted with Review due only." }, { q: "How does MCQ enrichment work?", a: "Existing source choices are preserved, then missing choices can be filled from source-grounded sibling answers ranked by lesson and tag overlap. The correct answer is never fabricated or duplicated." }, { q: "Can I recover deleted sets?", a: "Yes. Deleted sets are moved to Trash with their full snapshot and a 30-day expiration. You can restore or permanently delete them." }, { q: "What can I export?", a: "StudyForge exports a StudyDeck-compatible CSV with Deck, Lesson, Front, Back, Explanation, Hint 1, Hint 2, Hint 3, and Tags." }, { q: "What study modes are available?", a: "Multiple Choice, Type Answer, True / False, and Flashcards. Speedrun timers and due-only review can be enabled from session configuration." }];
  const filtered = items.filter((x) => !query.trim() || `${x.q} ${x.a}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="max-w-[850px] mx-auto space-y-8"><header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><h1 className="text-[clamp(1.85rem,4vw,3rem)] text-fg leading-[1.12] mb-2">Help Center</h1><p className="text-muted text-lg">Search the study system and learn how its learning tools behave.</p></div><Button variant="secondary" onClick={startTour}>Guided Tour</Button></header><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help..." className="sf-input" /> <div className="sf-card p-6 sm:p-8 space-y-6">{filtered.map((x) => <div key={x.q} className="space-y-2 border-b border-border pb-6 last:border-0 last:pb-0"><h3 className="font-sans font-semibold text-fg text-lg">{x.q}</h3><p className="text-sm text-muted leading-relaxed">{x.a}</p></div>)}{!filtered.length && <p className="text-muted text-center py-8">No help articles match that search.</p>}</div></div>;
}

export function ImportView() {
  const importStudyDeckText = useAppStore((s) => s.importStudyDeckText);
  const showToast = useAppStore((s) => s.showToast);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [validated, setValidated] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
  const [previewRows, setPreviewRows] = useState<Array<{ Deck: string; Lesson: string; Front: string; Back: string }>>([]);

  const validate = () => {
    try {
      const rows = parseStudyDeckCsv(text);
      const result = validateStudyDeckRows(rows);
      if (!result.valid) throw new Error(result.errors.slice(0, 3).join(" "));
      setValidated(true);
      setPreviewCount(rows.length);
      setPreviewRows(rows.slice(0, 5));
      showToast(`${rows.length} cards are ready for import.`);
    } catch (error) {
      setValidated(false);
      setPreviewCount(0);
      setPreviewRows([]);
      showToast(error instanceof Error ? error.message : "StudyDeck validation failed.", "error");
    }
  };

  const copyPrompt = async () => {
    const prompt = buildStudyDeckPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      showToast("StudyForge prompt copied. Paste it into Gemini, ChatGPT, Claude, or another AI.");
    } catch {
      showToast("Clipboard access was blocked. Select and copy the prompt manually.", "error");
    }
  };

  return <div className="sf-stack-lg">
    <header className="sf-page-header stagger-in">
      <div><span className="sf-eyebrow">External AI workflow</span><h1 className="sf-title">Import StudyDeck</h1><p className="sf-subtitle">Generate the content with any AI, then bring the strict StudyDeck-v1 output back here for validation and import.</p></div>
      <button type="button" onClick={copyPrompt} className="sf-hero-action"><Clipboard className="size-4" /> Copy Prompt</button>
    </header>

    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <section className="sf-card p-5 sm:p-7 space-y-5">
        <div className="flex items-start gap-3"><div className="sf-step-icon">1</div><div><h2 className="font-sans font-semibold text-lg text-fg">Paste AI output</h2><p className="text-sm text-muted mt-1">The output must contain exactly the 9 StudyDeck-v1 columns.</p></div></div>
        <div><label className="block text-sm font-medium text-fg mb-2">Study set name</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. BSIT Fundamentals" className="sf-input" /></div>
        <div><label className="block text-sm font-medium text-fg mb-2">StudyDeck CSV</label><textarea value={text} onChange={(e) => { setText(e.target.value); setValidated(false); }} rows={18} placeholder={'Deck,Lesson,Front,Back,Explanation,Hint 1,Hint 2,Hint 3,Tags\nComputer Science,Lesson 1,...'} className="sf-input resize-y min-h-[22rem] font-mono text-xs leading-relaxed" /></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border"><span className="text-xs text-muted">No Gemini call happens in this tab.</span><button type="button" onClick={validate} className="sf-hero-action"><CheckCircle className="size-4" /> Validate & Preview</button></div>
        {validated && <div className="sf-preview-table-wrap"><div className="flex items-center justify-between gap-3 mb-3"><div><p className="text-xs font-bold uppercase tracking-wider text-subtle">Preview</p><p className="text-xs text-muted mt-1">Showing the first {previewRows.length} cards before creation.</p></div><span className="text-xs font-semibold text-accent">9-column schema OK</span></div><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-surface-2 text-subtle"><tr><th className="p-3 font-semibold">Lesson</th><th className="p-3 font-semibold">Front</th><th className="p-3 font-semibold">Back</th></tr></thead><tbody>{previewRows.map((row, index) => <tr key={`${row.Front}-${index}`} className="border-t border-border"><td className="p-3 text-muted">{row.Lesson}</td><td className="p-3 text-fg max-w-[360px]">{row.Front}</td><td className="p-3 text-fg max-w-[260px]">{row.Back}</td></tr>)}</tbody></table></div></div>}
      </section>

      <aside className="sf-card p-5 sm:p-6 h-fit xl:sticky xl:top-6">
        <div className="flex items-center gap-3 mb-5"><div className="sf-step-icon">2</div><div><h2 className="font-sans font-semibold text-lg text-fg">Workflow</h2><p className="text-xs text-muted">External AI stays external.</p></div></div>
        <ol className="space-y-4 text-sm"><li className="flex gap-3"><span className="sf-number">1</span><span className="text-muted">Copy the StudyForge prompt.</span></li><li className="flex gap-3"><span className="sf-number">2</span><span className="text-muted">Give your material to Gemini, ChatGPT, Claude, or another AI.</span></li><li className="flex gap-3"><span className="sf-number">3</span><span className="text-muted">Paste the returned StudyDeck CSV here.</span></li><li className="flex gap-3"><span className="sf-number">4</span><span className="text-muted">Validate, inspect the preview, then create the deck.</span></li></ol>
        {validated && <div className="sf-success-panel mt-6"><CheckCircle className="size-5 shrink-0" /><div className="min-w-0"><strong>{previewCount} cards validated</strong><p>{title.trim() || "Imported StudyDeck"} is ready to add to Library.</p><button type="button" className="mt-3 text-sm font-semibold underline underline-offset-4" onClick={() => { if (importStudyDeckText(text, title.trim() || "Imported StudyDeck")) { setText(""); setValidated(false); setPreviewRows([]); } }}>Create Study Set</button></div></div>}
      </aside>
    </div>
  </div>;
}
