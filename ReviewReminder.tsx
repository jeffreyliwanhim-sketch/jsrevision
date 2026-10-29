import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { materialsQuery, reviewState } from "@/lib/materials";

/** Shows an automatic reminder once per browser session when materials need review. */
export function ReviewReminder() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data } = useQuery(materialsQuery);
  useEffect(() => {
    if (!data || sessionStorage.getItem("jsr-review-reminded")) return;
    const now = data.filter((m) => reviewState(m) === "now").length;
    const overdue = data.filter((m) => reviewState(m) === "overdue").length;
    if (!now && !overdue) return;
    sessionStorage.setItem("jsr-review-reminded", "1");
    toast.warning(t("reviewToastTitle"), {
      description: [now && `${now} ${t("reviewNowCount")}`, overdue && `${overdue} ${t("reviewOverdueCount")}`].filter(Boolean).join(" · "),
      duration: 10000,
      action: { label: t("reviewGo"), onClick: () => navigate({ to: "/materials" }) },
    });
  }, [data, t, navigate]);
  return null;
}
