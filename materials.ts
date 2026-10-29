import { supabase } from "@/integrations/supabase/client";

export const SUBJECT_KEYS = [
  "chinese", "english", "math", "biology", "chemistry", "physics", "science",
  "history", "chinese_history", "geography", "economics", "ict", "other",
] as const;
export const STATUSES = ["weak", "review", "mastered"] as const;
export type Status = (typeof STATUSES)[number];

export const materialsQuery = {
  queryKey: ["materials"],
  queryFn: async () => {
    const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};

export const STATUS_CLS: Record<Status, string> = {
  weak: "bg-destructive/10 text-destructive",
  review: "bg-warning/15 text-warning",
  mastered: "bg-success/15 text-success",
};

/** Review rules (apply to every subject):
 *  - "now": status is 未熟練 (weak) → needs immediate review
 *  - "overdue": not reviewed for more than REVIEW_DAYS days
 */
export const REVIEW_DAYS = 5;
export type ReviewState = "now" | "overdue" | "ok";
export function reviewState(m: { status: string; last_reviewed_at: string }): ReviewState {
  if (m.status === "weak") return "now";
  const days = (Date.now() - new Date(m.last_reviewed_at).getTime()) / 86_400_000;
  return days > REVIEW_DAYS ? "overdue" : "ok";
}
export function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}
