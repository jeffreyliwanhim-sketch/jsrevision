import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n, type TKey } from "@/lib/i18n";
import { materialsQuery, SUBJECT_KEYS } from "@/lib/materials";

export function SubjectSidebar() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { data: materials = [] } = useQuery({ ...materialsQuery, enabled: open });
  const subjects = SUBJECT_KEYS.filter((s) => materials.some((m) => m.subject === s));
  const close = () => setOpen(false);

  return (
    <>
      <button aria-label={t("menu")} onClick={() => setOpen(true)}
        className="-ml-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
        <Menu className="size-5" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-0">
          <SheetHeader className="border-b p-5">
            <SheetTitle>{t("bySubject")}</SheetTitle>
          </SheetHeader>
          <nav className="p-3">
            <Link to="/materials" search={{}} onClick={close}
              className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary">
              {t("all")} <span className="text-muted-foreground">({materials.length})</span>
            </Link>
            {materials.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">{t("noMaterials")}</p>}
            {subjects.map((s) => {
              const items = materials.filter((m) => m.subject === s);
              return (
                <div key={s} className="mt-2">
                  <Link to="/materials" search={{ subject: s }} onClick={close}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary">
                    {t(`subj_${s}` as TKey)}
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </Link>
                  <ul className="ml-3 border-l pl-2">
                    {items.map((m) => (
                      <li key={m.id}>
                        <Link to="/materials/$id" params={{ id: m.id }} onClick={close}
                          className="block truncate rounded-lg px-2 py-1 text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground">
                          {m.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
