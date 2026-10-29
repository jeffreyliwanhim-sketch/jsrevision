import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { Part } from "@/lib/ai/quiz.server";

type Material = Database["public"]["Tables"]["materials"]["Row"];

async function materialParts(supabase: SupabaseClient<Database>, mats: Material[]) {
  const { bytesToBase64 } = await import("@/lib/ai/quiz.server");
  const parts: Part[] = [];
  for (const m of mats) {
    const label = m.kind === "past_paper" ? "PAST PAPER" : "EXAM CONTENT";
    parts.push({ type: "text", text: `--- ${label}: ${m.title} ---\n${m.content || ""}` });
    if (m.file_path) {
      const { data: blob, error } = await supabase.storage.from("materials").download(m.file_path);
      if (error || !blob) continue;
      const b64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
      const mime = m.mime_type || blob.type;
      if (mime === "application/pdf") {
        parts.push({ type: "file", filename: `${m.title}.pdf`, data: b64, mediaType: "application/pdf" });
      } else if (mime.startsWith("image/")) {
        parts.push({ type: "image", image: new URL(`data:${mime};base64,${b64}`) });
      }
    }
  }
  return parts;
}

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        materialIds: z.array(z.string().uuid()).min(1).max(10),
        mode: z.enum(["quiz", "mock"]),
        count: z.number().int().min(3).max(30),
        lang: z.string().max(10),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { generateQuizWithAI } = await import("@/lib/ai/quiz.server");
    const { supabase } = context;
    const { data: mats, error } = await supabase.from("materials").select("*").in("id", data.materialIds);
    if (error) throw new Error(error.message);
    if (!mats?.length) throw new Error("No materials found.");
    const parts = await materialParts(supabase, mats);
    const quiz = await generateQuizWithAI({ parts, mode: data.mode, count: data.count, lang: data.lang });
    const total = quiz.questions.reduce((s, q) => s + q.marks, 0);
    const { data: row, error: insErr } = await supabase
      .from("quizzes")
      .insert({ title: quiz.title, mode: data.mode, questions: quiz.questions, total })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    return { id: row.id };
  });

export const classifyMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { classifySubjectWithAI } = await import("@/lib/ai/quiz.server");
    const { supabase } = context;
    const { data: m, error } = await supabase.from("materials").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const subject = await classifySubjectWithAI(await materialParts(supabase, [m]));
    await supabase.from("materials").update({ subject }).eq("id", data.id);
    return { subject };
  });

export const generateStudySet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        materialId: z.string().uuid(),
        kind: z.enum(["flashcards", "translation", "polysemy", "notes"]),
        lang: z.string().max(10),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { generateStudySetWithAI } = await import("@/lib/ai/quiz.server");
    const { supabase } = context;
    const { data: m, error } = await supabase.from("materials").select("*").eq("id", data.materialId).single();
    if (error) throw new Error(error.message);
    const set = await generateStudySetWithAI(data.kind, await materialParts(supabase, [m]), data.lang);
    const { data: row, error: insErr } = await supabase
      .from("study_sets")
      .insert({ material_id: m.id, kind: data.kind, title: set.title || m.title, data: set.items as never })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    return { id: row.id };
  });

export const generateNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        materialIds: z.array(z.string().uuid()).min(1).max(10),
        lang: z.string().max(10),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { generateStudySetWithAI } = await import("@/lib/ai/quiz.server");
    const { supabase } = context;
    const { data: mats, error } = await supabase.from("materials").select("*").in("id", data.materialIds);
    if (error) throw new Error(error.message);
    if (!mats?.length) throw new Error("No materials found.");
    const parts = await materialParts(supabase, mats);
    const set = await generateStudySetWithAI("notes", parts, data.lang);
    const { data: row, error: insErr } = await supabase
      .from("study_sets")
      .insert({ material_id: mats[0]!.id, kind: "notes", title: set.title || mats[0]!.title, data: set.items as never })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    return { id: row.id };
  });

