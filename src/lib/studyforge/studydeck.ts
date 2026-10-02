import type { Lesson, Question, StudySet } from "./types";

export const STUDYDECK_HEADERS = ["Deck", "Lesson", "Front", "Back", "Explanation", "Hint 1", "Hint 2", "Hint 3", "Tags"] as const;
export type StudyDeckRow = Record<(typeof STUDYDECK_HEADERS)[number], string>;

export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"' && quoted) { current += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { out.push(current); current = ""; }
    else current += char;
  }
  out.push(current);
  return out;
}

function splitLines(text: string) {
  return text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
}

export function parseStudyDeckCsv(text: string): StudyDeckRow[] {
  const lines = splitLines(text);
  if (!lines.length) throw new Error("No StudyDeck data was found.");
  const header = parseCsvLine(lines[0]).map((value) => value.trim());
  const normalized = header.map((value) => value.toLowerCase());
  const required = STUDYDECK_HEADERS.map((value) => value.toLowerCase());
  const missing = required.filter((value) => !normalized.includes(value));
  if (missing.length) throw new Error(`Missing required StudyDeck columns: ${missing.join(", ")}.`);
  if (header.length !== STUDYDECK_HEADERS.length) throw new Error(`StudyDeck-v1 must contain exactly 9 physical columns.`);
  const indexes = required.map((value) => normalized.indexOf(value));
  return lines.slice(1).map((line, rowIndex) => {
    const cells = parseCsvLine(line);
    const row = {} as StudyDeckRow;
    STUDYDECK_HEADERS.forEach((key, index) => { row[key] = (cells[indexes[index]] ?? "").trim(); });
    if (!row.Front || !row.Back) throw new Error(`Row ${rowIndex + 2} must contain both Front and Back.`);
    return row;
  });
}

export function rowsToCsv(rows: StudyDeckRow[]): string {
  const esc = (value: string) => `"${String(value).replaceAll('"', '""')}"`;
  return [STUDYDECK_HEADERS.join(","), ...rows.map((row) => STUDYDECK_HEADERS.map((key) => esc(row[key])).join(","))].join("\n");
}

export function buildStudyDeckPrompt(options?: { questionCount?: number; difficulty?: string; focus?: string[] }) {
  const count = options?.questionCount ?? 25;
  const difficulty = options?.difficulty ?? "mixed";
  const focus = options?.focus?.length ? options.focus.join(", ") : "MCQ, Type Answer, True/False, Flashcards";
  return `You are formatting study material for StudyForge. Convert the supplied material into StudyDeck-v1 CSV only.\n\nSTRICT SCHEMA - EXACTLY 9 PHYSICAL COLUMNS, IN THIS ORDER:\nDeck, Lesson, Front, Back, Explanation, Hint 1, Hint 2, Hint 3, Tags\n\nRules:\n1. Output only valid CSV. Do not add markdown fences, commentary, numbering, or extra columns.\n2. Create up to ${count} high-quality study cards. Difficulty: ${difficulty}. Focus: ${focus}.\n3. Every row must have all 9 physical columns. Use empty cells when optional text is unavailable.\n4. Keep all factual content grounded in the supplied material. Do not invent facts.\n5. For MCQ cards, store the correct answer in Back and source-grounded distractors in Tags as __distractors__=<URI-encoded JSON array>. Do not put distractors in extra physical columns.\n6. For True/False cards, add tf:true or tf:false to Tags and put True or False in Back.\n7. If an example exists, store it in Tags as __example__=<URI-encoded value>.\n8. Tags are pipe-separated metadata. Never create additional physical columns.\n9. Avoid duplicate questions and duplicate answers. Prefer clear, educational wording.\n10. Do not fabricate distractors, examples, or explanations.\n\nReturn the CSV now.`;
}

export function validateStudyDeckRows(rows: StudyDeckRow[]) {
  const errors: string[] = [];
  if (!rows.length) errors.push("No cards were generated.");
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (!row.Deck) errors.push(`Row ${index + 2}: Deck is empty.`);
    if (!row.Lesson) errors.push(`Row ${index + 2}: Lesson is empty.`);
    if (!row.Front) errors.push(`Row ${index + 2}: Front is empty.`);
    if (!row.Back) errors.push(`Row ${index + 2}: Back is empty.`);
    const key = `${row.Front.toLowerCase()}\u0000${row.Back.toLowerCase()}`;
    if (seen.has(key)) errors.push(`Row ${index + 2}: duplicate Front/Back pair.`);
    seen.add(key);
  });
  return { valid: errors.length === 0, errors };
}

function metadataTags(row: StudyDeckRow) {
  return row.Tags.split("|").map((tag) => tag.trim()).filter(Boolean);
}

function metadataValue(tags: string[], key: string) {
  const item = tags.find((tag) => tag.startsWith(`${key}=`));
  return item ? decodeURIComponent(item.slice(key.length + 1)) : undefined;
}

function makeQuestion(row: StudyDeckRow, index: number, lessonId: string): Question {
  const tags = metadataTags(row);
  const tfTag = tags.find((tag) => /^tf:(true|false)$/i.test(tag));
  const distractorsRaw = metadataValue(tags, "__distractors__");
  let distractors: string[] = [];
  if (distractorsRaw) {
    try { distractors = JSON.parse(distractorsRaw); } catch { distractors = []; }
  }
  const type: Question["type"] = tfTag ? "tf" : distractors.length ? "mcq" : "type";
  const choices = type === "tf" ? ["True", "False"] : type === "mcq" ? [row.Back, ...distractors.filter((x) => x && x.toLowerCase() !== row.Back.toLowerCase())].slice(0, 4) : [];
  return {
    id: `import_q_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    prompt: row.Front,
    choices,
    correctAnswer: type === "tf" ? (row.Back.toLowerCase() === "true" ? 0 : 1) : type === "mcq" ? 0 : row.Back,
    explanation: row.Explanation,
    example: metadataValue(tags, "__example__"),
    mastery: "needs-review",
    hints: [row["Hint 1"], row["Hint 2"], row["Hint 3"]].filter(Boolean),
    tags: tags.filter((tag) => !tag.startsWith("__") && !tag.startsWith("tf:")),
    lessonId,
  };
}

export function rowsToStudySet(rows: StudyDeckRow[], fallbackTitle = "Imported StudyDeck", documentName = "StudyDeck") : StudySet {
  const grouped = new Map<string, { deck: string; rows: StudyDeckRow[] }>();
  rows.forEach((row) => {
    const key = `${row.Deck}\u0000${row.Lesson}`;
    const existing = grouped.get(key);
    if (existing) existing.rows.push(row);
    else grouped.set(key, { deck: row.Deck || fallbackTitle, rows: [row] });
  });
  const first = rows[0];
  const title = first?.Deck || fallbackTitle;
  const lessons: Lesson[] = [...grouped.entries()].map(([key, group], lessonIndex) => {
    const lessonId = `import_lesson_${Date.now()}_${lessonIndex}`;
    const lessonTitle = key.split("\u0000")[1] || "Imported Lesson";
    return { id: lessonId, title: lessonTitle, expanded: true, questions: group.rows.map((row, index) => makeQuestion(row, index, lessonId)) };
  });
  return {
    id: `set_import_${Date.now()}`,
    title,
    subject: title,
    documentName,
    progress: 0,
    totalQuestions: lessons.reduce((count, lesson) => count + lesson.questions.length, 0),
    estimatedTime: "New",
    lastStudied: "Never",
    topics: lessons.map((lesson) => lesson.title),
    lessons,
  };
}
