import { createFileRoute } from "@tanstack/react-router";
import {
  Shield,
  Ticket,
  ScrollText,
  Coins,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Vote,
  Lightbulb,
  Music,
  Gamepad2,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { PublicPage, PageCTA } from "@/components/site/PublicPage";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

export const Route = createFileRoute("/recursos")({
  head: () => ({
    meta: [
      { title: "Recursos — Zenox" },
      { name: "description", content: "Todos os módulos do Zenox: moderação, economia, level, tickets, sorteios, mini-games e muito mais." },
      { property: "og:title", content: "Recursos — Zenox" },
      { property: "og:description", content: "Todos os módulos do Zenox: moderação, economia, level, tickets, sorteios, mini-games e muito mais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Recursos — Zenox" },
      { name: "twitter:description", content: "Conheça todos os módulos do Zenox para sua comunidade Discord." },
    ],
  }),
  component: Recursos,
});

type Item = { title: string; desc: string; icon: LucideIcon; color: string; soft: string };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Comunidade",
    items: [
      { title: "Boas-vindas", desc: "Mensagens, embeds e cards personalizados.", icon: MessageSquare, color: "#7C3AED", soft: "#EDE3FF" },
      { title: "Level & XP", desc: "XP por chat/voz, rank cards e cargos por nível.", icon: TrendingUp, color: "#EC4899", soft: "#FFE4F1" },
      { title: "Economia", desc: "Coins, banco, loja de cargos e jogos.", icon: Coins, color: "#FBBF24", soft: "#FFF3D1" },
      { title: "Mini games", desc: "Slots, dado, blackjack e desafios.", icon: Gamepad2, color: "#10D9A0", soft: "#D6FBEC" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { title: "Moderação", desc: "AutoMod, warns, mutes, bans temporários.", icon: Shield, color: "#FB7185", soft: "#FFE0E5" },
      { title: "Tickets v2", desc: "Múltiplos painéis, departamentos, transcrições.", icon: Ticket, color: "#38BDF8", soft: "#DCF3FF" },
      { title: "Logs", desc: "Mensagens, cargos, entradas e mudanças.", icon: ScrollText, color: "#7C3AED", soft: "#EDE3FF" },
      { title: "Auto-roles", desc: "Cargos automáticos por entrada ou reação.", icon: Bot, color: "#EC4899", soft: "#FFE4F1" },
    ],
  },
  {
    title: "Engajamento",
    items: [
      { title: "Sorteios", desc: "Com requisitos de cargo, idade de conta e mais.", icon: Sparkles, color: "#FBBF24", soft: "#FFF3D1" },
      { title: "Enquetes", desc: "Vote com botões ou reações.", icon: Vote, color: "#10D9A0", soft: "#D6FBEC" },
      { title: "Sugestões", desc: "Canal de feedback com status.", icon: Lightbulb, color: "#FB7185", soft: "#FFE0E5" },
      { title: "Música", desc: "Toque do YouTube e Spotify (em beta).", icon: Music, color: "#38BDF8", soft: "#DCF3FF" },
    ],
  },
];

function Recursos() {
  return (
    <PublicPage
      eyebrow="Recursos"
      title="Tudo o que o Zenox faz"
      highlight="num só bot."
      description="Mais de 90 comandos slash, organizados em módulos pensados pra comunidades de verdade."
    >
      <div className="mx-auto max-w-6xl space-y-16">
        {groups.map((g, gi) => (
          <section key={g.title}>
            <Reveal>
              <h2 className="mb-6 font-['Plus_Jakarta_Sans'] text-2xl font-extrabold tracking-tight md:text-3xl">
                {g.title}
              </h2>
            </Reveal>
            <StaggerGroup
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
              stagger={0.06}
              delayChildren={0.05 + gi * 0.05}
            >
              {g.items.map((it) => {
                const Icon = it.icon;
                return (
                  <StaggerItem key={it.title} direction="up">
                    <motion.article
                      className="group h-full rounded-3xl border-2 border-[#1B0E3B] bg-white p-5 shadow-[0_5px_0_0_#1B0E3B]"
                      whileHover={{ y: -8, rotate: -0.6 }}
                      transition={{ type: "spring", damping: 14, stiffness: 220 }}
                    >
                      <motion.div
                        className="mb-4 inline-flex size-11 items-center justify-center rounded-2xl border-2"
                        style={{ background: it.soft, color: it.color, borderColor: it.color }}
                        whileHover={{ rotate: [0, -15, 12, -8, 0], scale: 1.12 }}
                        transition={{ duration: 0.55 }}
                      >
                        <Icon className="size-5" />
                      </motion.div>
                      <h3 className="font-['Plus_Jakarta_Sans'] text-base font-extrabold">{it.title}</h3>
                      <p className="mt-1 text-sm text-[#5B4B7A]">{it.desc}</p>
                    </motion.article>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </section>
        ))}
        <Reveal direction="scale">
          <PageCTA />
        </Reveal>
      </div>
    </PublicPage>
  );
}
