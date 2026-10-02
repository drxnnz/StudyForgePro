import type { LearningRecord, Question, StudySet } from "./types";
import { correctLabel, flattenQuestions } from "./data";

const STOP_WORDS = new Set(
  "a an the and or but if then than of to in on at by for from with without into is are was were be been being this that these those it its as do does did how what when where who whom which why can could should would will may might must i you your yours we our ours they their them he she his her not no yes very more most some any all each every only also about over under between through during before after per via using used use"
    .split(" "),
);

export const STUDYDECK_COLUMNS = [
  "Deck", "Lesson", "Front", "Back", "Explanation", "Hint 1", "Hint 2", "Hint 3", "Tags",
] as const;

export function normalizeEngineText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: unknown): Set<string> {
  return new Set(normalizeEngineText(value).split(" ").filter((t) => t.length > 2 && !STOP_WORDS.has(t)));
}

function overlap(a: unknown, b: unknown): number {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  A.forEach((t) => { if (B.has(t)) common += 1; });
  return common / Math.max(1, Math.min(A.size, B.size));
}

function jaccard(a: unknown, b: unknown): number {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  A.forEach((t) => { if (B.has(t)) common += 1; });
  return common / Math.max(1, new Set([...A, ...B]).size);
}

function nearDuplicate(a: unknown, b: unknown): boolean {
  const A = normalizeEngineText(a), B = normalizeEngineText(b);
  if (!A || !B || A === B) return true;
  const ta = tokens(A), tb = tokens(B);
  if (!ta.size || !tb.size) return false;
  let common = 0;
  ta.forEach((t) => { if (tb.has(t)) common += 1; });
  const union = new Set([...ta, ...tb]).size;
  return common / Math.max(1, union) >= 0.82 ||
    (Math.min(A.length, B.length) >= 18 && (A.includes(B) || B.includes(A)));
}

function placeholder(value: unknown): boolean {
  const n = normalizeEngineText(value);
  return !n || /^(answer|question|n a|none|null|undefined|tbd|todo|unknown|example|placeholder|test)$/.test(n);
}

function answerType(answer: string, front: string): string {
  const text = answer.trim();
  if (/^[-+]?\d+(?:\.\d+)?%?$/.test(text)) return text.endsWith("%") ? "percentage" : "number";
  if (/^\d{4}$/.test(text)) return "date";
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(text)) return "date";
  if (/^[A-ZÁÉÍÓÚÑÜ][A-Za-zÁÉÍÓÚÑÜáéíóúñü'’-]+(?:\s+[A-ZÁÉÍÓÚÑÜ][A-Za-zÁÉÍÓÚÑÜáéíóúñü'’-]+){1,3}$/.test(text)) return "name";
  if (/[.!?](?:\s|$)/.test(text) || /[.!?]$/.test(text)) return "statement";
  if (text.split(/\s+/).filter(Boolean).length >= 8) return "definition";
  if (text.split(/\s+/).filter(Boolean).length >= 2) return "phrase";
  if (normalizeEngineText(front).includes("who") || normalizeEngineText(front).includes("sino")) return "name";
  return "term";
}

function compatible(expected: string, candidate: string): boolean {
  if (expected === candidate) return true;
  const groups: Record<string, string[]> = {
    term: ["term", "phrase", "name", "object", "category"],
    name: ["name", "term", "phrase"],
    phrase: ["phrase", "term", "name", "definition"],
    definition: ["definition", "statement", "phrase"],
    statement: ["statement", "definition", "phrase"],
    number: ["number", "percentage", "date"],
    percentage: ["percentage", "number"],
    date: ["date", "number"],
  };
  return groups[expected]?.includes(candidate) ?? false;
}

function specificity(answer: string, correct: string): number {
  const a = answer.trim(), c = correct.trim();
  const ar = Math.min(1, a.length / Math.max(1, c.length));
  return Math.round((1 - Math.abs(1 - ar)) * 10);
}

function shape(answer: string): number {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  return words <= 1 ? 2 : words <= 5 ? 5 : words <= 12 ? 7 : 4;
}

