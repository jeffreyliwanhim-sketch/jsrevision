import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const Ctx = createContext<{ zen: boolean; setZen: (v: boolean) => void }>({ zen: false, setZen: () => {} });

export function ZenProvider({ children }: { children: ReactNode }) {
  const [zen, setZen] = useState(false);
  useEffect(() => {
    document.documentElement.toggleAttribute("data-zen", zen);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zen]);
  return (
    <Ctx.Provider value={{ zen, setZen }}>
      {children}
      {zen && <ZenBar onExit={() => setZen(false)} />}
    </Ctx.Provider>
  );
}

export const useZen = () => useContext(Ctx);

const FOCUS = 25 * 60;

function ZenBar({ onExit }: { onExit: () => void }) {
  const { t } = useI18n();
  const [left, setLeft] = useState(FOCUS);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((s) => (s <= 1 ? (setRunning(false), 0) : s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const btn = "flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary";
  return (
    <div className="glass fade-up fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border py-1.5 pl-5 pr-1.5 shadow-lift">
      <span className="w-16 font-mono text-lg tabular-nums">{mm}:{ss}</span>
      <button className={btn} onClick={() => setRunning(!running)} aria-label={running ? t("pause") : t("start")}>
        {running ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <button className={btn} onClick={() => { setRunning(false); setLeft(FOCUS); }} aria-label={t("reset")}>
        <RotateCcw className="size-4" />
      </button>
      <button className={`${btn} bg-foreground text-background hover:bg-foreground/85`} onClick={onExit} aria-label={t("exitZen")}>
        <X className="size-4" />
      </button>
    </div>
  );
}
