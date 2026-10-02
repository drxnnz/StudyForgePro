import { buildStudyDeckPrompt, parseStudyDeckCsv, rowsToStudySet, validateStudyDeckRows } from "./studydeck";
import type { StudySet } from "./types";

const DEFAULT_MODEL = "gemini-3.8-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiGenerationOptions {
  apiKey: string;
  file: File;
  questionCount: number;
  difficulty: "easy" | "mixed" | "hard";
  focus: string[];
}

function stripMarkdownFences(value: string) {
  return value.replace(/^```(?:csv|text)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

async function filePart(file: File) {
  const data = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < data.length; i += chunkSize) binary += String.fromCharCode(...data.subarray(i, i + chunkSize));
  return { inline_data: { mime_type: file.type || "application/octet-stream", data: btoa(binary) } };
}

export async function generateStudySetWithGemini(options: GeminiGenerationOptions): Promise<StudySet> {
  if (!options.apiKey.trim()) throw new Error("Add a Gemini API key before generating a study set.");
  if (options.file.size > 15 * 1024 * 1024) throw new Error("For browser-safe generation, keep the source document under 15 MB.");
  const prompt = buildStudyDeckPrompt({ questionCount: options.questionCount, difficulty: options.difficulty, focus: options.focus });
  const body = {
    contents: [{ role: "user", parts: [{ text: `${prompt}\n\nSOURCE FILE: ${options.file.name}` }, await filePart(options.file)] }],
    generationConfig: { temperature: 0.2, responseMimeType: "text/plain" },
  };
  const response = await fetch(`${ENDPOINT}/${DEFAULT_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": options.apiKey.trim() },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `Gemini request failed (${response.status}).`);
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
  if (!text.trim()) throw new Error("Gemini returned no study content.");
  const rows = parseStudyDeckCsv(stripMarkdownFences(text));
  const validation = validateStudyDeckRows(rows);
  if (!validation.valid) throw new Error(`Generated StudyDeck failed validation: ${validation.errors.slice(0, 3).join(" ")}`);
  return rowsToStudySet(rows, options.file.name.replace(/\.[^.]+$/, "") || "AI StudyDeck", options.file.name);
}
