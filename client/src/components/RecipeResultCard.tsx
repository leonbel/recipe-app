import { pollinationsFoodImageUrl, recipeResultId } from "@/lib/recipePresentation";
import { recipeDetailPath } from "@/routes";
import type { Recipe } from "@shared/recipe";
import { ArrowRight, Bookmark, Clock3, ShoppingBasket, Sparkles, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type RecipeResultCardProps = { recipe: Recipe };

export default function RecipeResultCard({ recipe }: RecipeResultCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const highMatch = recipe.score >= 75;
  const detailPath = recipeDetailPath(recipeResultId(recipe));

  return (
    <article className="group relative isolate min-h-[30rem] overflow-hidden rounded-[2rem] border border-white/15 bg-[#1a1b18] shadow-[0_22px_65px_rgba(0,0,0,0.42)]">
      {!imageFailed ? (
        <img
          src={pollinationsFoodImageUrl(recipe.name)}
          alt={`${recipe.name}, food photography`}
          className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_10%,rgba(218,140,111,0.38),transparent_34%),radial-gradient(circle_at_90%_94%,rgba(186,213,154,0.28),transparent_38%),linear-gradient(145deg,#282b22,#151611)]" />
      )}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,12,10,0.22)_0%,rgba(11,12,10,0.72)_60%,rgba(11,12,10,0.92)_100%)]" />
      <div className="absolute inset-0 rounded-[2rem] bg-[#10110f]/46 backdrop-blur-[12px]" />

      <div className="relative flex min-h-[30rem] flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-xl">
            <span className={`size-2 rounded-full ${highMatch ? "bg-[#bad59a] shadow-[0_0_12px_rgba(186,213,154,0.8)]" : "bg-white/40"}`} />
            {recipe.score}% for you
          </span>
          <button type="button" aria-label={saved ? `Remove ${recipe.name} from saved recipes` : `Save ${recipe.name}`} aria-pressed={saved} onClick={() => setSaved((current) => !current)} className="grid size-10 place-items-center rounded-full border border-white/20 bg-black/20 text-white/80 backdrop-blur-xl transition hover:bg-white/15 active:scale-95">
            <Bookmark className={`size-4 ${saved ? "fill-[#f5f4ed]" : ""}`} />
          </button>
        </div>

        <div className="mt-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-black/20 px-3 py-1.5 text-xs text-white/78 backdrop-blur-xl"><Clock3 className="size-3.5" />{recipe.total_time}</div>
          <h2 className="font-display mt-4 text-[clamp(2.3rem,5vw,3.55rem)] leading-[0.91] tracking-[-0.055em] text-white">{recipe.name}</h2>
          <p className="mt-3 line-clamp-1 text-sm italic leading-6 text-white/70">{recipe.flavour}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {recipe.tags.map((tag) => <span key={tag} className="rounded-full border border-white/18 bg-white/[0.08] px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-xl">{tag}</span>)}
          </div>

          {recipe.missing_ingredients.length > 0 && (
            <section className="mt-5 rounded-2xl border border-[#da8c6f]/35 bg-[#da8c6f]/15 p-3.5 text-[#ffd0be] backdrop-blur-xl" aria-label="Missing ingredients">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em]"><ShoppingBasket className="size-3.5" />Missing</div>
              <div className="mt-2 flex flex-wrap gap-1.5">{recipe.missing_ingredients.map((ingredient) => <span key={ingredient} className="rounded-full border border-[#f4c1ad]/30 bg-black/10 px-2 py-1 text-xs">{ingredient}</span>)}</div>
            </section>
          )}

          {!imageFailed ? null : <p className="mt-4 flex items-center gap-2 text-xs text-white/50"><UtensilsCrossed className="size-3.5" />Food image is loading again soon.</p>}

          <Link href={detailPath} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f5f4ed] px-5 text-sm font-semibold text-[#10110f] transition hover:bg-white active:scale-[0.98]">
            View recipe <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
