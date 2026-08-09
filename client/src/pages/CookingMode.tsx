import MealCompletionSheet from "@/components/MealCompletionSheet";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { formatTimer } from "@/lib/recipeExperience";
import { isPublicDesignReviewPreview } from "@/lib/recipePresentation";
import { resolveRecipeForRoute } from "@/lib/recipeSelection";
import { trpc } from "@/lib/trpc";
import { saveMealOnVercel, shouldUseVercelMealsEndpoint } from "@/lib/vercelMeals";
import { APP_ROUTES, recipeDetailPath } from "@/routes";
import { ArrowLeft, ArrowRight, Check, ChefHat, Clock3, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type CookingModeProps = { recipeId: string };

export default function CookingMode({ recipeId }: CookingModeProps) {
  const reviewMode = isPublicDesignReviewPreview(window.location.search);
  const reviewParams = new URLSearchParams(window.location.search);
  const requestedReviewStep = reviewMode ? Number(reviewParams.get("step")) - 1 : 0;
  const showCompletionPreview = reviewMode && reviewParams.get("complete") === "1";
  const recipe = useMemo(() => resolveRecipeForRoute(recipeId, reviewMode), [recipeId, reviewMode]);
  const { user } = useSupabaseAuth();
  const initialStep = Number.isFinite(requestedReviewStep) && requestedReviewStep >= 0 ? requestedReviewStep : 0;
  const [activeStep, setActiveStep] = useState(initialStep);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(showCompletionPreview);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const utils = trpc.useUtils();
  const saveMeal = trpc.meals.create.useMutation();

  const steps = recipe?.steps.slice().sort((a, b) => a.order - b.order) ?? [];
  const step = steps[activeStep];

  useEffect(() => {
    const nextStep = Math.min(Math.max(initialStep, 0), Math.max(steps.length - 1, 0));
    setActiveStep(nextStep);
    setTimerRunning(false);
    setTimerRemaining(steps[nextStep]?.timer_seconds ?? 0);
    setCompletionOpen(showCompletionPreview);
  }, [recipeId, initialStep, showCompletionPreview]);

  useEffect(() => {
    if (!timerRunning || timerRemaining <= 0) return;
    const interval = window.setInterval(() => setTimerRemaining((value) => Math.max(0, value - 1)), 1_000);
    return () => window.clearInterval(interval);
  }, [timerRunning, timerRemaining]);

  useEffect(() => {
    if (timerRemaining === 0) setTimerRunning(false);
  }, [timerRemaining]);

  function moveToStep(nextStep: number) {
    const bounded = Math.max(0, Math.min(steps.length - 1, nextStep));
    setActiveStep(bounded);
    setTimerRunning(false);
    setTimerRemaining(steps[bounded]?.timer_seconds ?? 0);
  }

  if (!recipe || !step) {
    return <main className="grid min-h-screen place-items-center bg-[#10110f] px-5 text-[#f5f4ed]"><section className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center"><ChefHat className="mx-auto size-7 text-[#bad59a]" /><h1 className="font-display mt-5 text-4xl">Pick a recipe first.</h1><Link href={APP_ROUTES.results} className="mt-6 inline-flex rounded-full bg-[#f5f4ed] px-5 py-3 text-sm font-semibold text-[#10110f]">Back to recipes</Link></section></main>;
  }

  const atLastStep = activeStep === steps.length - 1;
  const querySuffix = reviewMode ? "?review=design" : "";

  return (
    <main className="min-h-screen overflow-hidden bg-[#10110f] px-4 py-4 text-[#f5f4ed] sm:px-7 sm:py-7">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_88%_6%,rgba(186,213,154,0.13),transparent_27%),radial-gradient(circle_at_7%_82%,rgba(218,140,111,0.12),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl sm:min-h-[calc(100vh-3.5rem)] sm:p-8">
        <header className="flex items-center justify-between gap-4"><Link href={`${recipeDetailPath(recipeId)}${querySuffix}`} className="inline-flex items-center gap-2 text-sm text-white/58 transition hover:text-white"><ArrowLeft className="size-4" />Recipe</Link><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#bad59a]">Cooking mode</p><p className="font-display mt-1 text-xl tracking-tight">mise</p></div><div className="w-16 text-right text-xs font-semibold text-white/45">{activeStep + 1} / {steps.length}</div></header>

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-[#bad59a] transition-[width] duration-300" style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }} /></div>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-10 text-center sm:py-14">
          <span className="mx-auto grid size-12 place-items-center rounded-full border border-[#bad59a]/30 bg-[#bad59a]/10 text-sm font-semibold text-[#bad59a]">{step.order}</span>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-white/42">Step {step.order} of {steps.length}</p>
          <h1 className="font-display mx-auto mt-5 max-w-3xl text-[clamp(2.7rem,7vw,5.75rem)] leading-[0.95] tracking-[-0.06em]">{step.instruction}</h1>

          {step.timer_seconds ? <section className="mx-auto mt-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-black/20 p-6"><div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#bad59a]"><Clock3 className="size-4" />Step timer</div><p className="font-display mt-4 text-7xl tracking-[-0.06em]">{formatTimer(timerRemaining)}</p><div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => setTimerRunning((running) => !running)} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f5f4ed] px-5 text-sm font-semibold text-[#10110f] transition active:scale-[0.97]">{timerRunning ? <Pause className="size-4" /> : <Play className="size-4" />}{timerRunning ? "Pause" : timerRemaining === 0 ? "Done" : "Start"}</button><button type="button" onClick={() => { setTimerRunning(false); setTimerRemaining(step.timer_seconds ?? 0); }} className="grid size-11 place-items-center rounded-full border border-white/14 text-white/65 transition hover:bg-white/10" aria-label="Reset timer"><RotateCcw className="size-4" /></button></div></section> : <p className="mt-9 text-sm text-white/45">No timer on this step — take the pace that feels right.</p>}
        </section>

        <footer className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3"><button type="button" disabled={activeStep === 0} onClick={() => moveToStep(activeStep - 1)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/12 text-sm font-semibold text-white/65 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-30"><ArrowLeft className="size-4" />Previous</button><div className="order-last flex items-center justify-center gap-1.5 sm:order-none">{steps.map((item, index) => <button type="button" key={item.order} aria-label={`Go to step ${item.order}`} onClick={() => moveToStep(index)} className={`size-2.5 rounded-full transition ${index === activeStep ? "scale-125 bg-[#bad59a]" : "bg-white/20 hover:bg-white/50"}`} />)}</div>{atLastStep ? <button type="button" onClick={() => setCompletionOpen(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#bad59a] text-sm font-semibold text-[#10110f] transition active:scale-[0.97]">Finish cooking <Check className="size-4" /></button> : <button type="button" onClick={() => moveToStep(activeStep + 1)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f5f4ed] text-sm font-semibold text-[#10110f] transition active:scale-[0.97]">Next step <ArrowRight className="size-4" /></button>}</footer>
      </div>

      <MealCompletionSheet open={completionOpen} recipe={recipe} signedIn={Boolean(user)} saving={saving} onClose={() => setCompletionOpen(false)} onSave={async (rating, notes) => {
        if (!user) return;
        setSaving(true);
        try {
          const input = { recipe, servings: recipe.base_servings, rating, notes };
          if (shouldUseVercelMealsEndpoint()) {
            await saveMealOnVercel(input);
          } else {
            await saveMeal.mutateAsync(input);
            await utils.meals.list.invalidate();
          }
          setSaved(true);
          setCompletionOpen(false);
          toast.success("Saved to your account meal history.");
        } catch (error) {
          const message = error instanceof Error ? error.message : "We could not save that meal right now.";
          toast.error(message);
        } finally {
          setSaving(false);
        }
      }} />
      {saved && <Link href={APP_ROUTES.history} className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-[#bad59a]/35 bg-[#1b1c19] px-4 py-3 text-sm font-semibold text-[#bad59a] shadow-xl"><Sparkles className="size-4" />View history</Link>}
    </main>
  );
}
