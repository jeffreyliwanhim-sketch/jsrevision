import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type TKey } from "@/lib/i18n";
import { STATUSES, STATUS_CLS, type Status } from "@/lib/materials";
import { cn } from "@/lib/utils";

export function StatusPicker({ id, status, compact }: { id: string; status: string; compact?: boolean }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  async function set(s: Status, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await supabase.from("materials").update({ status: s, status_updated_at: new Date().toISOString(), last_reviewed_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["materials"] });
    qc.invalidateQueries({ queryKey: ["material", id] });
  }
  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((s) => (
        <button
          key={s}
          onClick={(e) => set(s, e)}
          className={cn(
            "rounded-full font-medium transition-all",
            compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
            status === s ? STATUS_CLS[s] : "bg-secondary text-muted-foreground opacity-60 hover:opacity-100",
          )}
        >
          {t(`st_${s}` as TKey)}
        </button>
      ))}
    </div>
  );
}
