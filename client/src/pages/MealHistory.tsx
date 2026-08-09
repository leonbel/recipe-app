import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { filterMealHistory, type MealLogRecord, type RatingFilter } from "@/lib/mealHistory";
import { saveActiveRecipe } from "@/lib/recipeSelection";
import { recipeResultId } from "@/lib/recipePresentation";
import { trpc } from "@/lib/trpc";
import { listMealsOnVercel, shouldUseVercelMealsEndpoint } from "@/lib/vercelMeals";
import { APP_ROUTES, recipeDetailPath } from "@/routes";
import { ArrowLeft, ArrowRight, ChefHat, Search, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

const filters: Array<{ id: RatingFilter; label: string }> = [
  { id: "all", label: "All meals" },
  { id: "five", label: "5 stars" },
  { id: "four-plus", label: "4+ stars" },
  { id: "unrated", label: "Unrated" },
];

export default function MealHistory() {
  const { user } = useSupabaseAuth();
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const useVercelEndpoint = shouldUseVercelMealsEndpoint();
  const historyQuery = trpc.meals.list.useQuery(undefined, { enabled: Boolean(user) && !useVercelEndpoint });
  const [vercelMeals, setVercelMeals] = useState<MealLogRecord[]>([]);
  const [vercelLoading, setVercelLoading] = useState(useVercelEndpoint);
  const [vercelError, setVercelError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!useVercelEndpoint || !user) return;
    setVercelLoading(true);
    setVercelError(null);
    void listMealsOnVercel().then((records) => {
      if (active) setVercelMeals(records);
    }).catch((error) => {
      if (active) setVercelError(error instanceof Error ? error.message : "We could not load your meal history.");
    }).finally(() => {
      if (active) setVercelLoading(false);
    });
    return () => { active = false; };
  }, [user?.id, useVercelEndpoint]);

  const meals = useVercelEndpoint ? vercelMeals : (historyQuery.data ?? []) as MealLogRecord[];
  const loading = Boolean(user) && (useVercelEndpoint ? vercelLoading : historyQuery.isLoading);
  const historyError = useVercelEndpoint ? vercelError : historyQuery.error?.message ?? null;

  const visibleMeals = useMemo(() => filterMealHistory(meals, search, ratingFilter), [meals, ratingFilter, search]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#10110f] px-5 py-5 text-[#f5f4ed] sm:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_90%_7%,rgba(186,213,154,0.12),transparent_28%),radial-gradient(circle_at_5%_80%,rgba(218,140,111,0.1),transparent_25%)]" />
      <div className="relative mx-auto w-full max-w-5xl"><header className="flex items-center justify-between border-b border-white/10 pb-4"><Link href={APP_ROUTES.capture} className="inline-flex items-center gap-2 text-sm text-white/58 transition hover:text-white"><ArrowLeft className="size-4" />Kitchen</Link><div className="flex items-center gap-2 font-display text-xl tracking-tight"><span className="grid size-7 place-items-center rounded-full bg-[#bad59a] text-[#10110f]"><Sparkles className="size-3.5" /></span>mise</div></header>
        <section className="pb-16 pt-12"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">Your meal history</p><h1 className="font-display mt-4 text-5xl tracking-[-0.06em] sm:text-6xl">Your greatest hits.</h1><p className="mt-4 max-w-xl text-base leading-7 text-white/55">Every meal you finish is saved here with the details that make the next cook even better.</p>
          {meals.length > 0 && <><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex h-12 max-w-md flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-4 text-white/55"><Search className="size-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search meals, tags, notes" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35" /></label><span className="text-sm text-white/45">{visibleMeals.length} {visibleMeals.length === 1 ? "meal" : "meals"}</span></div><div className="mt-5 flex flex-wrap gap-2">{filters.map((filter) => <button key={filter.id} type="button" aria-pressed={ratingFilter === filter.id} onClick={() => setRatingFilter(filter.id)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${ratingFilter === filter.id ? "border-[#bad59a] bg-[#bad59a] text-[#10110f]" : "border-white/10 bg-white/[0.04] text-white/58 hover:text-white"}`}>{filter.label}</button>)}</div></>}
          {loading ? <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center text-sm text-white/55">Loading your account meal history…</div> : historyError ? <div className="mt-10 rounded-[2rem] border border-[#da8c6f]/30 bg-[#da8c6f]/[0.08] p-8 text-center"><h2 className="font-display text-3xl">History needs a moment.</h2><p className="mt-3 text-sm leading-6 text-white/55">{historyError}</p></div> : meals.length === 0 ? <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center backdrop-blur-xl"><ChefHat className="mx-auto size-6 text-[#bad59a]" /><h2 className="font-display mt-5 text-4xl">The next favourite starts here.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/50">Complete a cook and rate it to build a personal record of the recipes worth repeating.</p><Link href={APP_ROUTES.capture} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f5f4ed] px-5 py-3 text-sm font-semibold text-[#10110f]">Find recipes <ArrowRight className="size-4" /></Link></div> : visibleMeals.length === 0 ? <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center"><h2 className="font-display text-3xl">Nothing matches that yet.</h2><button type="button" onClick={() => { setSearch(""); setRatingFilter("all"); }} className="mt-4 text-sm font-semibold text-[#bad59a] underline underline-offset-4">Clear filters</button></div> : <div className="mt-8 grid gap-4">{visibleMeals.map((meal) => <article key={meal.id} className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#bad59a]">{new Date(meal.cookedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>{meal.rating && <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#f3cf77]"><Star className="size-3 fill-[#f3cf77]" />{meal.rating}/5</span>}</div><h2 className="font-display mt-2 text-3xl tracking-tight">{meal.recipe.name}</h2><p className="mt-2 text-sm text-white/52">Made for {meal.servings} · {meal.recipe.total_time}</p>{meal.notes && <p className="mt-3 max-w-xl text-sm italic leading-6 text-white/64">“{meal.notes}”</p>}</div><Link href={recipeDetailPath(recipeResultId(meal.recipe))} onClick={() => saveActiveRecipe(meal.recipe)} className="mt-5 inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-white/12 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/10 sm:mt-0">Cook again <ArrowRight className="size-4" /></Link></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
