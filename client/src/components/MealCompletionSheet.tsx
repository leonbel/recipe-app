import type { Recipe } from "@shared/recipe";
import { Check, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

type MealCompletionSheetProps = {
  open: boolean;
  recipe: Recipe;
  signedIn: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (rating: number | null, notes: string) => Promise<void> | void;
};

export default function MealCompletionSheet({ open, recipe, signedIn, saving = false, onClose, onSave }: MealCompletionSheetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setRating(null);
      setNotes("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 pb-3 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="meal-complete-title">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/12 bg-[#1b1c19] p-6 text-[#f5f4ed] shadow-[0_30px_100px_rgba(0,0,0,0.58)] sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><span className="grid size-11 place-items-center rounded-full bg-[#bad59a] text-[#10110f]"><Check className="size-5" /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">Cook complete</p><h2 id="meal-complete-title" className="font-display mt-2 text-4xl tracking-tight">How did it go?</h2></div><button type="button" onClick={onClose} aria-label="Close completion sheet" className="grid size-10 place-items-center rounded-full border border-white/12 text-white/60 transition hover:bg-white/10"><X className="size-4" /></button></div>
        <p className="mt-4 text-sm leading-6 text-white/58">Give <span className="font-medium text-white/78">{recipe.name}</span> a rating and leave a note for your next cook.</p>
        <div className="mt-6 flex gap-2" aria-label="Rate this meal">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={rating === value} className="grid size-10 place-items-center rounded-full border border-white/12 text-white/35 transition hover:border-[#bad59a]/40 hover:text-[#bad59a] active:scale-95"><Star className={`size-4 ${rating !== null && value <= rating ? "fill-[#bad59a] text-[#bad59a]" : ""}`} /></button>)}</div>
        <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.16em] text-white/45" htmlFor="meal-notes">A note for next time <span className="normal-case tracking-normal">(optional)</span></label>
        <textarea id="meal-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1_000} placeholder="What would you make again, change, or remember?" className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm leading-6 text-white placeholder:text-white/30 outline-none transition focus:border-[#bad59a]/55" />
        {signedIn ? <button type="button" disabled={saving} onClick={() => void onSave(rating, notes)} className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#f5f4ed] px-5 text-sm font-semibold text-[#10110f] transition hover:bg-white active:scale-[0.98] disabled:cursor-wait disabled:opacity-65">{saving ? "Saving your meal…" : "Save to meal history"}</button> : <div className="mt-5 rounded-2xl border border-[#bad59a]/18 bg-[#bad59a]/[0.07] p-4 text-sm leading-6 text-white/65">Sign in to keep this cook, rating, and note in your personal history.<Link href="/login" className="ml-2 font-semibold text-[#bad59a] underline underline-offset-4">Sign in</Link></div>}
      </section>
    </div>
  );
}
