import { scaleIngredients } from "@/lib/recipeExperience";
import { fallbackFoodImageUrl, isPublicDesignReviewPreview, pollinationsFoodImageUrl, recipeResultId } from "@/lib/recipePresentation";
import { resolveRecipeForRoute } from "@/lib/recipeSelection";
import { APP_ROUTES, cookingPath } from "@/routes";
import { ArrowLeft, ArrowRight, ChefHat, Clock3, Minus, Plus, ShoppingBasket, Sparkles, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

type RecipeDetailProps = { recipeId: string };
type ImageStatus = "primary" | "fallback" | "unavailable";

export default function RecipeDetail({ recipeId }: RecipeDetailProps) {
  const reviewMode = isPublicDesignReviewPreview(window.location.search);
  const recipe = useMemo(() => resolveRecipeForRoute(recipeId, reviewMode), [recipeId, reviewMode]);
  const [servings, setServings] = useState(recipe?.base_servings ?? 2);
  const [imageStatus, setImageStatus] = useState<ImageStatus>("primary");

  useEffect(() => {
    setServings(recipe?.base_servings ?? 2);
    setImageStatus("primary");
  }, [recipe?.base_servings, recipeId]);

  if (!recipe) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#10110f] px-5 text-[#f5f4ed]">
        <section className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 text-center backdrop-blur-xl">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#bad59a]/12 text-[#bad59a]"><ChefHat className="size-5" /></span>
          <h1 className="font-display mt-5 text-4xl tracking-tight">This recipe needs a kitchen first.</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Return to your recipe matches, then choose a dish to see its ingredients and method.</p>
          <Link href={APP_ROUTES.results} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f5f4ed] px-5 py-3 text-sm font-semibold text-[#10110f] transition active:scale-[0.97]"><ArrowLeft className="size-4" />Back to recipes</Link>
        </section>
      </main>
    );
  }

  const imageSource = imageStatus === "primary" ? pollinationsFoodImageUrl(recipe.name) : imageStatus === "fallback" ? fallbackFoodImageUrl(recipe.name) : null;
  const scaledIngredients = scaleIngredients(recipe, servings);
  const groupedIngredients = ["Protein", "Produce", "Pantry", "To buy"] as const;
  const querySuffix = reviewMode ? "?review=design" : "";

  return (
    <main className="min-h-screen overflow-hidden bg-[#10110f] px-5 py-5 text-[#f5f4ed] sm:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(186,213,154,0.12),transparent_27%),radial-gradient(circle_at_6%_68%,rgba(218,140,111,0.12),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href={`${APP_ROUTES.results}${querySuffix}`} className="inline-flex items-center gap-2 text-sm text-white/58 transition hover:text-white"><ArrowLeft className="size-4" />Recipe matches</Link>
          <div className="flex items-center gap-2 font-display text-xl tracking-tight"><span className="grid size-7 place-items-center rounded-full bg-[#bad59a] text-[#10110f]"><Sparkles className="size-3.5" /></span>mise</div>
        </header>

        {reviewMode && <div role="status" className="mt-5 rounded-2xl border border-[#bad59a]/20 bg-[#bad59a]/[0.08] px-4 py-3 text-sm leading-6 text-white/70"><span className="font-semibold text-[#bad59a]">Design review preview.</span> This recipe is an example only; your generated set remains unchanged.</div>}

        <section className="grid gap-8 pb-12 pt-8 lg:grid-cols-[1.03fr_0.97fr] lg:items-stretch lg:pt-12">
          <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/12 bg-[#1a1b18] shadow-[0_24px_75px_rgba(0,0,0,0.42)]">
            {imageSource ? <img src={imageSource} onError={() => setImageStatus((current) => current === "primary" ? "fallback" : "unavailable")} alt={`${recipe.name}, food photography`} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(186,213,154,0.32),transparent_32%),radial-gradient(circle_at_14%_78%,rgba(218,140,111,0.36),transparent_42%),linear-gradient(135deg,#25271f_0%,#151610_49%,#31251e_100%)]" />}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,12,10,0.08),rgba(11,12,10,0.78)_88%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">{recipe.tags.map((tag) => <span key={tag} className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl">{tag}</span>)}</div>
              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl"><Clock3 className="size-3.5" />{recipe.total_time}</p>
            </div>
          </div>

          <div className="flex flex-col rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">{recipe.score}% match for you</p>
            <h1 className="font-display mt-4 text-5xl leading-[0.91] tracking-[-0.06em] sm:text-6xl">{recipe.name}</h1>
            <p className="mt-5 text-base italic leading-7 text-white/64">{recipe.flavour}</p>
            <p className="mt-6 text-base leading-7 text-white/72">{recipe.health_headline}</p>
            <ul className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm leading-6 text-white/65">{recipe.health_insights.map((insight) => <li key={insight} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#bad59a]" />{insight}</li>)}</ul>
            <Link href={`${cookingPath(recipeId)}${querySuffix}`} className="mt-auto inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#f5f4ed] px-5 py-3.5 text-sm font-semibold text-[#10110f] transition hover:bg-white active:scale-[0.98]">Start cooking <ArrowRight className="size-4" /></Link>
          </div>
        </section>

        <section className="grid gap-8 pb-16 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">Ingredients</p><h2 className="font-display mt-3 text-4xl tracking-tight">Scale your plate.</h2></div>
              <div className="flex items-center rounded-full border border-white/12 bg-black/20 p-1.5">
                <button type="button" onClick={() => setServings((value) => Math.max(1, value - 1))} aria-label="Decrease servings" className="grid size-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 active:scale-95"><Minus className="size-4" /></button>
                <span className="min-w-20 px-2 text-center text-xs font-semibold text-white"><UsersRound className="mr-1.5 inline size-3.5 text-[#bad59a]" />{servings} {servings === 1 ? "serve" : "serves"}</span>
                <button type="button" onClick={() => setServings((value) => Math.min(12, value + 1))} aria-label="Increase servings" className="grid size-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 active:scale-95"><Plus className="size-4" /></button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/50">Quantities update from the recipe’s original {recipe.base_servings}-serve base.</p>
            <div className="mt-7 space-y-6">{groupedIngredients.map((group) => {
              const ingredients = scaledIngredients.filter((ingredient) => ingredient.group === group);
              if (!ingredients.length) return null;
              return <section key={group}><p className={`text-xs font-semibold uppercase tracking-[0.16em] ${group === "To buy" ? "text-[#f4b39b]" : "text-white/42"}`}>{group === "To buy" ? "To buy" : group}</p><ul className="mt-3 space-y-2.5">{ingredients.map((ingredient) => <li key={`${group}-${ingredient.name}`} className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-2.5 text-sm"><span className="text-white/78">{ingredient.name}</span><span className="shrink-0 text-white/48">{ingredient.displayQty}{ingredient.unit ? ` ${ingredient.unit}` : ""}</span></li>)}</ul></section>;
            })}</div>
            {recipe.missing_ingredients.length > 0 && <div className="mt-7 rounded-2xl border border-[#da8c6f]/35 bg-[#da8c6f]/12 p-4 text-sm text-[#ffd0be]"><div className="flex items-center gap-2 font-semibold"><ShoppingBasket className="size-4" />You’ll need</div><p className="mt-2 leading-6">{recipe.missing_ingredients.join(", ")}</p></div>}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">Method</p>
            <h2 className="font-display mt-3 text-4xl tracking-tight">Make it happen.</h2>
            <ol className="mt-8 space-y-5">{recipe.steps.slice().sort((a, b) => a.order - b.order).map((step) => <li key={step.order} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#bad59a]/25 bg-[#bad59a]/10 text-xs font-semibold text-[#bad59a]">{step.order}</span><div className="pt-1"><p className="text-sm leading-6 text-white/76">{step.instruction}</p>{step.timer_seconds && <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white/45"><Clock3 className="size-3.5" />Timer ready · {Math.round(step.timer_seconds / 60)} min</p>}</div></li>)}</ol>
          </div>
        </section>
      </div>
    </main>
  );
}
