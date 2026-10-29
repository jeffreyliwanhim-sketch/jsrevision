export type NoteSection = { heading: string; points: string[] };

export function Notes({ sections }: { sections: NoteSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((s, i) => (
        <section key={i}>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
              {i + 1}
            </span>
            {s.heading}
          </h3>
          <ul className="mt-2.5 space-y-1.5 pl-8">
            {(s.points ?? []).map((p, j) => (
              <li key={j} className="list-disc text-sm leading-relaxed text-foreground/90">
                {p}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
