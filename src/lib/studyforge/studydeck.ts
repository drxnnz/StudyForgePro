import type { QuestionType } from "./types";

export type StudyForgePromptLanguage = "english" | "tagalog" | "taglish";

export interface StudyForgePromptOptions {
  language?: StudyForgePromptLanguage;
  subject?: string;
  autoDetectSubject?: boolean;
  additionalInstructions?: string;
  studyMaterial?: string;
  delivery?: "paste" | "file" | "ai";
}

export const STUDYDECK_COLUMNS = [
  "Deck", "Lesson", "Front", "Back", "Explanation", "Hint 1", "Hint 2", "Hint 3", "Tags",
] as const;

export const STUDYDECK_FORMAT_HEADER = "#format:studydeck-v1";
export const STUDYDECK_SEPARATOR_HEADER = "#separator:Tab";
export const STUDYDECK_COLUMNS_HEADER = `#columns:${STUDYDECK_COLUMNS.join("\t")}`;

const PROMPT_INTRO: Record<StudyForgePromptLanguage, string> = {
  english: "Write the generated study content in English unless standard technical terms are naturally kept in another language.",
  tagalog: "Write the generated study content in natural Tagalog while preserving standard technical terms.",
  taglish: "Write the generated study content in natural Taglish, using Filipino-English phrasing that sounds natural rather than word-for-word translated.",
};

