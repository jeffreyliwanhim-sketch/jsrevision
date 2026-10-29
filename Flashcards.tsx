import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Card = { front: string; back: string };

export function Flashcards({ cards: initial, onReview }: { cards: Card[]; onReview?: () => void }) {
  const { t } = useI18n();
  const [cards, setCards] = useState(initial);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const reviewed = useRef(false);
  const card = cards[i];
  if (!card) return null;
  const touch = () => {
    if (!reviewed.current) { reviewed.current = true; onReview?.(); }
  };
  const flip = () => { setFlipped(!flipped); touch(); };
  const go = (d: number) => { setFlipped(false); setI((i + d + cards.length) % cards.length); touch(); };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 flex w-full items-center justify-between text-sm text-muted-foreground">
        <span>{i + 1} / {cards.length}</span>
        <span>{t("known")}: {known.size}</span>
      </div>
      <button onClick={flip} className="w-full [perspective:1200px]" aria-label={t("flip")}>
        <div className={cn("relative aspect-[3/2] w-full transition-transform duration-500 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}>
          <div className="surface absolute inset-0 flex items-center justify-center p-8 text-center text-2xl font-semibold [backface-visibility:hidden]">
            {card.front}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-[calc(var(--radius)+8px)] bg-foreground p-8 text-center text-lg leading-relaxed text-background [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="whitespace-pre-wrap">{card.back}</span>
          </div>
        </div>
      </button>
      <p className="mt-3 text-xs text-muted-foreground">{t("flip")}</p>
      <div className="mt-4 flex items-center gap-2">
        <Button size="icon" variant="secondary" onClick={() => go(-1)} aria-label={t("prev")}><ChevronLeft /></Button>
        <Button variant={known.has(i) ? "default" : "outline"} onClick={() => {
          const k = new Set(known); if (k.has(i)) k.delete(i); else k.add(i); setKnown(k); touch();
        }}>{t("known")}</Button>
        <Button size="icon" variant="secondary" onClick={() => go(1)} aria-label={t("next")}><ChevronRight /></Button>
        <Button size="icon" variant="ghost" aria-label={t("shuffle")} onClick={() => {
          setCards([...cards].sort(() => Math.random() - 0.5)); setI(0); setFlipped(false); setKnown(new Set());
        }}><Shuffle /></Button>
      </div>
    </div>
  );
}
