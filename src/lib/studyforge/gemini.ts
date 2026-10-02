import { createServerFn } from "@tanstack/react-start";

export interface GenerateStudyDeckInput {
  prompt: string;
}

export const generateStudyDeckWithGemini = createServerFn({ method: "POST" })
  .inputValidator((input: GenerateStudyDeckInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("Gemini is not configured. Add GEMINI_API_KEY to the server environment before using native AI generation.");
    }

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: data.prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Gemini generation failed (${response.status}). ${detail.slice(0, 300)}`.trim());
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    if (!text) throw new Error("Gemini returned an empty response. No StudyDeck output was generated.");
    return { text };
  });