export function buildStudyForgePrompt(options: StudyForgePromptOptions = {}): string {
  const promptLanguage = options.language ?? "english";
  const promptSubject = String(options.subject ?? "").trim();
  const promptAutoSubject = options.autoDetectSubject ?? true;
  const additionalInstructions = String(options.additionalInstructions ?? "").trim();
  const typedStudyMaterial = String(options.studyMaterial ?? "");
  const importMethod = options.delivery ?? "paste";
  const createOptionSubject = Boolean(promptSubject);
  const createOptionAdditional = Boolean(additionalInstructions);
  const createOptionStudyMaterial = Boolean(typedStudyMaterial);
  const promptIntro = PROMPT_INTRO;

 const lang=promptLanguage;
 const intro=promptIntro[lang];
 const languageRule=lang==="english"?"Use clear English unless the source requires standard technical terms.":lang==="tagalog"?"Use natural Tagalog while preserving standard technical terms.":"Use natural Taglish while preserving standard technical terms.";
 const explicitSubject=promptSubject.trim();
 const subjectRule=(createOptionSubject&&explicitSubject)
  ? `Use exactly this Deck/Subject name for every card: ${explicitSubject}. Do not replace it with another name.`
  : promptAutoSubject
   ? "Detect the Deck/Subject name from the study material when it is clearly stated. Use the actual course, subject, or topic name supported by the source. NEVER use \"StudyForge\" as the Deck/Subject name unless the user explicitly provided \"StudyForge\" as the subject name. Do not invent a subject name. If no subject is explicitly named, use the most specific title or topic clearly supported by the material."
   : `Use exactly this Deck/Subject name for every card: ${explicitSubject||"[subject name not provided]"}. Do not replace it with another name.`;
 const extra=(createOptionAdditional&&additionalInstructions.trim())?`\nUSER'S ADDITIONAL INSTRUCTIONS:\n${additionalInstructions.trim()}\nFollow these only when they do not conflict with the required TSV format, source-grounding rules, or card-quality rules.`:"";
 const delivery=importMethod==="file"
  ? `Create a downloadable UTF-8 .txt file containing the final StudyDeck-v1 document. The file must contain ONLY the exact StudyDeck-v1 content defined below. Do not put it inside Markdown fences.`
  : importMethod==="ai"
    ? `Return ONLY the final StudyDeck-v1 document as plain text. Gemini is the producer; StudyForge will validate and normalize the response before any card is stored.`
    : `Return ONLY the final StudyDeck-v1 document as plain text. The user will copy your response directly into StudyForge's Paste / Type field.`;
 return `#format:studydeck-v1
#separator:Tab
#columns:Deck\tLesson\tFront\tBack\tExplanation\tHint 1\tHint 2\tHint 3\tTags

${intro}

NON-NEGOTIABLE OUTPUT CONTRACT:
Your FINAL RESPONSE / FILE CONTENT must be a valid StudyDeck-v1 document that can be pasted directly into StudyForge.
The FINAL OUTPUT MUST BEGIN EXACTLY with these three contiguous metadata lines, in this exact order:
#format:studydeck-v1
#separator:Tab
#columns:Deck\tLesson\tFront\tBack\tExplanation\tHint 1\tHint 2\tHint 3\tTags
There are EXACTLY NINE PHYSICAL TSV COLUMNS in this format. The ONLY physical column separator is a REAL TAB character. There is NEVER a tenth column.
There must be NO blank line between these three metadata lines, NO whitespace-only line between them, and NOTHING before line 1. The separators between Deck, Lesson, Front, Back, Explanation, Hint 1, Hint 2, Hint 3, and Tags on the #columns line MUST be REAL TAB CHARACTERS, not spaces. The separator metadata must use the canonical spelling #separator:Tab. Do not write #separator: Tab. Harmless whitespace around metadata syntax may be normalized by StudyForge, but the canonical output must be #separator:Tab. Do not add blank lines between the three metadata lines.
Every non-empty data row MUST contain EXACTLY NINE columns separated by REAL TAB CHARACTERS in this exact order: Deck, Lesson, Front, Back, Explanation, Hint 1, Hint 2, Hint 3, Tags.
A data row has exactly 8 physical TAB characters: one between each adjacent pair of the nine fields. The 8th TAB ends Hint 3 and starts the Tags field. After that 8th TAB, the row MUST contain ZERO additional TAB characters. Tags is one single field, even when it contains multiple metadata values.
Column 1 = Deck.
Column 2 = Lesson.
Column 3 = Front.
Column 4 = Back.
Column 5 = Explanation.
Column 6 = Hint 1.
Column 7 = Hint 2.
Column 8 = Hint 3.
Column 9 = Tags, and Tags is ALWAYS the FINAL physical column.
Never omit, merge, reorder, split, or add fields. Build each data row as exactly these nine fields, in order, and then join them with exactly 8 REAL TAB characters. Field 9 is the complete Tags value. ALL supported metadata belongs inside that one Tags value.
METADATA PACKING RULE: tf:true or tf:false, __example__:<URI-encoded-example>, __distractors__:<URI-encoded-JSON-array>, and any other existing supported metadata are contents of Tags, never additional TSV fields. When multiple metadata values are present, combine them inside the SAME Tags field using the existing comma-separated tag convention, for example: tf:true, __example__:encoded-example, __distractors__:encoded-json. There MUST be NO TAB between any of those metadata values.
TAB SAFETY: Use REAL TAB characters ONLY for the 8 separators between the nine defined fields. NEVER place a TAB character inside Front, Back, Explanation, Hint 1, Hint 2, Hint 3, or Tags. After the 8th TAB, Tags continues to the end of the row and MUST contain ZERO TAB characters. If Example or distractor metadata needs internal structure, use the existing URI-encoded metadata mechanism. Replace any accidental internal TAB or newline in content with a normal space before returning the row.
EXPLANATION + EXAMPLE REQUIREMENT: Every NEW generated StudyForge card MUST contain both a meaningful Explanation and a meaningful Example. Explanation explains the concept or answer. Example demonstrates it concretely; it must not copy the Explanation or merely restate the Back answer. Keep Examples concise and educational. Ground both fields strictly in the provided study material. For abstract concepts, use a simple concrete example grounded in the material. Do not fabricate unsupported facts. Store Example as metadata inside the single final Tags field using the reserved metadata form __example__:<URI-encoded-example>. It must be part of the Tags value and must never be separated from Tags by a TAB. Do not treat __example__: as a normal user-facing tag. If the source does not state a ready-made example, derive the simplest concrete example directly from facts, entities, relationships, numbers, or scenarios explicitly supported by the source. Example is REQUIRED for every newly generated card; do not leave it empty. Never invent outside facts.
The three metadata lines above must be contiguous. After line 3, data rows may follow directly; do not insert blank lines into the required header sequence.

MCQ DISTRACTOR CANDIDATE CONTRACT:
- Generated cards MAY include a controlled distractor candidate list when safe candidates can be derived from the provided study material.
- Store the candidate list inside the single final Tags field using the reserved metadata form __distractors__:<URI-encoded-JSON-array>. Example: __distractors__:%5B%222012%22%2C%222013%22%2C%222016%22%5D
- The __distractors__ metadata is part of the same Tags value. It must remain in that one field with no TAB before it and no TAB inside its encoded value.
- Candidates MUST come only from the provided study material and MUST be relevant to the same subject. Do not invent external factual distractors.
- For every suitable question, generate up to 10 strong distractor candidates when the source supports them. Fewer than 10 is acceptable only when fewer safe, source-grounded alternatives exist. Never pad with random or invented choices.
- Distractor candidates must match the correct answer's type or semantic role whenever possible: dates with dates, people with people, places with places, numbers with numbers, definitions with related definitions, terms with related terms, and concepts with concepts.
- When useful, prefer plausible misconception distractors that are supported by the study material and clearly different from the correct answer.
- Prefer candidates that match the correct answer's category and structure: other relevant years/dates for year answers, other people actually present in the material for person answers, other relevant places for place answers, related concepts for concept answers, and similarly detailed definitions/phrases for long answers.
- Do not include the correct answer, duplicates, near-duplicates, placeholders, or obviously unrelated/absurd values.
- The list is only a candidate pool. StudyForge will validate, rank, deduplicate, and select candidates at runtime; never assume every candidate will be displayed.
- Example metadata and distractor metadata MUST remain inside the same Tags value. If both are present, keep both in that one field using the existing supported encoding and comma-separated tag convention. NEVER insert a TAB between them.
- Keep ALL Example and distractor metadata inside Tags until the end of the row. The Tags value is always the final field.

HINT DATA CONTRACT:
- Every generated card MUST have three distinct, progressive Hint levels when the source supports them: Hint 1, Hint 2, and Hint 3.
- Keep the StudyDeck-v1 document at exactly nine columns. Do NOT add any additional columns and do NOT change the #columns header.
- Store Hint 1, Hint 2, and Hint 3 in their dedicated Hint columns. Do NOT encode hints inside Tags and do NOT use __hint__: or similar hidden metadata markers.
- Do not omit Hint 1, Hint 2, or Hint 3 when the source supports a useful clue. If the source genuinely cannot support a later hint, leave only that dedicated hint field empty rather than inventing information.
- Hint fields are independent TSV columns. Commas and other normal punctuation are allowed inside Hint text.
- Do not put Hint text into Front, Back, or Explanation.
- Do not concatenate all three hints into one field.

PRE-RETURN VALIDATION (MANDATORY):
Before returning the final response or file, inspect EVERY generated data row character-by-character and verify that it contains EXACTLY 9 physical TAB-separated fields in this exact order: Deck, Lesson, Front, Back, Explanation, Hint 1, Hint 2, Hint 3, Tags. Count the physical TAB separators in every data row: there MUST be EXACTLY 8 TAB separators per row. Verify there are NO TAB characters inside any field and NO ninth or later separator that would create a tenth or later column. Verify that the #columns line is exactly the canonical 9-column header above and that there is no old 5-column header anywhere in the returned output. If any row fails validation, repair the row before returning it. Do not return the output until EVERY data row passes the exact-9-column check.
FINAL METADATA CHECK: For every row, verify that tf metadata, __example__ metadata, __distractors__ metadata, and every other supported metadata token occur only within field 9 (Tags). If any of them appears after a TAB, merge it back into Tags and remove that extra TAB. The final row MUST contain exactly 8 physical TAB characters total, with the 8th TAB being the last TAB character in the row.
COMMON FAILURE FIX (apply to EVERY row including late rows such as row 30+):
- Long Explanation, Hint, or Tags text must stay on ONE physical line. Replace any newline/carriage-return inside a field with a single space.
- Never put a real TAB inside Explanation, Hint 1, Hint 2, Hint 3, or Tags. Replace accidental tabs with a single space.
- __example__:<URI-encoded-example> and __distractors__:<URI-encoded-JSON-array> are NOT extra columns. They belong only inside Tags, comma-separated with other tags, with zero TAB characters around them.
- After building each row, mentally split on TAB: if you get 10+ pieces, join pieces 9..end with commas/spaces back into Tags until the split yields exactly 9 pieces.
- Empty Hint fields are allowed: still emit the TAB so the column positions remain fixed (e.g. Explanation\t\t\tTags still counts as three hint slots).

DO NOT OUTPUT ANYTHING BEFORE #format:studydeck-v1.
DO NOT insert a blank line between #format:studydeck-v1, #separator:Tab, and the #columns line.
DO NOT output an introduction.
DO NOT explain the result.
DO NOT add \"Here is your StudyDeck\" or similar wording.
DO NOT add commentary before the format header.
DO NOT add commentary after the data rows.
DO NOT add Markdown fences or code blocks.
DO NOT add JSON.
DO NOT add Markdown tables.
DO NOT add bullet points.
DO NOT add numbering.
DO NOT add explanations outside the StudyDeck data.
DO NOT change, rename, reorder, or omit the three required metadata lines.
DO NOT omit the #format:studydeck-v1 line.
DO NOT use spaces instead of TAB characters between the nine StudyDeck columns.
DO NOT place any TAB characters inside a field value.
DO NOT create a tenth column under any circumstances. Example is metadata inside Tags; distractors are metadata inside Tags.
DO NOT output anything after the final StudyDeck data row.

${delivery}

ROW CONSTRUCTION ALGORITHM (MANDATORY):
1. Create exactly nine field values in this order: Deck, Lesson, Front, Back, Explanation, Hint 1, Hint 2, Hint 3, Tags.
2. Build the entire Tags value first, including all applicable ordinary tags plus tf:true/tf:false, __example__:<URI-encoded-example>, __distractors__:<URI-encoded-JSON-array>, and any other existing supported metadata. Keep all of them inside this one final Tags value.
3. Remove/replace every TAB and line break that would occur inside any field value, especially Tags, with safe spaces or the existing encoding mechanism. URI-encode __example__ and __distractors__ payloads so they never need a TAB or newline.
4. Join the nine completed field values with exactly eight REAL TAB characters. Do not append any TAB after Tags.
5. Validate the completed row by splitting on physical TAB characters: it MUST produce exactly 9 fields and exactly 8 TAB separators.
6. If the split produces 10 or more fields, the row is invalid; merge everything from the 9th field onward back into the single Tags field and remove all extra TAB characters before returning it.
7. If the split produces fewer than 9 fields, the row is invalid; restore the missing empty Hint or Tags fields so there are still exactly 8 TAB separators and 9 fields.
8. Re-run steps 5-7 on every data row (including rows after 30) until every row passes. Never ship a row that would trigger: "must contain exactly 9 TAB-separated columns".

QUESTION KNOWLEDGE-ITEM CONTRACT:
- Treat each distinct concept, fact, relationship, process, definition, rule, person, place, date, number, or other source-supported knowledge item as a reusable knowledge item before writing cards.
- Generate a substantial set of distinct cards from the WHOLE study material. First analyze all sections/topics, then distribute cards across the material instead of exhausting the first section and stopping.
- Quantity is driven by source support and coverage: small material may yield about 20-30 strong cards, normal material about 40-60, and large material 60-100+ when genuinely supported. These are targets, not permission to invent facts or pad weak content.
- Remove duplicate and near-duplicate knowledge items. If coverage is weak, create replacement questions from under-covered source topics rather than padding with trivial rewordings.
- For each reusable knowledge item, generate multiple semantically equivalent question wordings when the source supports them. Prefer about 4-6 useful variants across definition, recognition, description, reverse phrasing, application, contextual, or situational forms. Never force a variant that changes the answer or becomes unnatural.
- Store question variants in Tags as __variants__:<URI-encoded-JSON-array>. The variants must map to the SAME answer and SAME knowledge item; they are alternate presentations, not additional facts.
- When the source supports application or contextual reasoning, also create 1-3 TRANSFER variants for the same knowledge item. A transfer variant must place the learner in a new situation, example, decision, or practical context that requires applying the SAME underlying concept to reach the SAME answer. Store them in Tags as __transfer_variants__:<URI-encoded-JSON-array>. Do not invent unsupported scenarios.
- Mark the dominant question intent with __question_intent__:definition, recognition, description, reverse, application, contextual, situational, comparison, cause_effect, sequence, or other. Optionally mark __cognitive_level__:recall, understand, apply, analyze, or other.
- Assign a stable __statement_group__ identifier to cards whose answer can be presented as equivalent statements.
- For statement-style answer presentation, generate about 4-6 semantically equivalent correct-answer statements when naturally supported. Store them in Tags as __statement_variants__:<URI-encoded-JSON-array>. Keep them equivalent in meaning and grammatical frame; never change the fact merely to create variety.
- Classify each answer with __answer_type__: person, date, year, place, organization, term, definition, number, process, object, event, category, concept, time, percentage, formula, method, cause, effect, sequence, statement, or other when appropriate.
- Also classify its presentation with __answer_format__: name, date, year, number, phrase, definition, process, statement, list, sentence, formula, or other. ANSWER_TYPE describes what the answer IS; ANSWER_FORMAT describes how the answer is written.

SHARED CATEGORIZED DISTRACTOR BANK CONTRACT:
- Do NOT create ten distractors for every individual question. Build a reusable categorized distractor bank from source-supported alternatives across the deck.
- Categories may include person, date, year, place, organization, term, definition, number, process, object, event, category, concept, time, percentage, formula, method, cause, effect, sequence, statement, and other categories needed by the material.
- Each bank entry is an object with a type/category and a values array. Store the bank in Tags as __distractor_bank__:<URI-encoded-JSON-array>.
- The bank is raw source material for StudyForge. StudyForge will choose final distractors at runtime; do not assume every bank item will be shown.
- Bank candidates MUST be directly supported by the study material. Never invent a fact solely because it would make a convenient distractor.
- Prefer enough candidates to cover the deck's concepts, not an arbitrary fixed count per question.
- For statement answers, bank statements must answer the EXACT question and use the natural grammatical frame of the correct answer. Prefer same opening/frame, similar length, specificity, and sentence structure while changing the meaning. Do not mechanically start every statement with the same word. Use the frame naturally implied by the question and correct answer.
- Avoid the correct answer, duplicates, near-duplicates, accidental truths, mixed categories, and obviously absurd choices.
- Preserve source grounding even when that means a question has fewer usable distractors.

QUALITY-CONTROL PASS:
- After generation, audit the complete deck for topic coverage, duplicate questions, near-duplicate variants, ambiguous wording, accidental multiple-correct choices, unsupported distractors, wrong answer types, and malformed metadata.
- Replace weak cards with better source-grounded cards from under-covered topics. Do not pad the deck with garbage.
- Verify every __variants__ item has the same answer as its parent knowledge item.
- Verify every __transfer_variants__ item requires application of the same knowledge item, preserves the same defensible answer, and uses only source-supported context.
- Verify __question_intent__ and __cognitive_level__ match the actual reasoning demand.
- Verify every __statement_variants__ item has the same meaning as the canonical Back answer and is a natural equivalent statement.
- Verify every __distractor_bank__ category contains only candidates of the declared category.
- Verify statement distractors match the question-specific grammatical frame and semantic domain.
- Verify __answer_type__, __answer_format__, and __statement_group__ metadata are internally consistent.

Generation rules:
- ${languageRule}
- ${subjectRule}
- Use tabs between every data column. Never use spaces as column separators.
- Do not invent facts or information not supported by the source.
- Generate as many distinct, useful cards as the source supports. Do not artificially limit the number.
- Avoid duplicate or near-duplicate cards.
- Group cards into lessons.
- Preserve the lesson order and structure where possible.
- Every card must have a Deck and Lesson.
- Keep Front and Back concise but accurate.

MULTIPLE-CHOICE DISTRACTOR QUALITY RULES:
- Generate every card so its Front clearly identifies one defensible correct Back answer from the source material.
- Do not generate random distractors. Any multiple-choice distractors must be plausible alternatives belonging to the same concept, category, topic, or answer type as the correct answer.
- Prefer source-supported alternatives from the same concept family, lesson, topic, related tags, or subject rather than unrelated facts.
- Match the correct answer's answer type whenever practical: people with people, places with places, dates/years with dates/years, numbers/values with comparable values and units, formulas with formulas, processes with processes, definitions with definitions, and terms/categories with comparable terms/categories.
- Match approximate answer length, grammatical structure, specificity, and level of detail when practical. Do not make the correct answer uniquely long, detailed, complete, technical, or grammatically distinct.
- Avoid obvious wording clues, keyword giveaways, formatting differences, or answer-length patterns that reveal the correct option.
- Never create duplicate or near-duplicate alternatives. A distractor must represent a genuinely different concept, value, process, definition, person, place, or category.
- Do not use an answer that merely rephrases the correct answer or differs only by punctuation, capitalization, spacing, or trivial wording.
- Do not fabricate unsupported facts merely to create a distractor. If the source does not provide enough related alternatives, preserve source integrity rather than inventing facts.
- When a card will be used in MCQ mode, its Back should be concise enough to support realistic alternatives and its Explanation should provide enough source-grounded context to distinguish related concepts without making the correct answer uniquely obvious.

- Keep Front and Back concise but accurate.
- Every card MUST include a short Explanation in the fifth column, using 1-3 sentences explaining why the Back answer is correct based only on the source.
- The Explanation must add understanding, not simply repeat the Back answer.
- Every card MUST include up to three concise, question-specific Hint levels in the dedicated Hint 1, Hint 2, and Hint 3 columns.
- Hint 1 is the broadest and least revealing clue. Hint 2 must be more specific than Hint 1. Hint 3 must be the strongest useful clue while still requiring the learner to produce or determine the answer.
- Hint 1, Hint 2, and Hint 3 must all refer to the same question and answer and must be meaningfully different from one another. Never repeat the same Hint text at multiple levels.
- Every Hint must be source-grounded. Do not invent facts, examples, dates, names, relationships, definitions, or contextual information, and never contradict the source.
- Hints must not simply rephrase the answer, directly state the answer, identify the correct MCQ option by position or wording, reveal True/False directly, give away a Type Answer response, or directly reveal the Back answer.
- Do not use generic filler such as "Think carefully", "Recall what you learned", or "Focus on the key concept" when a specific clue can be derived from the source.
- Adapt Hint levels to the question mode: MCQ Hint 1 is broad conceptual/contextual, Hint 2 is narrower, and Hint 3 is strongest without identifying the correct option; True/False Hint 1 is broad factual, Hint 2 is more specific factual/contextual, and Hint 3 is strongest without saying True or False; Type Answer/Identification uses progressively more specific conceptual recall cues and never answer letters; Flashcards use progressively stronger retrieval/memory cues without directly revealing Back.
- Respect difficulty: Easy may use stronger contextual cues, Normal moderate cues, and Hard subtler but still useful cues while preserving the three-level progression.
- The frontend separately handles Type Answer random unrevealed answer-letter hints. Do not encode answer letters or spelling sequences in generated Hint levels.
- Every Hint level must differ meaningfully from the Explanation and from the other Hint levels and must be written for that individual question/card.
- Use UTF-8 text.
- Tags should contain concise topic tags separated by commas when useful. Any supported metadata markers are also comma-separated contents of this same final Tags field.
- If a field itself contains a tab or line break, replace that internal whitespace with a normal space so every data row remains exactly nine TAB-separated columns.

True/False rules:
- Create True/False-compatible cards when the source supports factual statements that can be judged true or false.
- The Front must be a complete factual statement, not an answer or a question asking for the answer.
- Every True/False-compatible card MUST include exactly one truth marker in Tags: tf:true or tf:false.
- The truth marker is text inside the final Tags field. It is not its own field. If Example or distractor metadata is also present, keep tf:true/tf:false and those metadata values together inside the same Tags field with no TAB between them.
- A tf:true card must have a statement directly supported by the source.
- A tf:false card must be meaningfully false based on the source, such as changing a fact, relationship, quantity, definition, or condition that the source establishes.
- Do not invent unrelated false facts just to create false cards.
- Do not make every True/False card true. Keep True and False reasonably balanced when the source allows it.
- Do not put the truth value in Front or Back as the only content. The tag is the machine-readable truth marker.

STYLE AND PUNCTUATION RULES:
- Never use long dash punctuation.
- Use normal punctuation and natural sentence structure.
- Use a normal hyphen (-) only when it is genuinely part of a word, compound term, technical term, or required notation. Do not add decorative or AI-style hyphenation.
- Keep English, Tagalog, and Taglish natural. Do not translate technical terms unnaturally.

${extra}

STUDY MATERIAL:
${typedStudyMaterial.trim()||"[paste or type the study material here]"}`;

}

