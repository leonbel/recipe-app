import RecipeResultCard from "@/components/RecipeResultCard";
import { loadGeneratedRecipes } from "@/lib/generatedRecipes";
import { isFallbackImagePreview, isImageErrorChainPreview, isPublicDesignReviewPreview, isUnavailableImagePreview, type RecipeResultsFilter, visibleRecipes } from "@/lib/recipePresentation";
import { APP_ROUTES } from "@/routes";
import type { RecipeGenerationResponse } from "@shared/recipe";
import { ArrowLeft, ArrowRight, ChefHat, SlidersHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const filters: Array<{ id: RecipeResultsFilter; label: string }> = [
  { id: "all", label: "All recipes" },
  { id: "no-shopping", label: "No shopping needed" },
];

const RESULTS_PREVIEW: RecipeGenerationResponse = {
  recipes: [
    {
      name: "Harissa Chicken & Chickpeas",
      flavour: "Smoky, lemon-bright and deeply savoury with a warmly spiced finish.",
      total_time: "35 min",
      health_headline: "A high-protein tray bake with fibre-rich chickpeas and vitamin C from lemon.",
      health_insights: ["Chicken provides complete protein.", "Chickpeas add fibre and iron."],
      tags: ["High protein", "High iron"],
      score: 96,
      base_servings: 2,
      missing_ingredients: ["Harissa paste"],
      ingredients: [{ group: "Protein", name: "Chicken thighs", qty: 400, unit: "g" }],
      steps: [{ order: 1, instruction: "Roast the chicken and chickpeas until golden.", timer_seconds: 1800 }],
    },
    {
      name: "Green Herb Salmon Bowl",
      flavour: "Clean, citrusy and herbaceous with a crisp cucumber finish.",
      total_time: "25 min",
      health_headline: "Omega-3 rich salmon meets satisfying whole-grain carbohydrates for an energising meal.",
      health_insights: ["Salmon contributes heart-supporting omega-3s.", "Greens add folate and fibre."],
      tags: ["High protein", "Clean carb"],
      score: 91,
      base_servings: 2,
      missing_ingredients: [],
      ingredients: [{ group: "Protein", name: "Salmon fillets", qty: 2, unit: null }],
      steps: [{ order: 1, instruction: "Sear the salmon until just cooked through.", timer_seconds: 480 }],
    },
    {
      name: "Crispy Tofu Sesame Noodles",
      flavour: "Nutty sesame, crisp-edged tofu and a gentle chilli warmth.",
      total_time: "30 min",
      health_headline: "Plant protein and colourful vegetables make this a fibre-forward weeknight bowl.",
      health_insights: ["Tofu offers plant-based protein.", "Vegetables provide gut-friendly prebiotic fibre."],
      tags: ["Gut-friendly", "Clean carb"],
      score: 84,
      base_servings: 2,
      missing_ingredients: ["Sesame oil", "Rice noodles"],
      ingredients: [{ group: "Protein", name: "Firm tofu", qty: 280, unit: "g" }],
      steps: [{ order: 1, instruction: "Crisp the tofu in a hot pan.", timer_seconds: 600 }],
    },
    {
      name: "Charred Broccoli Frittata",
      flavour: "Creamy eggs, charred greens and a peppery parmesan bite.",
      total_time: "20 min",
      health_headline: "A low-carb, high-protein skillet supper built around iron-rich greens.",
      health_insights: ["Eggs provide protein and choline.", "Broccoli brings fibre and vitamin K."],
      tags: ["Low carb", "High protein"],
      score: 78,
      base_servings: 2,
      missing_ingredients: ["Parmesan"],
      ingredients: [{ group: "Protein", name: "Eggs", qty: 6, unit: null }],
      steps: [{ order: 1, instruction: "Bake the frittata until puffed and set.", timer_seconds: 720 }],
    },
  ],
};

export default function RecipeResults() {
  const query = new URLSearchParams(window.location.search);
  const showDesignReview = isPublicDesignReviewPreview(window.location.search);
  const showPreview = showDesignReview || (import.meta.env.DEV && query.get("preview") === "recipes");
  const forceFallback = import.meta.env.DEV && isFallbackImagePreview(window.location.search);
  const forceUnavailable = import.meta.env.DEV && isUnavailableImagePreview(window.location.search);
  const forceImageErrorChain = import.meta.env.DEV && isImageErrorChainPreview(window.location.search);
  const recipes = useMemo(() => (showPreview ? RESULTS_PREVIEW.recipes : loadGeneratedRecipes()?.recipes ?? []), [showPreview]);
  const [filter, setFilter] = useState<RecipeResultsFilter>("all");
  const displayedRecipes = useMemo(() => visibleRecipes(recipes, filter), [filter, recipes]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#10110f] px-5 py-5 text-[#f5f4ed] sm:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_86%_8%,rgba(186,213,154,0.13),transparent_28%),radial-gradient(circle_at_6%_42%,rgba(218,140,111,0.09),transparent_25%)]" />
      <div className="relative mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href={APP_ROUTES.capture} className="inline-flex items-center gap-2 text-sm text-white/58 transition hover:text-white"><ArrowLeft className="size-4" /> Kitchen</Link>
          <div className="flex items-center gap-2 font-display text-xl tracking-tight"><span className="grid size-7 place-items-center rounded-full bg-[#bad59a] text-[#10110f]"><Sparkles className="size-3.5" /></span>mise</div>
        </header>

        {showDesignReview && <div role="status" className="mt-5 flex items-start gap-3 rounded-2xl border border-[#bad59a]/20 bg-[#bad59a]/[0.08] px-4 py-3 text-sm leading-6 text-white/70"><Sparkles className="mt-0.5 size-4 shrink-0 text-[#bad59a]" /><p><span className="font-semibold text-[#bad59a]">Design review preview.</span> These example recipes are shown only to review the result-card experience. Your generated recipe set remains unchanged.</p></div>}

        <section className="pb-14 pt-12 sm:pb-20 sm:pt-16">
          <div className="flex flex-col gap-7 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">Recipe matches</p>
              <h1 className="font-display mt-4 text-5xl tracking-[-0.06em] sm:text-6xl">What’ll it be?</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/55">{recipes.length ? `${recipes.length} personalised recipe ${recipes.length === 1 ? "option" : "options"}, ranked around what you already have.` : "Generate a recipe set from the ingredients in your kitchen."}</p>
            </div>
            {recipes.length > 0 && <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.045] p-1.5 backdrop-blur-xl" aria-label="Recipe filters">{filters.map((option) => <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)} className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition ${filter === option.id ? "bg-[#f5f4ed] text-[#10110f]" : "text-white/55 hover:text-white"}`}>{option.id === "no-shopping" && <SlidersHorizontal className="size-3.5" />}{option.label}</button>)}</div>}
          </div>

          {recipes.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 text-center backdrop-blur-xl sm:p-10">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#bad59a]/12 text-[#bad59a]"><ChefHat className="size-5" /></span>
              <h2 className="font-display mt-6 text-4xl tracking-tight">Your next meal starts in the kitchen.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/50">Add ingredients and preferences, then we’ll generate a tailored set of recipe ideas for you.</p>
              <Link href={APP_ROUTES.capture} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f5f4ed] px-5 py-3 text-sm font-semibold text-[#10110f] transition active:scale-[0.97]">Build a recipe set <ArrowRight className="size-4" /></Link>
            </div>
          ) : displayedRecipes.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 text-center backdrop-blur-xl"><p className="font-display text-3xl">Nothing without a shop today.</p><p className="mt-3 text-sm text-white/50">Try all recipes to see the full set of ideas.</p><button type="button" onClick={() => setFilter("all")} className="mt-5 text-sm font-semibold text-[#bad59a] underline underline-offset-4">Show all recipes</button></div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">{displayedRecipes.map((recipe) => <RecipeResultCard key={`${recipe.name}-${recipe.score}-${forceImageErrorChain ? "error-chain" : forceUnavailable ? "unavailable" : forceFallback ? "fallback" : "primary"}`} recipe={recipe} forceFallback={forceFallback} forceUnavailable={forceUnavailable} forceImageErrorChain={forceImageErrorChain} />)}</div>
          )}
        </section>
      </div>
    </main>
  );
}
