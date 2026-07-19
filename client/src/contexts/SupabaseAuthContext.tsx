import { supabase, supabaseConfig } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type SupabaseAuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured: supabaseConfig.configured,
    }),
    [loading, session],
  );

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider");
  }
  return context;
}
