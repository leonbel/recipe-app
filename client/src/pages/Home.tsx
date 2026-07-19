import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import {
  addIngredient,
  findIngredientSuggestions,
  hasCaptureIngredients,
  HEALTH_GOALS,
  loadCapturePreferences,
  QUICK_ADD_INGREDIENTS,
  removeIngredient,
  saveCapturePreferences,
  selectTimeFilter,
  TIME_FILTERS,
  toggleHealthGoal,
  type HealthGoalId,
} from "@/lib/capture";
import { supabase } from "@/lib/supabase";
import { saveGeneratedRecipes } from "@/lib/generatedRecipes";
import { generateRecipesOnVercel, shouldUseVercelRecipeEndpoint } from "@/lib/vercelRecipes";
import { APP_ROUTES } from "@/routes";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, ChevronDown, Clock3, History, LoaderCircle, LogIn, LogOut, Plus, Sparkles, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { user } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [preferences, setPreferences] = useState(loadCapturePreferences);
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [isIngredientFocused, setIsIngredientFocused] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const generateRecipes = trpc.recipes.generate.useMutation();
  const suggestions = useMemo(
    () => findIngredientSuggestions(ingredientQuery, preferences.ingredients),
    [ingredientQuery, preferences.ingredients],
  );

  useEffect(() => {
    saveCapturePreferences(preferences);
  }, [preferences]);

  async function handleSignOut() {
    if (!supabase) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate(APP_ROUTES.login, { replace: true });
  }

  function selectIngredient(ingredient: string) {
    setPreferences((current) => ({ ...current, ingredients: addIngredient(current.ingredients, ingredient) }));
    setIngredientQuery("");
    setIsIngredientFocused(false);
    setSubmissionMessage("");
  }

  function handleIngredientKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (suggestions[0]) {
      selectIngredient(suggestions[0]);
      return;
    }
    if (ingredientQuery.trim()) selectIngredient(ingredientQuery);
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasCaptureIngredients(preferences)) {
      setSubmissionMessage("Add at least one ingredient to start your recipe search.");
      return;
    }
    setSubmissionMessage("");
    try {
      const request = {
        ingredients: preferences.ingredients,
        healthGoals: preferences.healthGoals,
        timeAvailable: preferences.timeAvailable,
      };
      const recipes = shouldUseVercelRecipeEndpoint()
        ? await generateRecipesOnVercel(request)
        : await generateRecipes.mutateAsync(request);
      saveGeneratedRecipes(recipes);
      navigate(APP_ROUTES.results);
    } catch (error) {
      setSubmissionMessage(error instanceof Error ? error.message : "We could not generate recipes. Please try again.");
    }
  }

  function handleGoalToggle(goal: HealthGoalId) {
    setPreferences((current) => ({ ...current, healthGoals: toggleHealthGoal(current.healthGoals, goal) }));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#10110f] text-[#f5f4ed]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_82%_4%,rgba(186,213,154,0.16),transparent_30%),radial-gradient(circle_at_8%_48%,rgba(218,140,111,0.08),transparent_25%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-10 pt-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#bad59a] text-[#10110f]"><Sparkles className="size-4" /></span>
            <span className="font-display text-xl tracking-tight">mise</span>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href={APP_ROUTES.history} className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white sm:inline-flex">
                <History className="size-3.5" /> History
              </Link>
              <button onClick={handleSignOut} disabled={signingOut} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-55">
                {signingOut ? <LoaderCircle className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                Sign out
              </button>
            </div>
          ) : (
            <Link href={APP_ROUTES.login} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white">
              <LogIn className="size-3.5" />
              Sign in to save
            </Link>
          )}
        </header>

        <section className="pt-12 sm:pt-16">
          <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-9 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">{user ? "Your kitchen" : "Guest kitchen"}</p>
              <h1 className="font-display mt-4 max-w-3xl text-[clamp(3.4rem,8vw,6.4rem)] leading-[0.86] tracking-[-0.06em]">What’s in your kitchen?</h1>
            </div>
            <p className="max-w-md text-base leading-7 text-white/55">Tell us what you have, how you want to eat, and how much time feels right. We’ll shape the next recipe ideas around you.</p>
          </div>

          <form onSubmit={handleSearch} className="grid gap-5 py-8 lg:grid-cols-[1.16fr_0.84fr] lg:gap-7">
            <section className="rounded-[2rem] border border-white/12 bg-white/[0.055] p-5 shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#bad59a]">01 / Ingredients</p>
                  <h2 className="font-display mt-2 text-3xl tracking-tight">Start with what’s close.</h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/45">{preferences.ingredients.length} selected</span>
              </div>

              <div className="relative mt-7">
                <label htmlFor="ingredient-input" className="sr-only">Add an ingredient</label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/14 bg-black/20 px-4 transition focus-within:border-[#bad59a] focus-within:ring-2 focus-within:ring-[#bad59a]/15">
                  <Plus className="size-4 shrink-0 text-[#bad59a]" />
                  <input
                    id="ingredient-input"
                    value={ingredientQuery}
                    onFocus={() => setIsIngredientFocused(true)}
                    onChange={(event) => setIngredientQuery(event.target.value)}
                    onKeyDown={handleIngredientKeyDown}
                    placeholder="Try eggs, tomatoes, chicken…"
                    className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/28"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="ingredient-suggestions"
                    aria-expanded={isIngredientFocused && suggestions.length > 0}
                  />
                  <span className="hidden text-xs text-white/30 sm:inline">Press Enter</span>
                </div>
                {isIngredientFocused && suggestions.length > 0 && (
                  <div id="ingredient-suggestions" role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/12 bg-[#242520]/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    {suggestions.map((ingredient) => (
                      <button key={ingredient} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => selectIngredient(ingredient)} className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm text-white/78 transition hover:bg-white/10 hover:text-white">
                        <span>{ingredient}</span><Plus className="size-4 text-[#bad59a]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 min-h-10" aria-live="polite">
                {preferences.ingredients.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {preferences.ingredients.map((ingredient) => (
                      <span key={ingredient} className="inline-flex items-center gap-2 rounded-full border border-[#bad59a]/25 bg-[#bad59a]/10 px-3 py-2 text-sm text-[#d8edbf]">
                        {ingredient}
                        <button type="button" onClick={() => setPreferences((current) => ({ ...current, ingredients: removeIngredient(current.ingredients, ingredient) }))} aria-label={`Remove ${ingredient}`} className="rounded-full text-[#bad59a] transition hover:text-white"><X className="size-3.5" /></button>
                      </span>
                    ))}
                  </div>
                ) : <p className="pt-1 text-sm text-white/38">Select from suggestions or type anything you have on hand.</p>}
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-white/75">Quick add</p>
                  <p className="text-xs text-white/35">Common staples</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_ADD_INGREDIENTS.map((ingredient) => {
                    const selected = preferences.ingredients.some((item) => item.toLocaleLowerCase() === ingredient.toLocaleLowerCase());
                    return (
                      <button key={ingredient} type="button" disabled={selected} onClick={() => selectIngredient(ingredient)} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.035] px-3 py-2 text-sm text-white/65 transition hover:border-[#bad59a]/40 hover:bg-[#bad59a]/10 hover:text-[#d8edbf] disabled:cursor-default disabled:border-[#bad59a]/20 disabled:bg-[#bad59a]/10 disabled:text-[#bad59a]">
                        {selected ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}{ingredient}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="flex flex-col rounded-[2rem] border border-white/12 bg-[#181916]/90 p-5 shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#bad59a]">02 / Preferences</p>
                <h2 className="font-display mt-2 text-3xl tracking-tight">Make it fit today.</h2>
              </div>

              <fieldset className="mt-7">
                <legend className="text-sm font-medium text-white/75">Health focus</legend>
                <div className="mt-3 grid gap-2">
                  {HEALTH_GOALS.map((goal) => {
                    const selected = preferences.healthGoals.includes(goal.id);
                    return (
                      <button key={goal.id} type="button" onClick={() => handleGoalToggle(goal.id)} aria-pressed={selected} className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${selected ? "border-[#bad59a]/40 bg-[#bad59a]/10" : "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"}`}>
                        <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${selected ? "border-[#bad59a] bg-[#bad59a] text-[#10110f]" : "border-white/25"}`}>{selected && <Check className="size-3" />}</span>
                        <span className="min-w-0"><span className="block text-sm font-medium text-white/82">{goal.label}</span><span className="mt-0.5 block text-xs text-white/38">{goal.description}</span></span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-7 border-t border-white/10 pt-6">
                <legend className="flex items-center gap-2 text-sm font-medium text-white/75"><Clock3 className="size-4 text-[#bad59a]" /> Time to cook</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {TIME_FILTERS.map((option) => {
                    const selected = preferences.timeAvailable === option.value;
                    return (
                      <button key={option.value} type="button" onClick={() => setPreferences((current) => selectTimeFilter(current, option.value))} aria-pressed={selected} className={`rounded-2xl border px-3 py-3 text-left transition ${selected ? "border-[#bad59a]/40 bg-[#bad59a]/10" : "border-white/10 bg-white/[0.025] hover:bg-white/[0.06]"}`}>
                        <span className="block text-sm font-semibold text-white/82">{option.label}</span><span className="mt-0.5 block text-xs text-white/38">{option.detail}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-auto pt-8">
                {submissionMessage && <p role="status" className="mb-3 text-sm leading-6 text-[#f4c1ad]">{submissionMessage}</p>}
                <button disabled={generateRecipes.isPending || !hasCaptureIngredients(preferences)} type="submit" className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#bad59a] px-5 text-sm font-semibold text-[#10110f] transition hover:bg-[#d5ecb8] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/35">
                  {generateRecipes.isPending ? <><LoaderCircle className="size-4 animate-spin" /> Building your recipes</> : <>Find recipes — {preferences.ingredients.length} ingredient{preferences.ingredients.length === 1 ? "" : "s"} · {preferences.timeAvailable}<ArrowRight className="size-4" /></>}
                </button>
                <p className="mt-3 text-center text-xs leading-5 text-white/38">{hasCaptureIngredients(preferences) ? `Gemini will create 4–6 ideas for your ${preferences.healthGoals.join(", ")} goals.` : "Add an ingredient, then we’ll start from there."}</p>
              </div>
            </aside>
          </form>

          <div className="flex items-center gap-2 border-t border-white/10 pt-5 text-xs leading-5 text-white/40">
            <ChevronDown className="size-4 text-[#bad59a]" />
            {user ? "Your current choices are held for this recipe search." : "Guest choices are kept for this browser session. Sign in later to save them with your account."}
          </div>
        </section>
      </div>
    </main>
  );
}
