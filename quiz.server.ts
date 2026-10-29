import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

export type QuizQuestion = {
  type: "mcq" | "short";
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  marks: number;
  keywords: string[];
  optionNotes: string[];
};

export type Part =
  | { type: "text"; text: string }
  | { type: "image"; image: URL }
  | { type: "file"; filename: string; data: string; mediaType: "application/pdf" };

export const SUBJECTS = [
  "chinese", "english", "math", "biology", "chemistry", "physics", "science",
  "history", "chinese_history", "geography", "economics", "ict", "other",
] as const;

const LANG_NAME: Record<string, string> = {
  en: "English",
  "zh-Hant": "Traditional Chinese (繁體中文)",
  "zh-Hans": "Simplified Chinese (简体中文)",
};

function friendlyAiError(err: unknown): string {
  const e = err as { statusCode?: number; responseBody?: string; message?: string };
  let msg = "";
  try { msg = JSON.parse(e?.responseBody ?? "").message ?? ""; } catch { /* ignore */ }
  switch (e?.statusCode) {
    case 402: return `AI credits have run out (${msg || "Not enough credits"}). Please top up AI credits in workspace settings, then try again.`;
    case 403: return msg || "AI access is blocked for this workspace.";
    case 429: return "The AI is busy right now. Please wait a moment and try again.";
  }
  return msg || e?.message || "The AI request failed. Please try again.";
}

async function runJson<T>(instructions: string, parts: Part[], effort: "low" | "medium" = "medium"): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const messages: ModelMessage[] = [
    { role: "user", content: [...parts, { type: "text", text: "Return the JSON now." }] },
  ];
  let streamError: unknown;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: `${instructions}\nReturn ONLY valid JSON, no markdown fences.`,
    messages,
    maxRetries: 0,
    onError: ({ error }) => { streamError = error; },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: effort,
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  let text: string;
  try {
    text = await result.text;
  } catch (e) {
    throw new Error(friendlyAiError(streamError ?? e));
  }
  if (streamError) throw new Error(friendlyAiError(streamError));
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("The AI did not return a result. Please try again.");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

const langRule = (lang: string) =>
  `Write in the same language as the materials; if mixed or unclear, use ${LANG_NAME[lang] ?? "English"}.`;

export async function generateQuizWithAI(opts: {
  parts: Part[];
  mode: "quiz" | "mock";
  count: number;
  lang: string;
}): Promise<{ title: string; questions: QuizQuestion[] }> {
  const instructions = `You are an expert exam setter. Using the student's EXAM CONTENT (syllabus/notes) and PAST PAPERS provided, write ${
    opts.mode === "mock"
      ? `a mock exam paper with ${opts.count} questions that closely mirrors the structure, question styles, difficulty, wording and mark allocation of the past papers, including long-answer questions where the past papers have them`
      : `a quick revision quiz of ${opts.count} questions, mostly multiple choice, covering the key points`
  }. Questions must only test topics found in the materials. ${langRule(opts.lang)}
For every "short" (written / long-answer) question give a marking scheme as "keywords": 3-8 short key points or keywords an answer MUST contain to score (e.g. 誠信, 禮貌, 正面描寫). Each keyword is worth an equal share of the question's marks.
Every question needs a DETAILED "explanation" (2-5 sentences): the reasoning, the key concept from the materials and how to reach the answer. For every "mcq" question also give "optionNotes": one note per option, in the same order as "options", saying why that option is correct, or specifically why it is wrong (the misconception or error it represents).
JSON shape: {"title": string, "questions": [{"type": "mcq" | "short", "question": string, "options": string[] (4 for mcq, empty for short), "answer": string (mcq: exactly one option; short: model answer), "explanation": string, "marks": number, "keywords": string[] (empty for mcq), "optionNotes": string[] (mcq: same length and order as options; empty for short)}]}`;
  const parsed = await runJson<{ title?: string; questions?: QuizQuestion[] }>(instructions, opts.parts);
  const questions = (parsed.questions ?? [])
    .filter((q) => q && q.question)
    .map((q) => ({
      type: q.type === "mcq" && Array.isArray(q.options) && q.options.length > 1 ? "mcq" : "short",
      question: String(q.question),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      answer: String(q.answer ?? ""),
      explanation: String(q.explanation ?? ""),
      marks: Number(q.marks) || 1,
      keywords: Array.isArray(q.keywords) ? q.keywords.map(String).filter(Boolean) : [],
      optionNotes: Array.isArray(q.optionNotes) ? q.optionNotes.map(String) : [],
    })) as QuizQuestion[];
  if (!questions.length) throw new Error("The AI did not return any questions. Please try again.");
  return { title: parsed.title || "Quiz", questions };
}

export async function classifySubjectWithAI(parts: Part[]): Promise<string> {
  const r = await runJson<{ subject?: string }>(
    `Classify this school study material into exactly one subject from: ${SUBJECTS.join(", ")}. "chinese" means Chinese language & literature (中文科, incl. 文言文). JSON shape: {"subject": string}`,
    parts,
    "low",
  );
  return (SUBJECTS as readonly string[]).includes(r.subject ?? "") ? r.subject! : "other";
}

export type StudyKind = "flashcards" | "translation" | "polysemy" | "notes";

export async function generateStudySetWithAI(kind: StudyKind, parts: Part[], lang: string) {
  const prompts: Record<StudyKind, string> = {
    flashcards: `Create 12-25 revision flashcards covering the most important facts, terms and ideas in the material. ${langRule(lang)}
JSON shape: {"title": string, "items": [{"front": string, "back": string}]}`,
    translation: `The material contains Classical Chinese (文言文). Build a sentence-by-sentence 對譯對照 table: split the classical text into sentences, give a faithful modern vernacular Chinese translation (語譯) in the same script as the material (繁體 or 简体), and name the sentence pattern (句式) when there is a notable one — e.g. 判斷句, 被動句, 倒裝句（賓語前置/狀語後置/定語後置/主謂倒裝）, 省略句, 固定句式 — otherwise use "". Add a short note on key words. Use 10-40 rows. If there is no classical text, translate the most important classical quotations or return an empty list.
JSON shape: {"title": string, "items": [{"original": string, "translation": string, "pattern": string, "note": string}]}`,
    polysemy: `The material contains Classical Chinese (文言文). Build a 一字多義 table: pick 6-15 important characters that carry different meanings in the text (or in commonly examined classical texts on the same topic). For each, list 2-5 meanings, each with part of speech, the meaning in modern Chinese, and an example sentence (prefer sentences from the material, give the source title).
JSON shape: {"title": string, "items": [{"char": string, "senses": [{"pos": string, "meaning": string, "example": string, "source": string}]}]}`,
    notes: `Write clear, well-organised revision notes from the material, as a top student would make before an exam. ${langRule(lang)}
Use 4-10 sections. Each section has a short "heading" and 3-8 concise "points" (each point one key fact, definition, formula or idea — specific, not vague). Include important examples, dates or formulas where the material has them.
JSON shape: {"title": string, "items": [{"heading": string, "points": string[]}]}`,
  };
  const r = await runJson<{ title?: string; items?: unknown[] }>(prompts[kind], parts);
  const items = Array.isArray(r.items) ? r.items : [];
  if (!items.length) throw new Error("The AI could not build this from the material.");
  return { title: r.title || "", items };
}

export function bytesToBase64(bytes: Uint8Array) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
