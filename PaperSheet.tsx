import type { CSSProperties } from "react";
import { useI18n } from "@/lib/i18n";

type Q = { type: "mcq" | "short"; question: string; options: string[]; answer: string; explanation: string; marks: number; keywords?: string[]; optionNotes?: string[] };

// Printed documents are rendered to an image for the PDF; the renderer cannot read the
// app's color tokens, so this sheet uses plain print ink colors on white paper.
const INK = "#111111";
const SUBTLE = "#555555";
const RULE = "#bbbbbb";
const base: CSSProperties = { color: INK, borderColor: RULE, backgroundColor: "transparent" };

export function PaperSheet({ title, questions, variant }: { title: string; questions: Q[]; variant: "paper" | "scheme" }) {
  const { t } = useI18n();
  const total = questions.reduce((s, q) => s + (q.marks || 0), 0);
  const letters = "ABCDEFGH";
  return (
    <div
      style={{
        ...base,
        width: "186mm",
        backgroundColor: "#ffffff",
        fontFamily: '"Times New Roman", "Songti TC", "PMingLiU", "Noto Serif TC", "Noto Serif SC", serif',
        fontSize: "14pt",
        lineHeight: 1.6,
      }}
    >
      <div style={{ ...base, borderBottom: `2px solid ${INK}`, paddingBottom: "8px", marginBottom: "14px", textAlign: "center" }}>
        <div style={{ ...base, fontSize: "9pt", letterSpacing: "0.15em", color: SUBTLE }}>JSREVISION</div>
        <div style={{ ...base, fontSize: "20pt", fontWeight: 700 }}>{title}</div>
        <div style={{ ...base, fontSize: "12pt", fontWeight: 600 }}>{variant === "scheme" ? t("markingScheme") : ""}</div>
      </div>
      <div style={{ ...base, display: "flex", justifyContent: "space-between", fontSize: "13pt", marginBottom: "18px" }}>
        {variant === "paper" ? <span style={base}>{t("name")}: ______________________</span> : <span style={base} />}
        <span style={base}>{t("totalMarks")}: {variant === "paper" ? `____ / ${total}` : total}</span>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="pdf-q" style={{ ...base, marginBottom: "16px", breakInside: "avoid" }}>
          <div style={{ ...base, display: "flex", gap: "8px" }}>
            <span style={{ ...base, fontWeight: 700 }}>{i + 1}.</span>
            <span style={{ ...base, flex: 1, whiteSpace: "pre-wrap" }}>{q.question}</span>
            <span style={{ ...base, whiteSpace: "nowrap" }}>[{q.marks}]</span>
          </div>
          {variant === "paper" ? (
            q.type === "mcq" ? (
              <div style={{ ...base, paddingLeft: "22px", marginTop: "4px" }}>
                {q.options.map((o, j) => (
                  <div key={j} style={base}>{letters[j]}. {o}</div>
                ))}
              </div>
            ) : (
              <div style={{ ...base, paddingLeft: "22px", marginTop: "6px" }}>
                {Array.from({ length: Math.min(12, Math.max(3, (q.marks || 1) * 2)) }).map((_, j) => (
                  <div key={j} style={{ ...base, borderBottom: `1px solid ${RULE}`, height: "30px" }} />
                ))}
              </div>
            )
          ) : (
            <div style={{ ...base, paddingLeft: "22px", marginTop: "4px" }}>
              <div style={base}>
                <b style={base}>{t("answer")}: </b>
                <span style={{ ...base, whiteSpace: "pre-wrap" }}>
                  {q.type === "mcq" && q.options.indexOf(q.answer) >= 0 ? `${letters[q.options.indexOf(q.answer)]}. ` : ""}
                  {q.answer}
                </span>
              </div>
              {(q.keywords?.length ?? 0) > 0 && (
                <div style={{ ...base, marginTop: "2px" }}>
                  <b style={base}>{t("keywordsTitle").split(" — ")[0]}: </b>
                  {(q.keywords ?? []).map((k, j) => (
                    <span key={j} style={base}>{j ? "；" : ""}{k}（{+(q.marks / (q.keywords ?? []).length).toFixed(1)}）</span>
                  ))}
                </div>
              )}
              {q.explanation && (
                <div style={{ ...base, color: SUBTLE, fontSize: "13pt", whiteSpace: "pre-wrap" }}>{q.explanation}</div>
              )}
              {q.type === "mcq" && (q.optionNotes?.length ?? 0) > 0 && (
                <div style={{ ...base, color: SUBTLE, fontSize: "13pt", marginTop: "2px" }}>
                  {q.options.map((o, j) => q.optionNotes?.[j] ? (
                    <div key={j} style={base}>{letters[j]}. {q.optionNotes[j]}</div>
                  ) : null)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
