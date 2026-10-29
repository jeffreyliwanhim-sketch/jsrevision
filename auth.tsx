import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Ctx = createContext<{ session: Session | null; ready: boolean }>({ session: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") qc.invalidateQueries();
    });
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [router, qc]);

  return <Ctx.Provider value={{ session, ready }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