export interface ParsedStudyDeckRow {
  deck: string;
  lesson: string;
  front: string;
  back: string;
  explanation: string;
  hints: string[];
  example: string;
  distractorCandidates: string[];
  interactiveType: string;
  acceptedAnswers: string[];
  orderItems: string[];
  questionVariants: string[];
  transferVariants: string[];
  questionIntent: string;
  cognitiveLevel: string;
  statementVariants: string[];
  answerType: string;
  answerFormat: string;
  statementGroupId: string;
  distractorBank: unknown[];
  tags: string[];
}

function normalizeStudyDeckText(raw: unknown): string {
  return String(raw ?? "")
    .replace(/^\uFEFF+/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u2028|\u2029/g, "\n")
    .replace(/[\u200B\u200C\u200D\u2060]/g, "");
}

function normalizeMetadataLine(line: string): string {
  const cleaned = line.replace(/\u00A0/g, " ").trim();
  const format = cleaned.match(/^#\s*format\s*:\s*(.*)$/i);
  if (format) return `#format:${format[1].trim()}`;
  const separator = cleaned.match(/^#\s*separator\s*:\s*(.*)$/i);
  if (separator) return `#separator:${separator[1].trim()}`;
  const columns = cleaned.match(/^#\s*columns\s*:\s*(.*)$/i);
  if (columns) return `#columns:${columns[1].trim()}`;
  return cleaned;
}

function normalizeDataLine(line: string): string {
  return line
    .replace(/\\t/g, "\t")
    .replace(/\\u0009/gi, "\t")
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, "");
}

function splitRow(line: string): string[] {
  const normalized = normalizeDataLine(line);
  let cells = normalized.split("\t");
  if (cells.length === 1) {
    const fallback = normalized.split(/\s{2,}|\u2192|\u21e5/).map((x) => x.trim()).filter(Boolean);
    if (fallback.length >= 4) cells = fallback;
  }
  return cells;
}

function repairCells(cells: string[]): string[] | null {
  const parts = cells.map((c) => String(c ?? ""));
  if (parts.length === 9) return parts;
  if (parts.length > 9) return [...parts.slice(0, 8), parts.slice(8).map((s) => s.trim()).filter(Boolean).join(", ")];
  if (parts.length >= 4) return [...parts, ...Array(9 - parts.length).fill("")];
  return null;
}

function decodeUri(value: string, label: string, row: number): string {
  try { return decodeURIComponent(value.replace(new RegExp(`^${label}:`, "i"), "")); }
  catch { throw new Error(`Invalid StudyDeck file: row ${row} contains malformed ${label} metadata.`); }
}

function parseJsonMetadata(value: string, label: string, row: number): unknown[] {
  try {
    const parsed = JSON.parse(decodeUri(value, label, row));
    if (!Array.isArray(parsed)) throw new Error("not-array");
    return parsed;
  } catch {
    throw new Error(`Invalid StudyDeck file: row ${row} contains malformed ${label} metadata.`);
  }
}

function parseMetadata(tagsValue: string, row: number) {
  const rawTags = tagsValue.split(",").map((tag) => tag.trim()).filter(Boolean);
  const find = (name: string) => rawTags.find((tag) => new RegExp(`^${name}:`, "i").test(tag));
  const exampleTag = find("__example__");
  const distractorTag = find("__distractors__");
  const typeTag = find("__type__");
  const acceptedTag = find("__accepted__");
  const orderTag = find("__order__");
  const variantsTag = find("__variants__");
  const transferVariantsTag = find("__transfer_variants__");
  const questionIntentTag = find("__question_intent__");
  const cognitiveLevelTag = find("__cognitive_level__");
  const statementVariantsTag = find("__statement_variants__");
  const answerTypeTag = find("__answer_type__");
  const answerFormatTag = find("__answer_format__");
  const statementGroupTag = find("__statement_group__");
  const bankTag = find("__distractor_bank__");
  const example = exampleTag ? decodeUri(exampleTag, "__example__", row) : "";
  const distractorCandidates = distractorTag ? parseJsonMetadata(distractorTag, "__distractors__", row).map((x) => String(x ?? "").trim()).filter(Boolean) : [];
  const acceptedAnswers = acceptedTag ? parseJsonMetadata(acceptedTag, "__accepted__", row).map((x) => String(x ?? "").trim()).filter(Boolean) : [];
  const orderItems = orderTag ? parseJsonMetadata(orderTag, "__order__", row).map((x) => String(x ?? "").trim()).filter(Boolean) : [];
  const questionVariants = variantsTag ? parseJsonMetadata(variantsTag, "__variants__", row).map((x) => String(x ?? "").trim()).filter(Boolean) : [];
  const transferVariants = transferVariantsTag ? parseJsonMetadata(transferVariantsTag, "__transfer_variants__", row).map((x) => String(x ?? "").trim()).filter(Boolean) : [];
  const statementVariants = statementVariantsTag ? parseJsonMetadata(statementVariantsTag, "__statement_variants__", row).map((x) => String(x ?? "").trim()).filter(Boolean) : [];
  const distractorBank = bankTag ? parseJsonMetadata(bankTag, "__distractor_bank__", row) : [];
  const questionIntent = questionIntentTag ? decodeUri(questionIntentTag, "__question_intent__", row).trim().toLowerCase() : "";
  const cognitiveLevel = cognitiveLevelTag ? decodeUri(cognitiveLevelTag, "__cognitive_level__", row).trim().toLowerCase() : "";
  const answerType = answerTypeTag ? decodeUri(answerTypeTag, "__answer_type__", row).trim().toLowerCase() : "";
  const answerFormat = answerFormatTag ? decodeUri(answerFormatTag, "__answer_format__", row).trim().toLowerCase() : "";
  const statementGroupId = statementGroupTag ? decodeUri(statementGroupTag, "__statement_group__", row).trim() : "";
  const interactiveType = typeTag ? typeTag.replace(/^__type__:/i, "").trim().toLowerCase() : "";
  const reserved = /^__(?:example|distractors|type|accepted|order|variants|transfer_variants|question_intent|cognitive_level|statement_variants|answer_type|answer_format|statement_group|distractor_bank):/i;
  return { example, distractorCandidates, interactiveType, acceptedAnswers, orderItems, questionVariants, transferVariants, questionIntent, cognitiveLevel, statementVariants, answerType, answerFormat, statementGroupId, distractorBank, tags: rawTags.filter((tag) => !reserved.test(tag)) };
}

export function parseStudyDeck(text: string): { rows: ParsedStudyDeckRow[]; normalizedText: string } {
  const normalizedText = normalizeStudyDeckText(text);
  const lines = normalizedText.split("\n");
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (!lines.length) throw new Error("The StudyDeck file is empty.");
  const meaningful = lines.map((value, index) => ({ value: normalizeMetadataLine(value), index })).filter((x) => x.value);
  if (meaningful[0]?.value !== STUDYDECK_FORMAT_HEADER) throw new Error("Invalid StudyDeck file: the first meaningful line must be #format:studydeck-v1.");
  if (meaningful[1]?.value !== STUDYDECK_SEPARATOR_HEADER) throw new Error("Invalid StudyDeck file: the second meaningful line must be #separator:Tab.");
  if (meaningful[2]?.value !== STUDYDECK_COLUMNS_HEADER) throw new Error("Invalid StudyDeck file: the #columns header must contain the canonical nine StudyDeck-v1 columns in order.");
  const start = meaningful[2].index + 1;
  const dataLines: string[] = [];
  for (let i = start; i < lines.length; i += 1) {
    const line = normalizeDataLine(lines[i]);
    if (!line.trim()) continue;
    const tabCount = (line.match(/\t/g) || []).length;
    if (dataLines.length && tabCount < 3 && splitRow(line).length < 4) {
      dataLines[dataLines.length - 1] = `${dataLines[dataLines.length - 1].replace(/\s+$/, "")} ${line.trim()}`;
    } else dataLines.push(line);
  }
  if (!dataLines.length) throw new Error("Invalid StudyDeck file: add at least one StudyDeck card row after the required headers.");
  const rows: ParsedStudyDeckRow[] = [];
  dataLines.forEach((rawLine, index) => {
    let cells = splitRow(rawLine);
    if (cells.length !== 9) {
      const repaired = repairCells(cells);
      if (!repaired) throw new Error(`Invalid StudyDeck file: row ${index + 1} has ${cells.length} column(s); need exactly 9 TAB-separated columns.`);
      cells = repaired;
    }
    const [deck, lesson, front, back, explanation, hint1, hint2, hint3, tags] = cells.map((cell) => cell.trim());
    if (!deck || !lesson || !front || !back) throw new Error(`Invalid StudyDeck file: row ${index + 1} is missing required Deck, Lesson, Front, or Back content.`);
    const metadata = parseMetadata(tags, index + 1);
    rows.push({ deck, lesson, front, back, explanation, hints: [hint1, hint2, hint3], ...metadata });
  });
  return { rows, normalizedText };
}

export function normalizeStudyDeckForStorage(text: string): string {
  const parsed = parseStudyDeck(text);
  return [STUDYDECK_FORMAT_HEADER, STUDYDECK_SEPARATOR_HEADER, STUDYDECK_COLUMNS_HEADER, ...parsed.rows.map((row) => {
    const tags = [
      ...row.tags,
      row.example ? `__example__:${encodeURIComponent(row.example)}` : "",
      row.distractorCandidates.length ? `__distractors__:${encodeURIComponent(JSON.stringify(row.distractorCandidates))}` : "",
      row.interactiveType ? `__type__:${row.interactiveType}` : "",
      row.acceptedAnswers.length ? `__accepted__:${encodeURIComponent(JSON.stringify(row.acceptedAnswers))}` : "",
      row.orderItems.length ? `__order__:${encodeURIComponent(JSON.stringify(row.orderItems))}` : "",
      row.questionVariants.length ? `__variants__:${encodeURIComponent(JSON.stringify(row.questionVariants))}` : "",
      row.transferVariants.length ? `__transfer_variants__:${encodeURIComponent(JSON.stringify(row.transferVariants))}` : "",
      row.questionIntent ? `__question_intent__:${encodeURIComponent(row.questionIntent)}` : "",
      row.cognitiveLevel ? `__cognitive_level__:${encodeURIComponent(row.cognitiveLevel)}` : "",
      row.statementVariants.length ? `__statement_variants__:${encodeURIComponent(JSON.stringify(row.statementVariants))}` : "",
      row.answerType ? `__answer_type__:${encodeURIComponent(row.answerType)}` : "",
      row.answerFormat ? `__answer_format__:${encodeURIComponent(row.answerFormat)}` : "",
      row.statementGroupId ? `__statement_group__:${encodeURIComponent(row.statementGroupId)}` : "",
      row.distractorBank.length ? `__distractor_bank__:${encodeURIComponent(JSON.stringify(row.distractorBank))}` : "",
    ].filter(Boolean).join(", ");
    const fields = [row.deck, row.lesson, row.front, row.back, row.explanation, ...row.hints, tags]
      .map((field) => String(field ?? "").replace(/[\t\r\n]+/g, " ").trim());
    return fields.join("\t");
  })].join("\n");
}

export function questionTypeFromStudyDeckRow(row: ParsedStudyDeckRow): QuestionType {
  if (/^(true|false)$/i.test(row.interactiveType) || /(?:^|,\s*)tf:(?:true|false)(?:,|$)/i.test(row.tags.join(", "))) return "tf";
  if (row.interactiveType === "mcq" || row.distractorCandidates.length > 0) return "mcq";
  if (row.interactiveType === "flashcard") return "flashcard";
  return "type";
}
