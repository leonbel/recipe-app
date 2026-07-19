import { loadGeneratedRecipes } from "@/lib/generatedRecipes";
import { APP_ROUTES } from "@/routes";
import { ArrowLeft, ArrowRight, Clock3, ShoppingBasket, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

export default function RecipeResults() {
  const recipes = useMemo(() => loadGeneratedRecipes()?.recipes ?? [], []);
  const sortedRecipes = useMemo(() => [...recipes].sort((a, b) => b.score - a.score), [recipes]);

  return (
    <main className="min-h-screen bg-[#10110f] px-5 py-5 text-[#f5f4ed] sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href={APP_ROUTES.capture} className="inline-flex items-center gap-2 text-sm text-white/58 transition hover:text-white"><ArrowLeft className="size-4" /> Kitchen</Link>
          <div className="flex items-center gap-2 font-display text-xl tracking-tight"><span className="grid size-7 place-items-center rounded-full bg-[#bad59a] text-[#10110f]"><Sparkles className="size-3.5" /></span>mise</div>
        </header>

        <section className="py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">Live Gemini generation</p>
          <h1 className="font-display mt-4 text-5xl tracking-[-0.055em] sm:text-6xl">What’ll it be?</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/55">{recipes.length ? `${recipes.length} recipe ideas are ready from your kitchen.` : "Generate recipe ideas from the ingredients in your kitchen."}</p>

          {sortedRecipes.length ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {sortedRecipes.map((recipe) => (
                <article key={`${recipe.name}-${recipe.score}`} className="rounded-[1.75rem] border border-white/12 bg-white/[0.055] p-5 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-[#bad59a]/15 px-3 py-1.5 text-xs font-semibold text-[#d8edbf]">{recipe.score}% for you</span><span className="inline-flex items-center gap-1.5 text-xs text-white/42"><Clock3 className="size-3.5" />{recipe.total_time}</span></div>
                  <h2 className="font-display mt-7 text-3xl leading-none tracking-tight">{recipe.name}</h2>
                  <p className="mt-3 text-sm italic leading-6 text-white/52">{recipe.flavour}</p>
                  <div className="mt-5 flex flex-wrap gap-2">{recipe.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/62">{tag}</span>)}</div>
                  {recipe.missing_ingredients.length > 0 && <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#f0a48b]"><ShoppingBasket className="mt-0.5 size-3.5 shrink-0" />Need: {recipe.missing_ingredients.join(", ")}</p>}
                  <p className="mt-5 text-sm leading-6 text-white/45">Full recipe details and food imagery arrive in the next build step.</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.045] p-7 text-center backdrop-blur-xl"><p className="font-display text-3xl">Your next meal starts in the kitchen.</p><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/50">Add ingredients, select your preferences, then let Gemini generate a tailored set of recipes.</p><Link href={APP_ROUTES.capture} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f5f4ed] px-5 py-3 text-sm font-semibold text-[#10110f]">Build a recipe set <ArrowRight className="size-4" /></Link></div>
          )}
        </section>
      </div>
    </main>
  );
}
