import { authRouteWithNext } from "@/lib/auth-routing";
import { resolveAuthAccess } from "@/lib/access-control";
import { supabaseConfig } from "@/lib/supabase";
import { APP_ROUTES } from "@/routes";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

function AuthStatus({ title, description, error }: { title: string; description: string; error?: boolean }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#10110f] px-5 text-[#f5f4ed]">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 text-center backdrop-blur-xl">
        {error ? <AlertTriangle className="mx-auto size-6 text-[#da8c6f]" /> : <LoaderCircle className="mx-auto size-6 animate-spin text-[#bad59a]" />}
        <h1 className="font-display mt-5 text-4xl tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
      </section>
    </main>
  );
}

export default function AuthGate({ children, allowGuest = false }: { children: ReactNode; allowGuest?: boolean }) {
  const { user, loading, configured } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const access = resolveAuthAccess({ configured, loading, authenticated: Boolean(user), allowGuest });
  const shouldRedirect = access === "redirect";

  useEffect(() => {
    if (!shouldRedirect) return;
    const currentLocation = `${window.location.pathname}${window.location.search}`;
    navigate(authRouteWithNext(APP_ROUTES.login, currentLocation), { replace: true });
  }, [navigate, shouldRedirect]);

  if (access === "configuration") {
    const missing = supabaseConfig.configured ? [] : supabaseConfig.missing;
    return <AuthStatus error title="Supabase needs a key." description={`Add the missing ${missing.join(" and ")} environment value${missing.length === 1 ? "" : "s"} before using authentication.`} />;
  }

  if (access === "loading") {
    return <AuthStatus title="Opening your kitchen." description="Checking your secure Supabase session." />;
  }

  if (shouldRedirect) return <AuthStatus title="Opening your kitchen." description="Taking you to sign in." />;

  return <>{children}</>;
}
