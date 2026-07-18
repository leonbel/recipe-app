import { ArrowLeft, ArrowRight, Check, CircleDashed } from "lucide-react";
import { Link } from "wouter";
import { APP_ROUTES } from "@/routes";

type SetupScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
  backTo?: string;
};

export default function SetupScreen({
  eyebrow,
  title,
  description,
  nextStep,
  backTo = APP_ROUTES.capture,
}: SetupScreenProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#10110f] px-5 py-5 text-[#f5f4ed] sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_75%_0%,rgba(186,213,154,0.16),transparent_58%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-3xl flex-col">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href={backTo} className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="font-display text-lg tracking-tight">mise</span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-14">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#bad59a]">{eyebrow}</p>
          <h1 className="font-display max-w-2xl text-5xl leading-[0.95] tracking-[-0.05em] sm:text-7xl">{title}</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/58 sm:text-lg">{description}</p>

          <div className="mt-10 max-w-xl rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl sm:p-6">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[#bad59a] text-[#10110f]">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-medium text-white">Route connected</p>
                <p className="mt-1 text-sm leading-6 text-white/50">This screen is part of the Step 1 navigation foundation.</p>
              </div>
            </div>
            <div className="my-5 h-px bg-white/10" />
            <div className="flex items-start gap-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/50">
                <CircleDashed className="size-4" />
              </span>
              <div>
                <p className="font-medium text-white/75">Next implementation</p>
                <p className="mt-1 text-sm leading-6 text-white/50">{nextStep}</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-white/10 py-4 text-xs uppercase tracking-[0.16em] text-white/35">
          <span>Foundation · Step 1</span>
          <Link href={APP_ROUTES.capture} className="inline-flex items-center gap-2 transition hover:text-white">
            View map <ArrowRight className="size-3.5" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
