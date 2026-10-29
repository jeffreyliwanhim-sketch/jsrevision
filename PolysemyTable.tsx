import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Entry = { char: string; senses: { pos: string; meaning: string; example: string; source: string }[] };

export function PolysemyTable({ entries }: { entries: Entry[] }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [q, setQ] = useState("");
  const [hide, setHide] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const list = entries.map((e, i) => ({ e, i })).filter(({ e }) => !q || e.char.includes(q) || e.senses.some((s) => s.example.includes(q)));
  const cur = entries[active];

  function highlight(text: string, ch: string) {
    if (!ch) return text;
    return text.split(ch).flatMap((part, i, arr) =>
      i < arr.length - 1 ? [part, <mark key={i} className="rounded bg-primary/15 px-0.5 font-semibold text-primary">{ch}</mark>] : [part],
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <div>
        <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} className="mb-3 rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {list.map(({ e, i }) => (
            <button key={i} onClick={() => { setActive(i); setRevealed(new Set()); }}
              className={cn("flex size-12 items-center justify-center rounded-2xl text-xl transition-all",
                active === i ? "bg-foreground text-background" : "bg-secondary hover:bg-accent")}>
              {e.char}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" className="size-4 accent-primary" checked={hide} onChange={(e) => { setHide(e.target.checked); setRevealed(new Set()); }} />
          {t("hideMeaning")}
        </label>
      </div>
      {cur && (
        <div key={active} className="fade-up overflow-hidden rounded-2xl border">
          <div className="flex items-baseline gap-3 bg-secondary/70 px-5 py-3">
            <span className="text-4xl font-semibold">{cur.char}</span>
            <span className="text-sm text-muted-foreground">{cur.senses.length} {t("meaning")}</span>
          </div>
          <table className="w-full text-[15px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="w-16 px-4 py-2 font-medium">{t("pos")}</th>
                <th className="px-4 py-2 font-medium">{t("example")}</th>
                <th className="w-2/5 px-4 py-2 font-medium">{t("meaning")}</th>
              </tr>
            </thead>
            <tbody>
              {cur.senses.map((s, i) => {
                const hidden = hide && !revealed.has(i);
                return (
                  <tr key={i} className="border-t align-top">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.pos}</td>
                    <td className="px-4 py-3 leading-relaxed">
                      {highlight(s.example, cur.char)}
                      {s.source && <span className="block text-xs text-muted-foreground">《{s.source.replace(/[《》]/g, "")}》</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button disabled={!hidden} onClick={() => setRevealed(new Set(revealed).add(i))} className="text-left">
                        <span className={cn("transition-all", hidden && "select-none blur-sm")}>{s.meaning}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
