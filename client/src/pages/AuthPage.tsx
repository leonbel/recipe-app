import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { authCallbackUrl, authRouteWithNext, resolveAuthNextPath } from "@/lib/auth-routing";
import { supabase, supabaseConfig } from "@/lib/supabase";
import { APP_ROUTES } from "@/routes";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Globe2, LoaderCircle, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type AuthMode = "login" | "signup";

type Notice =
  | { tone: "error"; text: string }
  | { tone: "success"; text: string }
  | null;

function getNextPath() {
  return resolveAuthNextPath(new URLSearchParams(window.location.search).get("next"));
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, loading: sessionLoading } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const nextPath = useMemo(getNextPath, []);
  const isSignUp = mode === "signup";
  const alternateRoute = isSignUp ? APP_ROUTES.login : APP_ROUTES.signup;

  useEffect(() => {
    if (!sessionLoading && user) {
      navigate(nextPath, { replace: true });
    }
  }, [navigate, nextPath, sessionLoading, user]);

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!supabase) {
      setNotice({ tone: "error", text: "Supabase is not configured in this environment." });
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setNotice({ tone: "error", text: "The password confirmation does not match." });
      return;
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: authCallbackUrl(window.location.origin, nextPath),
          },
        });
        if (error) throw error;

        if (data.session) {
          navigate(nextPath, { replace: true });
          return;
        }

        setNotice({
          tone: "success",
          text: "Check your inbox to confirm your email, then return here to sign in.",
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          navigate(nextPath, { replace: true });
          return;
        }
        setNotice({ tone: "error", text: "We could not establish a session. Please try again." });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setNotice({ tone: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setNotice(null);
    if (!supabase) {
      setNotice({ tone: "error", text: "Supabase is not configured in this environment." });
      return;
    }

    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl(window.location.origin, nextPath),
      },
    });

    if (error) {
      setGoogleLoading(false);
      setNotice({ tone: "error", text: error.message });
    }
  }

  const activeSubmit = submitting || googleLoading;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#10110f] px-5 py-5 text-[#f5f4ed] sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-3 scale-105 bg-cover bg-center opacity-[0.15] saturate-[0.78] blur-[1px]" style={{ backgroundImage: 'url("/manus-storage/mise-auth-food-background_91303d43.jpg")' }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(16,17,15,0.92)_0%,rgba(16,17,15,0.82)_48%,rgba(16,17,15,0.68)_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_85%_0%,rgba(186,213,154,0.2),transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href={APP_ROUTES.capture} className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 font-display text-xl tracking-tight">
            <span className="grid size-7 place-items-center rounded-full bg-[#bad59a] text-[#10110f]"><Sparkles className="size-3.5" /></span>
            mise
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_0.92fr] lg:gap-18 lg:py-14">
          <section className="max-w-xl lg:pr-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">Your recipe companion</p>
            <h1 className="font-display mt-5 text-5xl leading-[0.92] tracking-[-0.05em] sm:text-6xl">
              {isSignUp ? "Make more from less." : "Good food starts here."}
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/55">
              {isSignUp
                ? "Create your personal kitchen to get recipes tailored to the ingredients you already have."
                : "Sign in to pick up where you left off and turn what is in the fridge into dinner."}
            </p>
            <div className="mt-10 hidden items-center gap-3 text-sm text-white/45 lg:flex">
              <span className="grid size-7 place-items-center rounded-full bg-[#bad59a]/15 text-[#bad59a]"><CheckCircle2 className="size-4" /></span>
              <span>Private, account-scoped recipe history through Supabase.</span>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.055))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-3xl sm:p-7">
            <div className="mb-7 flex items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/38">{isSignUp ? "Create account" : "Welcome back"}</p>
                <h2 className="font-display mt-2 text-3xl tracking-tight">{isSignUp ? "Set your table." : "Let’s cook."}</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">Secure auth</span>
            </div>

            {!supabaseConfig.configured ? (
              <div className="rounded-2xl border border-[#da8c6f]/30 bg-[#da8c6f]/10 p-4 text-sm leading-6 text-[#f4c1ad]">
                Supabase is not configured in this environment. Add the project URL and anon key to activate sign-in.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <button disabled={activeSubmit} type="button" onClick={handleGoogleAuth} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f5f4ed] px-5 text-sm font-semibold text-[#10110f] transition duration-150 hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55">
                    {googleLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Globe2 className="size-4" />}
                    Continue with Google
                  </button>
                  <p className="text-center text-xs leading-5 text-white/42">The quickest way to save your kitchen and recipe history.</p>
                </div>

                {notice && (
                  <div className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 ${notice.tone === "error" ? "border-[#da8c6f]/35 bg-[#da8c6f]/10 text-[#f4c1ad]" : "border-[#bad59a]/30 bg-[#bad59a]/10 text-[#d6efc0]"}`} role="status">
                    {notice.text}
                  </div>
                )}

                <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-white/28"><span className="h-px flex-1 bg-white/10" />or use email<span className="h-px flex-1 bg-white/10" /></div>

                <form onSubmit={handleEmailAuth} className="space-y-4" noValidate>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/75">Email</span>
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-xl border border-white/16 bg-black/25 px-4 text-[15px] text-white outline-none transition placeholder:text-white/25 focus:border-[#bad59a] focus:ring-2 focus:ring-[#bad59a]/20"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/75">Password</span>
                    <span className="relative block">
                      <input
                        required
                        minLength={isSignUp ? 8 : undefined}
                        type={passwordVisible ? "text" : "password"}
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={isSignUp ? "At least 8 characters" : "Your password"}
                        className="h-12 w-full rounded-xl border border-white/16 bg-black/25 px-4 pr-12 text-[15px] text-white outline-none transition placeholder:text-white/25 focus:border-[#bad59a] focus:ring-2 focus:ring-[#bad59a]/20"
                      />
                      <button type="button" aria-label={passwordVisible ? "Hide password" : "Show password"} onClick={() => setPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-white/40 transition hover:text-white">
                        {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </span>
                  </label>
                  {isSignUp && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-white/75">Confirm password</span>
                      <input
                        required
                        minLength={8}
                        type={passwordVisible ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repeat your password"
                        className="h-12 w-full rounded-xl border border-white/16 bg-black/25 px-4 text-[15px] text-white outline-none transition placeholder:text-white/25 focus:border-[#bad59a] focus:ring-2 focus:ring-[#bad59a]/20"
                      />
                    </label>
                  )}

                  <button disabled={activeSubmit} type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/[0.045] px-5 text-sm font-semibold text-white transition duration-150 hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55">
                    {submitting && <LoaderCircle className="size-4 animate-spin" />}
                    {isSignUp ? "Create account with email" : "Sign in with email"}
                  </button>
                </form>
              </>
            )}

            <p className="mt-7 text-center text-sm text-white/47">
              {isSignUp ? "Already have an account?" : "New to mise?"}{" "}
              <Link href={authRouteWithNext(alternateRoute, nextPath)} className="font-semibold text-[#bad59a] transition hover:text-[#d6efc0]">
                {isSignUp ? "Sign in" : "Create one"}
              </Link>
            </p>
            <Link href={APP_ROUTES.capture} className="mt-4 block text-center text-sm text-white/46 underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-white/60">
              Skip for now
            </Link>
            <p className="mt-2 text-center text-xs leading-5 text-white/30">You can explore recipes as a guest. Sign in later to save your history.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
