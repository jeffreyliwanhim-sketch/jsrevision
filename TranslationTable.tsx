import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Row = { original: string; translation: string; pattern: string; note: string };

export function TranslationTable({ rows }: { rows: Row[] }) {
  const { t } = useI18n();
  const [hide, setHide] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [pattern, setPattern] = useState("");
  const patterns = Array.from(new Set(rows.map((r) => r.pattern).filter(Boolean)));
  const shown = rows.map((r, i) => ({ r, i })).filter(({ r }) => !pattern || r.pattern === pattern);
  const chip = (a: boolean) => cn("rounded-full px-3 py-1 text-xs transition-all", a ? "bg-foreground text-background" : "bg-secondary text-muted-foreground");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className={chip(!pattern)} onClick={() => setPattern("")}>{t("allPatterns")}</button>
        {patterns.map((p) => <button key={p} className={chip(pattern === p)} onClick={() => setPattern(p)}>{p}</button>)}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" className="size-4 accent-primary" checked={hide} onChange={(e) => { setHide(e.target.checked); setRevealed(new Set()); }} />
          {t("hideTranslation")}
        </label>
      </div>
      <div className="overflow-hidden rounded-2xl border">
        <div className="grid grid-cols-2 bg-secondary/70 text-xs font-medium text-muted-foreground">
          <div className="px-4 py-2.5">{t("original")}</div>
          <div className="border-l px-4 py-2.5">{t("vernacular")}</div>
        </div>
        {shown.map(({ r, i }) => {
          const hidden = hide && !revealed.has(i);
          return (
            <div key={i} className="grid grid-cols-2 border-t text-[15px] leading-relaxed">
              <div className="px-4 py-3">
                <p className="font-medium">{r.original}</p>
                {r.pattern && <span className="mt-1.5 inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] text-accent-foreground">{r.pattern}</span>}
              </div>
              <button
                disabled={!hidden}
                onClick={() => setRevealed(new Set(revealed).add(i))}
                className={cn("border-l px-4 py-3 text-left", hidden && "cursor-pointer")}
              >
                <p className={cn("transition-all", hidden && "select-none blur-sm")}>{r.translation}</p>
                {r.note && !hidden && <p className="mt-1 text-xs text-muted-foreground">{t("keyNote")}：{r.note}</p>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