function parseDistractorMetadata(tags: string[]): string[] {
  const tag = tags.find((x) => /^__distractors__[:=]/i.test(x));
  if (!tag) return [];
  const encoded = tag.replace(/^__distractors__[:=]/i, "");
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded));
    return Array.isArray(parsed) ? parsed.map((x) => String(x ?? "").trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function enrichMcqFromPool(question: Question, sets: StudySet[]): Question {
  if (question.type !== "mcq") return question;
  const correct = correctLabel(question).trim();
  if (!correct) return question;

  const currentAnswers = question.choices.map((x) => String(x ?? "").trim()).filter(Boolean);
  const seen = new Set(currentAnswers.map(normalizeEngineText));
  seen.add(normalizeEngineText(correct));

  const metadata = parseDistractorMetadata(question.tags);
  const all = sets.flatMap(flattenQuestions);
  const candidateCards = all.filter((candidate) => candidate.id !== question.id);
  const currentTags = new Set(question.tags.map(normalizeEngineText).filter(Boolean));

  const generated = metadata.map((value) => ({
    value,
    source: "metadata" as const,
    score: 1000,
    type: answerType(value, question.prompt),
  }));

  const scored = candidateCards.map((candidate) => {
    const value = correctLabel(candidate).trim();
    const type = answerType(value, candidate.prompt);
    const candidateTags = new Set(candidate.tags.map(normalizeEngineText).filter(Boolean));
    let tagScore = 0;
    currentTags.forEach((tag) => { if (candidateTags.has(tag)) tagScore += 8; });
    const sameLesson = candidate.lessonId && question.lessonId && candidate.lessonId === question.lessonId ? 28 : 0;
    const topic = overlap(question.prompt, candidate.prompt);
    const context = overlap(
      `${question.prompt} ${correct} ${question.explanation}`,
      `${candidate.prompt} ${value} ${candidate.explanation}`,
    );
    const typeScore = compatible(answerType(correct, question.prompt), type) ? 22 : -28;
    const nearPenalty = jaccard(correct, value) >= 0.55 ? -24 : 0;
    const sourceBonus = candidate.tags.some((t) => /^__distractor/i.test(t)) ? 18 : 0;
    const score =
      sameLesson + tagScore + topic * 22 + context * 10 + typeScore +
      sourceBonus + specificity(value, correct) + shape(value) + nearPenalty;
    return { value, type, score, source: "pool" as const };
  }).filter((item) => item.value && !placeholder(item.value));

  scored.sort((a, b) => b.score - a.score);
  const ranked = [...generated, ...scored];
  const choices = [...currentAnswers];

  for (const candidate of ranked) {
    if (choices.length >= 4) break;
    const value = candidate.value.trim();
    const key = normalizeEngineText(value);
    if (!key || seen.has(key) || nearDuplicate(value, correct)) continue;
    if (!compatible(answerType(correct, question.prompt), candidate.type)) continue;
    choices.push(value);
    seen.add(key);
  }

  const deduped = choices.filter((value, index, arr) =>
    arr.findIndex((other) => normalizeEngineText(other) === normalizeEngineText(value)) === index,
  );

  // Never fabricate a filler answer. Keep the best source-grounded count available: 4, 3, 2, or 1.
  const finalChoices = deduped.slice(0, 4);
  const correctIndex = finalChoices.findIndex((x) => normalizeEngineText(x) === normalizeEngineText(correct));
  if (correctIndex < 0) finalChoices.unshift(correct);

  // Randomize only presentation order. The answer value remains authoritative.
  for (let i = finalChoices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [finalChoices[i], finalChoices[j]] = [finalChoices[j], finalChoices[i]];
  }

  return { ...question, choices: finalChoices.slice(0, 4), correctAnswer: correct };
}

export function adaptiveSessionOrder(
  questions: Question[],
  records: Record<string, LearningRecord>,
  count: number,
): Question[] {
  const now = Date.now();
  const score = (q: Question, index: number) => {
    const r = records[q.id];
    if (!r) return 90 - index * 0.001;
    let priority = 20;
    if (r.state === "STRUGGLING") priority += 70;
    if (r.state === "RECOVERING") priority += 60;
    if (r.state === "LEARNING") priority += 40;
    if (r.dueAt <= now) priority += 38;
    priority += Math.max(0, 70 - r.retention) * 0.65;
    priority += Math.min(25, r.lapses * 7);
    priority += Math.min(15, r.wrong * 3);
    priority -= Math.min(25, r.retention * 0.18);
    return priority - index * 0.001;
  };
  return questions
    .map((question, index) => ({ question, priority: score(question, index), index }))
    .sort((a, b) => b.priority - a.priority || a.index - b.index)
    .slice(0, Math.max(0, count))
    .map((x) => x.question);
}

export interface ParsedStudyDeck {
  title: string;
  rows: Array<{
    deck: string; lesson: string; front: string; back: string; explanation: string;
    hints: string[]; tags: string[];
  }>;
  errors: string[];
}

function parseDelimitedLine(line: string, delimiter = ","): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"' && quoted) { current += '"'; i += 1; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === delimiter && !quoted) { cells.push(current); current = ""; continue; }
    current += c;
  }
  cells.push(current);
  return cells.map((x) => x.trim());
}

export function parseStudyDeck(text: string, fallbackTitle = "Imported StudyDeck"): ParsedStudyDeck {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { title: fallbackTitle, rows: [], errors: ["No StudyDeck data was provided."] };

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const header = parseDelimitedLine(lines[0], delimiter).map((x) => x.toLowerCase());
  const expected = STUDYDECK_COLUMNS.map((name) => name.toLowerCase());
  const indexes = expected.map((name) => header.indexOf(name));
  const errors: string[] = [];
  if (header.length !== expected.length || header.some((name, index) => name !== expected[index])) {
    return { title: fallbackTitle, rows: [], errors: ["StudyDeck must contain exactly these 9 columns: Deck, Lesson, Front, Back, Explanation, Hint 1, Hint 2, Hint 3, Tags."] };
  }

  const rows = lines.slice(1).map((line, lineIndex) => {
    const cells = parseDelimitedLine(line, delimiter);
    const value = (column: number) => cells[indexes[column]] ?? "";
    const row = {
      deck: value(0), lesson: value(1), front: value(2), back: value(3), explanation: value(4),
      hints: [value(5), value(6), value(7)].filter(Boolean),
      tags: value(8).split("|").map((x) => x.trim()).filter(Boolean),
    };
    if (!row.front || !row.back) errors.push(`Row ${lineIndex + 2}: Front and Back are required.`);
    return row;
  });

  return { title: rows.find((x) => x.deck)?.deck || fallbackTitle, rows, errors };
}
