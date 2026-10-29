import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Focus, Globe } from "lucide-react";
import { useZen } from "@/lib/zen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SubjectSidebar } from "@/components/SubjectSidebar";
import { LANGS, useI18n, type Lang } from "@/lib/i18n";

export function AppNav() {
  const { session } = useAuth();
  const { t, lang, setLang } = useI18n();
  const qc = useQueryClient();
  const { setZen } = useZen();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls = "text-sm text-muted-foreground transition-colors hover:text-foreground";
  const activeCls = { className: "text-sm text-foreground font-medium" };

  return (
    <header className="glass zen-hide sticky top-0 z-40 border-b">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-5 sm:gap-6">
        {session && <SubjectSidebar />}
        <Link to="/" className="text-[15px] font-semibold tracking-tight">
          JSR<span className="hidden font-normal text-muted-foreground sm:inline">evision</span>
        </Link>
        {session && (
          <div className="flex items-center gap-5">
            <Link to="/calendar" className={linkCls} activeProps={activeCls}>{t("calendar")}</Link>
            <Link to="/materials" className={linkCls} activeProps={activeCls}>{t("materials")}</Link>
            <Link to="/practice" className={linkCls} activeProps={activeCls}>{t("practice")}</Link>
          </div>
        )}
        <div className="ml-auto flex items-center gap-4">
          {session && (
            <button onClick={() => setZen(true)} className={`${linkCls} flex items-center gap-1.5`}>
              <Focus className="size-4" />{t("zen")}
            </button>
          )}
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Globe className="size-4" />
            <select
              aria-label={t("language")}
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="cursor-pointer bg-transparent outline-none"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
          {session ? (
            <button onClick={signOut} className={linkCls}>{t("signOut")}</button>
          ) : (
            <Link to="/auth" className={linkCls}>{t("signIn")}</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
