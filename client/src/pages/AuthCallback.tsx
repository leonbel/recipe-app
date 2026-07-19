import { authRouteWithNext, resolveAuthNextPath } from "@/lib/auth-routing";
import { supabase } from "@/lib/supabase";
import { APP_ROUTES } from "@/routes";
import { AlertTriangle, ArrowRight, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function finishAuthentication() {
      if (!supabase) {
        if (active) setErrorMessage("Supabase is not configured in this environment.");
        return;
      }

      const parameters = new URLSearchParams(window.location.search);
      const providerError = parameters.get("error_description") ?? parameters.get("error");
      if (providerError) {
        if (active) setErrorMessage(providerError);
        return;
      }

      const code = parameters.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setErrorMessage(error.message);
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        if (active) setErrorMessage(error?.message ?? "Your sign-in session could not be completed.");
        return;
      }

      navigate(resolveAuthNextPath(parameters.get("next")), { replace: true });
    }

    void finishAuthentication();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#10110f] px-5 text-[#f5f4ed]">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center backdrop-blur-xl">
        {errorMessage ? <AlertTriangle className="mx-auto size-6 text-[#da8c6f]" /> : <LoaderCircle className="mx-auto size-6 animate-spin text-[#bad59a]" />}
        <h1 className="font-display mt-5 text-4xl tracking-tight">{errorMessage ? "Sign-in paused." : "Opening your kitchen."}</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">{errorMessage ?? "Securely completing your Supabase session."}</p>
        {errorMessage && (
          <Link href={authRouteWithNext(APP_ROUTES.login, APP_ROUTES.capture)} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f5f4ed] px-5 py-3 text-sm font-semibold text-[#10110f] transition active:scale-[0.97]">
            Return to sign in <ArrowRight className="size-4" />
          </Link>
        )}
      </section>
    </main>
  );
}
