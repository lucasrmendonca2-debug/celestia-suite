import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";

export function PublicPage({
  eyebrow,
  title,
  highlight,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#FBF7FF] font-['Inter'] text-[#1B0E3B] selection:bg-[#7C3AED] selection:text-white">
      <div className="pointer-events-none absolute right-[-10%] top-20 -z-10 size-[500px] rounded-full bg-[#EC4899]/20 blur-[120px]" />
      <div className="pointer-events-none absolute left-[-10%] top-[40%] -z-10 size-[500px] rounded-full bg-[#7C3AED]/20 blur-[120px]" />

      <SiteHeader />

      <section className="px-4 pb-12 pt-32 md:px-6 md:pt-36">
        <div className="mx-auto max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]">
            <span className="size-1.5 rounded-full bg-[#7C3AED]" />
            {eyebrow}
          </span>
          <h1 className="mt-4 font-['Plus_Jakarta_Sans'] text-5xl font-extrabold tracking-tight md:text-6xl">
            {title}{" "}
            {highlight && (
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#EC4899] bg-clip-text text-transparent">
                {highlight}
              </span>
            )}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#5B4B7A]">{description}</p>
        </div>
      </section>

      <main className="px-4 pb-24 md:px-6">{children}</main>

      <SiteFooter />
    </div>
  );
}

export function PageCTA() {
  return (
    <div className="mx-auto mt-20 max-w-5xl rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-8 shadow-[0_8px_0_0_#7C3AED] md:p-12">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold md:text-3xl">
            Bora colocar o Zenox no seu server?
          </h3>
          <p className="mt-1 text-[#5B4B7A]">Leva 30 segundos. Sem cartão, sem enrolação.</p>
        </div>
        <Link
          to="/entrar"
          className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
        >
          Adicionar agora <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
