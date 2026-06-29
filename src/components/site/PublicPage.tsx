import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import { AnimatedBlobs } from "@/components/motion/AnimatedBlobs";

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
    <div className="min-h-dvh overflow-hidden bg-[#FBF7FF] font-['Inter'] text-[#1B0E3B] selection:bg-[#7C3AED] selection:text-white">
      <AnimatedBlobs />

      <SiteHeader />

      <section className="px-4 pb-12 pt-32 md:px-6 md:pt-36">
        <div className="mx-auto max-w-5xl">
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="size-1.5 rounded-full bg-[#7C3AED]" />
            {eyebrow}
          </motion.span>
          <motion.h1
            className="mt-4 font-['Plus_Jakarta_Sans'] text-5xl font-extrabold tracking-tight md:text-6xl"
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}{" "}
            {highlight && (
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#EC4899] bg-clip-text text-transparent">
                {highlight}
              </span>
            )}
          </motion.h1>
          <motion.p
            className="mt-4 max-w-2xl text-lg text-[#5B4B7A]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {description}
          </motion.p>
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
