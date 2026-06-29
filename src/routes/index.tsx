import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { getPublicStats } from "@/lib/public-stats.functions";
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
  ArrowRight,
  Star,
  Heart,
  Zap,
  Gamepad2,
  Users,
  Bot,
  Check,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Mascot } from "@/components/Mascot";
import chibiPeek from "@/assets/mascot-chibi-peek.png?w=480&format=webp&quality=80";
import paintEscape from "@/assets/mascot-paint-escape.png?w=720&format=webp&quality=82";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { AnimatedBlobs } from "@/components/motion/AnimatedBlobs";
import { CountUp } from "@/components/motion/CountUp";
import { Marquee } from "@/components/motion/Marquee";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { WavyDivider } from "@/components/motion/WavyDivider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenox — O bot Discord brasileiro para sua comunidade" },
      {
        name: "description",
        content:
          "Moderação, economia, level, tickets, sorteios e muito mais. Um bot completo, gratuito e feito para a galera brasileira.",
      },
      { property: "og:title", content: "Zenox — Bot Discord brasileiro" },
      {
        property: "og:description",
        content:
          "Dashboard web, economia, AutoMod, level e mini games. Adicione em 30 segundos.",
      },
    ],
  }),
  loader: () => getPublicStats(),
  component: Landing,
});

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k+`;
  if (n <= 0) return "—";
  return String(n);
}

function startDiscordLogin(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  window.location.href = `/api/auth/discord/login?origin=${encodeURIComponent(
    window.location.origin,
  )}`;
}

type Tone = "purple" | "pink" | "sun" | "mint" | "sky" | "coral";

const TONE: Record<
  Tone,
  { bg: string; soft: string; text: string; border: string; ring: string }
> = {
  purple: { bg: "bg-[#7C3AED]", soft: "bg-[#EDE3FF]", text: "text-[#7C3AED]", border: "border-[#7C3AED]", ring: "shadow-[0_6px_0_0_#5B21B6]" },
  pink:   { bg: "bg-[#EC4899]", soft: "bg-[#FFE4F1]", text: "text-[#EC4899]", border: "border-[#EC4899]", ring: "shadow-[0_6px_0_0_#BE185D]" },
  sun:    { bg: "bg-[#FBBF24]", soft: "bg-[#FFF3D1]", text: "text-[#B45309]", border: "border-[#FBBF24]", ring: "shadow-[0_6px_0_0_#B45309]" },
  mint:   { bg: "bg-[#10D9A0]", soft: "bg-[#D6FBEC]", text: "text-[#047857]", border: "border-[#10D9A0]", ring: "shadow-[0_6px_0_0_#047857]" },
  sky:    { bg: "bg-[#38BDF8]", soft: "bg-[#DCF3FF]", text: "text-[#0369A1]", border: "border-[#38BDF8]", ring: "shadow-[0_6px_0_0_#0369A1]" },
  coral:  { bg: "bg-[#FB7185]", soft: "bg-[#FFE0E5]", text: "text-[#BE123C]", border: "border-[#FB7185]", ring: "shadow-[0_6px_0_0_#BE123C]" },
};

const modules: {
  n: string;
  title: string;
  desc: string;
  tone: Tone;
  icon: LucideIcon;
}[] = [
  { n: "01", title: "Moderação inteligente", desc: "AutoMod com filtros, warns, mutes e bans automáticos. Tudo registrado.", tone: "coral", icon: Shield },
  { n: "02", title: "Tickets v2", desc: "Suporte com múltiplos painéis, departamentos e transcrições bonitas.", tone: "sky", icon: Ticket },
  { n: "03", title: "Logs detalhados", desc: "Veja quem editou o quê, entrou, saiu ou mexeu nos cargos.", tone: "purple", icon: ScrollText },
  { n: "04", title: "Economia & loja", desc: "Coins, banco, loja de cargos e itens. Engaja sem cobrar.", tone: "sun", icon: Coins },
  { n: "05", title: "Level & XP", desc: "XP por chat e voz, rank cards bonitos e cargos automáticos por nível.", tone: "pink", icon: TrendingUp },
  { n: "06", title: "Boas-vindas", desc: "Editor visual de embeds e mensagens de boas-vindas em segundos.", tone: "mint", icon: MessageSquare },
  { n: "07", title: "Sorteios", desc: "Crie sorteios com requisitos de cargo, idade da conta e mais.", tone: "purple", icon: Sparkles },
  { n: "08", title: "Enquetes", desc: "Vote com botões ou reações. Resultado em tempo real.", tone: "sky", icon: Vote },
  { n: "09", title: "Sugestões", desc: "Canal de feedback com aprovação, rejeição e comentários.", tone: "coral", icon: Lightbulb },
];




function Landing() {
  const data = Route.useLoaderData();
  const serversLabel = data.servers > 0 ? formatCount(data.servers) : "Novo";
  const commandsLabel = `${data.commands}+`;
  return (
    <div className="min-h-dvh overflow-hidden bg-[#FBF7FF] font-['Inter'] text-[#1B0E3B] selection:bg-[#7C3AED] selection:text-white">
      <ScrollProgress />
      {/* Floating shapes (animated) */}
      <AnimatedBlobs />



      <SiteHeader />

      {/* HERO */}
      <section className="relative px-4 pb-16 pt-28 md:px-6 md:pt-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <StaggerGroup className="relative space-y-7" stagger={0.1} amount={0.1}>
            <StaggerItem direction="down">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#10D9A0]" />
                  <span className="relative size-2 rounded-full bg-[#10D9A0]" />
                </span>
                {data.online ? `Online · ${serversLabel} servidores` : `Pronto pra começar · ${serversLabel} servidores`}
              </div>
            </StaggerItem>

            <StaggerItem direction="blur">
              <h1 className="font-['Plus_Jakarta_Sans'] text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
                O bot que sua{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">galera</span>
                  <motion.span
                    aria-hidden
                    className="absolute -bottom-1 left-0 -z-0 h-3 w-full -rotate-1 rounded-full bg-[#FBBF24]"
                    initial={{ scaleX: 0, transformOrigin: "left center" }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>{" "}
                vai{" "}
                <span className="relative inline-block bg-[length:200%_auto] bg-clip-text text-transparent [background-image:linear-gradient(90deg,#7C3AED,#A855F7,#EC4899,#FBBF24,#7C3AED)] [animation:shimmer_6s_linear_infinite]">
                  amar usar.
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="max-w-xl text-lg leading-relaxed text-[#5B4B7A]">
                Moderação, economia, level, tickets, sorteios, mini-games e um painel web que
                qualquer um consegue mexer. Tudo num bot só — e de graça pra começar.
              </p>
            </StaggerItem>

            {/* CTAs */}
            <StaggerItem>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <PeekButton
                  href="/api/auth/discord/login"
                  onClick={startDiscordLogin}
                  label="Comece agora"
                />
                <Link
                  to="/recursos"
                  className="group inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-6 py-3.5 text-base font-bold text-[#1B0E3B] shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
                >
                  Ver recursos
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </StaggerItem>

            {/* Social proof */}
            <StaggerItem>
              <div className="flex items-center gap-4 pt-2 text-sm text-[#5B4B7A]">
                <div className="flex -space-x-2">
                  {["#7C3AED", "#EC4899", "#FBBF24", "#10D9A0"].map((c, i) => (
                    <motion.span
                      key={c}
                      className="size-7 rounded-full border-2 border-white"
                      style={{ background: c }}
                      animate={{ y: [0, -3, 0] }}
                      transition={{
                        duration: 2.4,
                        delay: i * 0.18,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
                <span>
                  <strong className="text-[#1B0E3B]">{serversLabel}</strong> servidores conectados
                </span>
              </div>
            </StaggerItem>
          </StaggerGroup>

          {/* MS Paint window — mascote quebrando a 4ª parede */}
          <motion.div
            className="relative mx-auto w-full max-w-md"
            initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: "spring", damping: 12, stiffness: 120, delay: 0.2 }}
          >
            <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-md bg-[#1B0E3B]" />
            <div className="paint-window relative overflow-hidden rounded-md border-2 border-[#1B0E3B] bg-white shadow-[6px_6px_0_0_#1B0E3B]">
              {/* Title bar */}
              <div className="flex items-center justify-between gap-2 border-b-2 border-[#1B0E3B] bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 font-mono text-xs font-bold text-white">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-3 border border-white/40 bg-[#FBBF24]" />
                  zenox.exe — Paint
                </div>
                <div className="flex items-center gap-1">
                  <button className="flex size-4 items-center justify-center border border-white/40 bg-[#c3c7cb] text-[10px] text-black">_</button>
                  <button className="flex size-4 items-center justify-center border border-white/40 bg-[#c3c7cb] text-[10px] text-black">▢</button>
                  <button className="flex size-4 items-center justify-center border border-white/40 bg-[#c3c7cb] text-[10px] text-black">×</button>
                </div>
              </div>
              {/* Toolbar */}
              <div className="flex items-center gap-1 border-b border-[#1B0E3B]/30 bg-[#dfe3ea] px-2 py-1">
                {["#000000", "#7C3AED", "#EC4899", "#FBBF24", "#10D9A0", "#38BDF8"].map((c, i) => (
                  <motion.span
                    key={c}
                    className="size-3 border border-black/50"
                    style={{ background: c }}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + i * 0.05, type: "spring", damping: 10, stiffness: 220 }}
                  />
                ))}
                <span className="ml-2 font-mono text-[10px] text-[#1B0E3B]">untitled.bmp</span>
              </div>
              {/* Canvas */}
              <div className="paint-canvas relative aspect-square bg-white">
                <img
                  src={paintEscape}
                  alt="Zenox tentando sair da tela"
                  className="absolute inset-0 size-full object-contain p-4"
                />
                {/* Crack lines suggesting glass */}
                <span aria-hidden className="paint-crack pointer-events-none absolute inset-0" />
              </div>

              <AnimatedFloatingBadge className="-left-4 top-12 -rotate-6" tone="sun" delay={0.7} drift={6}>
                <Gamepad2 className="size-3.5" /> Mini games
              </AnimatedFloatingBadge>
              <AnimatedFloatingBadge className="-right-3 top-24 rotate-6" tone="pink" delay={0.85} drift={8}>
                <Heart className="size-3.5" /> Comunidade
              </AnimatedFloatingBadge>
              <AnimatedFloatingBadge className="-left-6 bottom-20 -rotate-3" tone="mint" delay={1.0} drift={5}>
                <Zap className="size-3.5" /> 99.9% uptime
              </AnimatedFloatingBadge>
              <AnimatedFloatingBadge className="-right-4 bottom-8 rotate-3" tone="sky" delay={1.15} drift={7}>
                <Bot className="size-3.5" /> {commandsLabel} comandos
              </AnimatedFloatingBadge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE — pílulas de recursos rolando */}
      <section className="relative py-6">
        <div className="border-y-2 border-[#1B0E3B] bg-[#1B0E3B] py-3">
          <Marquee speed={35}>
            {[
              { label: "Moderação inteligente", color: "#FB7185" },
              { label: "AutoMod", color: "#38BDF8" },
              { label: "Tickets v2", color: "#7C3AED" },
              { label: "Economia & loja", color: "#FBBF24" },
              { label: "Level & XP", color: "#EC4899" },
              { label: "Boas-vindas", color: "#10D9A0" },
              { label: "Sorteios", color: "#A855F7" },
              { label: "Enquetes", color: "#38BDF8" },
              { label: "Mini games", color: "#FBBF24" },
              { label: "Sugestões", color: "#FB7185" },
              { label: "Painel web", color: "#10D9A0" },
              { label: "Logs detalhados", color: "#EC4899" },
            ].map((p, i) => (
              <span
                key={`${p.label}-${i}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-white/20 bg-white/5 px-4 py-1.5 text-sm font-extrabold uppercase tracking-widest text-white"
              >
                <span className="size-2 rounded-full" style={{ background: p.color }} />
                {p.label}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* TRAILER — veja em ação dentro de uma janela MS Paint */}
      <section className="relative px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]">
                <Sparkles className="size-3.5" /> Veja em ação
              </span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                Um comando. Um <span className="bg-[#FBBF24] px-2 -rotate-1 inline-block">show</span>.
              </h2>
              <p className="max-w-xl text-base text-[#5B4B7A]">
                Digita um comando no Discord — o Zenox responde com estilo, rápido e bonito.
              </p>
            </div>
          </Reveal>

          <motion.div
            className="relative mx-auto w-full max-w-4xl"
            initial={{ opacity: 0, y: 30, rotate: -1 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", damping: 16, stiffness: 90 }}
          >
            <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-md bg-[#1B0E3B]" />
            <div className="relative overflow-hidden rounded-md border-2 border-[#1B0E3B] bg-white shadow-[6px_6px_0_0_#1B0E3B]">
              <div className="flex items-center justify-between gap-2 border-b-2 border-[#1B0E3B] bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 font-mono text-xs font-bold text-white">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block size-3 border border-white/40 bg-[#FBBF24]" />
                  zenox-trailer.mp4 — Reproduzindo
                </div>
                <div className="flex items-center gap-1">
                  <span className="flex size-4 items-center justify-center border border-white/40 bg-[#c3c7cb] text-[10px] text-black">_</span>
                  <span className="flex size-4 items-center justify-center border border-white/40 bg-[#c3c7cb] text-[10px] text-black">▢</span>
                  <span className="flex size-4 items-center justify-center border border-white/40 bg-[#c3c7cb] text-[10px] text-black">×</span>
                </div>
              </div>
              <video
                src="/zenox-trailer.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Trailer do Zenox: comando /daily sendo digitado e o bot respondendo"
                className="block w-full"
              />
            </div>
            <AnimatedFloatingBadge className="-left-3 -top-3 -rotate-6" tone="sun" delay={0.3} drift={6}>
              <Zap className="size-3.5" /> Sem lag
            </AnimatedFloatingBadge>
            <AnimatedFloatingBadge className="-right-3 -bottom-3 rotate-6" tone="mint" delay={0.5} drift={6}>
              <Check className="size-3.5" /> 22s
            </AnimatedFloatingBadge>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-4 py-12 md:px-6">

        <StaggerGroup
          className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4"
          stagger={0.1}
        >
          {[
            {
              v: commandsLabel,
              num: data.commands,
              suffix: "+",
              l: "comandos",
              tone: "purple" as Tone,
            },
            {
              v: serversLabel,
              num: data.servers > 0 ? data.servers : null,
              suffix: data.servers >= 1000 ? "k+" : data.servers > 0 ? "+" : "",
              numShown: data.servers >= 1000 ? data.servers / 1000 : data.servers,
              l: "servidores",
              tone: "pink" as Tone,
            },
            { v: "99.9", num: 99.9, suffix: "%", l: "uptime", tone: "mint" as Tone, decimals: 1 },
            { v: "<80", num: 80, prefix: "<", suffix: "ms", l: "latência", tone: "sky" as Tone },
          ].map((s) => {
            const t = TONE[s.tone];
            return (
              <StaggerItem key={s.l} direction="scale">
                <motion.div
                  className={`rounded-3xl border-2 border-[#1B0E3B] bg-white p-5 ${t.ring}`}
                  whileHover={{ y: -6, rotate: -1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 220 }}
                >
                  <div
                    className={`font-['Plus_Jakarta_Sans'] text-3xl font-extrabold ${t.text}`}
                  >
                    {s.num !== null && s.num !== undefined ? (
                      <CountUp
                        to={"numShown" in s && s.numShown !== undefined ? s.numShown : s.num}
                        prefix={s.prefix ?? ""}
                        suffix={s.suffix ?? ""}
                        decimals={s.decimals ?? 0}
                        duration={1.6}
                      />
                    ) : (
                      s.v
                    )}
                  </div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-[#5B4B7A]">
                    {s.l}
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>

      {/* MODULES */}
      <section id="recursos" className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <Reveal className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <SectionLabel tone="purple">Recursos</SectionLabel>
            <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight md:text-5xl">
              Tudo o que seu server precisa,{" "}
              <span className="text-[#7C3AED]">num bot só.</span>
            </h2>
            <p className="mt-3 text-[#5B4B7A]">
              Pare de instalar seis bots diferentes. O Zenox cobre moderação, economia, level,
              tickets e muito mais — sem dor de cabeça.
            </p>
          </div>
          <Link
            to="/recursos"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-5 py-2.5 text-sm font-bold text-[#1B0E3B] shadow-[0_4px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
          >
            Ver todos <ArrowRight className="size-4" />
          </Link>
        </Reveal>

        <StaggerGroup
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          stagger={0.07}
          amount={0.15}
        >
          {modules.map((m) => {
            const t = TONE[m.tone];
            const Icon = m.icon;
            return (
              <StaggerItem key={m.n} direction="up">
                <motion.article
                  className={`group relative rounded-3xl border-2 border-[#1B0E3B] bg-white p-6 ${t.ring}`}
                  whileHover={{ y: -8, rotate: -0.6 }}
                  transition={{ type: "spring", damping: 14, stiffness: 220 }}
                >
                  <motion.div
                    className={`mb-5 inline-flex size-12 items-center justify-center rounded-2xl ${t.soft} ${t.text} border-2 ${t.border}`}
                    whileHover={{ rotate: [0, -12, 10, -6, 0], scale: 1.1 }}
                    transition={{ duration: 0.55 }}
                  >
                    <Icon className="size-5" />
                  </motion.div>
                  <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-xl font-extrabold">
                    {m.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#5B4B7A]">{m.desc}</p>
                  <span className="mt-4 inline-block font-mono text-[10px] font-bold uppercase tracking-widest text-[#5B4B7A]/60">
                    #{m.n}
                  </span>
                </motion.article>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </section>


      {/* WAVY DIVIDER → dark section */}
      <WavyDivider color="#1B0E3B" height={80} className="-mb-px" />

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden bg-[#1B0E3B] px-4 py-24 text-white md:px-6">
        {/* Decorative animated orbs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-10 size-[300px] rounded-full bg-[#7C3AED]/30 blur-[100px]"
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-10 size-[300px] rounded-full bg-[#EC4899]/25 blur-[100px]"
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-14 max-w-2xl">
            <SectionLabel tone="sun" dark>
              Em 30 segundos
            </SectionLabel>
            <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight md:text-5xl">
              Comece em{" "}
              <span className="bg-gradient-to-r from-[#FBBF24] to-[#FB7185] bg-clip-text text-transparent">
                três passos.
              </span>
            </h2>
          </Reveal>
          <StaggerGroup className="grid gap-6 md:grid-cols-3" stagger={0.12}>
            {[
              { n: "01", title: "Convide o Zenox", desc: "Adicione o bot no seu servidor com um clique." },
              { n: "02", title: "Entre no painel", desc: "Login com Discord e configure tudo num dashboard simples." },
              { n: "03", title: "Curta com a galera", desc: "Ative módulos, crie sorteios e veja sua comunidade bombar." },
            ].map((s, i) => {
              const tones: Tone[] = ["pink", "sun", "mint"];
              const t = TONE[tones[i]];
              return (
                <StaggerItem key={s.n} direction="up">
                  <motion.div
                    className="h-full rounded-3xl border-2 border-white/10 bg-white/5 p-6"
                    whileHover={{ y: -6, backgroundColor: "rgba(255,255,255,0.1)" }}
                    transition={{ type: "spring", damping: 14, stiffness: 200 }}
                  >
                    <motion.div
                      className={`mb-4 inline-flex size-10 items-center justify-center rounded-xl ${t.bg} font-['Plus_Jakarta_Sans'] text-sm font-extrabold text-[#1B0E3B]`}
                      whileHover={{ rotate: [0, -15, 12, 0], scale: 1.15 }}
                      transition={{ duration: 0.5 }}
                    >
                      {s.n}
                    </motion.div>
                    <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-lg font-extrabold">
                      {s.title}
                    </h3>
                    <p className="text-sm text-white/70">{s.desc}</p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <WavyDivider color="#1B0E3B" height={80} flip className="-mt-px" />



      {/* PREMIUM TEASER */}
      <section className="px-4 py-24 md:px-6">
        <Reveal direction="scale" className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 rounded-[2rem] border-2 border-[#1B0E3B] bg-gradient-to-br from-[#FFE4F1] via-[#F1E9FF] to-[#FFF3D1] p-8 shadow-[0_8px_0_0_#1B0E3B] md:grid-cols-[1.2fr_1fr] md:p-12">
            <StaggerGroup className="space-y-5">
              <StaggerItem><SectionLabel tone="pink">Zenox+</SectionLabel></StaggerItem>
              <StaggerItem>
                <h2 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight md:text-5xl">
                  Quer turbinar?{" "}
                  <span className="text-[#EC4899]">Vira Zenox+.</span>
                </h2>
              </StaggerItem>
              <StaggerItem>
                <p className="text-[#5B4B7A]">
                  Mais slots de sorteios, ranks cards exclusivos, ticket panels ilimitados e fila de
                  processamento prioritária. Apoiando o projeto você ajuda a manter o bot gratuito
                  pra todo mundo.
                </p>
              </StaggerItem>
              <StaggerItem>
                <ul className="space-y-2 text-sm font-semibold text-[#1B0E3B]">
                  {[
                    "Painéis de ticket ilimitados",
                    "Rank cards com fundo customizado",
                    "Mais slots de sorteios e auto-roles",
                    "Selo Zenox+ no seu servidor",
                  ].map((f, i) => (
                    <motion.li
                      key={f}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.08, duration: 0.45 }}
                    >
                      <motion.span
                        className="inline-flex size-5 items-center justify-center rounded-full bg-[#10D9A0] text-white"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.08, type: "spring", damping: 10, stiffness: 250 }}
                      >
                        <Check className="size-3" />
                      </motion.span>
                      {f}
                    </motion.li>
                  ))}
                </ul>
              </StaggerItem>
              <StaggerItem>
                <Link
                  to="/premium"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-[#EC4899] px-6 py-3 text-sm font-bold text-white shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
                >
                  Conhecer Zenox+ <ArrowRight className="size-4" />
                </Link>
              </StaggerItem>
            </StaggerGroup>
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", damping: 12, stiffness: 150, delay: 0.3 }}
            >
              <Mascot variant="celebrate" size={300} className="mx-auto animate-[float_4s_ease-in-out_infinite]" />
              <AnimatedFloatingBadge className="left-2 top-2 -rotate-6" tone="sun" delay={0.6}>
                <Star className="size-3.5" /> Premium
              </AnimatedFloatingBadge>
            </motion.div>
          </div>
        </Reveal>
      </section>

      {/* COMMUNITY CTA */}
      <section className="px-4 py-24 md:px-6">
        <StaggerGroup className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3" stagger={0.1}>
          <StaggerItem>
            <CommunityCard
              tone="purple"
              icon={Users}
              title="Comunidade"
              desc="Entra no servidor oficial e bate papo com a galera."
              to="/suporte"
              cta="Entrar no Discord"
            />
          </StaggerItem>
          <StaggerItem>
            <CommunityCard
              tone="mint"
              icon={Bot}
              title="Status do bot"
              desc="Veja o uptime, latência e incidentes em tempo real."
              to="/status"
              cta="Ver status"
            />
          </StaggerItem>
          <StaggerItem>
            <CommunityCard
              tone="sky"
              icon={ScrollText}
              title="Documentação"
              desc="Tudo o que você precisa saber pra dominar o Zenox."
              to="/docs"
              cta="Abrir docs"
            />
          </StaggerItem>
        </StaggerGroup>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 pb-24 pt-8 md:px-6">
        <Reveal direction="scale" className="mx-auto max-w-5xl">
          <div className="rounded-[2.5rem] border-2 border-[#1B0E3B] bg-[#1B0E3B] p-1 shadow-[0_10px_0_0_#7C3AED]">
            <div className="relative overflow-hidden rounded-[2.3rem] bg-gradient-to-br from-[#7C3AED] via-[#A855F7] to-[#EC4899] p-10 text-center md:p-16">
              <motion.div
                className="absolute -left-10 -top-10 size-40 rounded-full bg-[#FBBF24]/30 blur-3xl"
                animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-10 -right-10 size-40 rounded-full bg-[#38BDF8]/30 blur-3xl"
                animate={{ x: [0, -25, 0], y: [0, -15, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* sparkle dots */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute size-1 rounded-full bg-white"
                  style={{
                    left: `${10 + ((i * 37) % 80)}%`,
                    top: `${15 + ((i * 53) % 70)}%`,
                  }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                  transition={{
                    duration: 2 + (i % 3),
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut",
                  }}
                />
              ))}
              <h2 className="relative font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight text-white md:text-6xl">
                Pronto pra deixar seu server{" "}
                <span className="italic">lendário?</span>
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-white/80">
                Adiciona o Zenox em 30 segundos e configura tudo no painel.
              </p>
              <div className="relative mt-8 inline-block">
                <PeekButton
                  href="/api/auth/discord/login"
                  onClick={startDiscordLogin}
                  label="Adicionar ao Discord"
                  large
                  dark
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>


      <SiteFooter />

      {/* Local keyframes scoped here */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes shimmer {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes peek-down {
          0%   { transform: translate(-50%, 40%) rotate(-8deg); opacity: 0; }
          60%  { transform: translate(-50%, 8%)  rotate(4deg);  opacity: 1; }
          80%  { transform: translate(-50%, 14%) rotate(-2deg); opacity: 1; }
          100% { transform: translate(-50%, 10%) rotate(0deg);  opacity: 1; }
        }
        @keyframes curious-tilt {
          0%, 100% { transform: translate(-50%, 10%) rotate(-3deg); }
          50%      { transform: translate(-50%, 8%)  rotate(3deg); }
        }
        @keyframes punch-glass {
          0%, 70%, 100% { transform: translate(-50%, 10%) rotate(0deg); }
          75% { transform: translate(-50%, 4%)  rotate(-4deg); }
          80% { transform: translate(-52%, 14%) rotate(-2deg); }
          85% { transform: translate(-48%, 14%) rotate(2deg); }
          90% { transform: translate(-50%, 12%) rotate(0deg); }
        }
        @keyframes glass-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-2px, 1px) rotate(-0.4deg); }
          40% { transform: translate(2px, -1px) rotate(0.4deg); }
          60% { transform: translate(-1px, 2px) rotate(-0.2deg); }
          80% { transform: translate(1px, -2px) rotate(0.2deg); }
        }
        @keyframes press-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .paint-window { animation: glass-shake 0.6s ease-in-out infinite; }
        .paint-canvas img { animation: press-pulse 2.4s ease-in-out infinite; }
        .paint-crack {
          background-image:
            linear-gradient(135deg, transparent 49.6%, rgba(27,14,59,0.18) 50%, transparent 50.4%),
            linear-gradient(45deg,  transparent 49.6%, rgba(27,14,59,0.12) 50%, transparent 50.4%);
          background-size: 60% 60%, 40% 40%;
          background-position: 30% 40%, 60% 60%;
          background-repeat: no-repeat;
          mix-blend-mode: multiply;
        }
        /* Hover apenas dispara a animação via JS — sem CSS movendo a imagem */

      `}</style>
    </div>
  );
}

/* ---------- Pieces ---------- */

/**
 * PeekButton — refeito do zero
 * - Mascote dorme atrás do botão (escondido)
 * - No hover/focus: sobe com spring suave, espia por trás do botão e balança
 * - Botão ganha leve scale + sombra animada (sem magnético arrastando)
 * - Mascote e botão são ancorados pelo mesmo wrapper: nunca se descolam
 * - Seta pulsa lateralmente quando ativo
 */
function PeekButton({
  href,
  onClick,
  label,
  large = false,
  dark = false,
}: {
  href: string;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  label: string;
  large?: boolean;
  dark?: boolean;
}) {
  const base = dark
    ? "bg-white text-[#1B0E3B] border-[#1B0E3B]"
    : "bg-[#7C3AED] text-white border-[#1B0E3B]";
  const size = large ? "px-8 py-4 text-lg" : "px-6 py-3.5 text-base";
  const chibiSize = large ? 96 : 78;

  const [active, setActive] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      {/* Halo âmbar atrás do botão quando ativo */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-full"
        initial={false}
        animate={{
          opacity: active ? 1 : 0,
          scale: active ? 1.18 : 0.9,
        }}
        transition={{ type: "spring", damping: 18, stiffness: 220 }}
        style={{
          background:
            "radial-gradient(closest-side, rgba(245,158,11,0.55), rgba(245,158,11,0) 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Mascote espiando — POSICIONADO ACIMA do botão, descendo o olhar atrás dele */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 z-20"
        style={{
          width: chibiSize,
          height: chibiSize,
          top: 0,
          // âncora pelo bottom para que o "rosto" sente em cima da borda superior do botão
          transform: "translate(-50%, -100%)",
          transformOrigin: "50% 100%",
        }}
        initial={false}
        animate={
          active
            ? {
                y: [0, 0],
                opacity: 1,
                scale: 1,
                rotate: [-3, 3, -3],
              }
            : {
                y: 16,
                opacity: 0,
                scale: 0.85,
                rotate: 0,
              }
        }
        transition={
          active
            ? {
                y: { type: "spring", damping: 14, stiffness: 220 },
                opacity: { duration: 0.2 },
                scale: { type: "spring", damping: 12, stiffness: 200 },
                rotate: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
              }
            : { type: "spring", damping: 20, stiffness: 240 }
        }
      >
        <img
          src={chibiPeek}
          alt=""
          className="size-full object-contain"
          style={{ filter: "drop-shadow(0 4px 6px rgba(27,14,59,0.35))" }}
          draggable={false}
        />
      </motion.span>

      {/* Botão — apenas scale sutil + sombra reativa, sem magnetic chasing */}
      <motion.a
        href={href}
        onClick={onClick}
        className={`relative z-10 inline-flex items-center gap-2 rounded-full border-2 font-extrabold no-underline ${base} ${size}`}
        initial={false}
        animate={{
          scale: active ? 1.04 : 1,
          boxShadow: active
            ? "0 10px 0 0 #1B0E3B, 0 14px 30px -8px rgba(124,58,237,0.45)"
            : "0 6px 0 0 #1B0E3B",
          y: active ? -2 : 0,
        }}
        whileTap={{ scale: 0.97, y: 2, boxShadow: "0 2px 0 0 #1B0E3B" }}
        transition={{ type: "spring", damping: 18, stiffness: 300 }}
      >
        {label}
        <motion.span
          animate={active ? { x: [0, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.9, repeat: active ? Infinity : 0, ease: "easeInOut" }}
          className="inline-flex"
        >
          <ArrowRight className="size-4" />
        </motion.span>
      </motion.a>
    </span>
  );
}

function FloatingBadge({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: Tone;
}) {
  const t = TONE[tone];
  return (
    <span
      className={`absolute inline-flex items-center gap-1.5 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1.5 text-[11px] font-extrabold ${t.text} shadow-[0_3px_0_0_#1B0E3B] ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

function AnimatedFloatingBadge({
  children,
  className,
  tone,
  delay = 0,
  drift = 6,
}: {
  children: React.ReactNode;
  className?: string;
  tone: Tone;
  delay?: number;
  drift?: number;
}) {
  const t = TONE[tone];
  return (
    <motion.span
      className={`absolute inline-flex items-center gap-1.5 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1.5 text-[11px] font-extrabold ${t.text} shadow-[0_3px_0_0_#1B0E3B] ${className ?? ""}`}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        delay,
        type: "spring",
        damping: 10,
        stiffness: 200,
      }}
      whileHover={{ scale: 1.1, rotate: 4 }}
    >
      <motion.span
        className="contents"
        animate={{ y: [0, -drift, 0] }}
        transition={{
          duration: 3 + drift * 0.1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay + 0.4,
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}


function SectionLabel({
  children,
  tone,
  dark = false,
}: {
  children: React.ReactNode;
  tone: Tone;
  dark?: boolean;
}) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest ${dark ? "border-white/20 bg-white/5 text-white" : `border-[#1B0E3B] bg-white text-[#1B0E3B]`}`}
    >
      <span className={`size-1.5 rounded-full ${t.bg}`} />
      {children}
    </span>
  );
}

function CommunityCard({
  tone,
  icon: Icon,
  title,
  desc,
  to,
  cta,
}: {
  tone: Tone;
  icon: LucideIcon;
  title: string;
  desc: string;
  to: string;
  cta: string;
}) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className={`group relative block rounded-3xl border-2 border-[#1B0E3B] bg-white p-6 no-underline ${t.ring} transition-transform hover:-translate-y-1`}
    >
      <div
        className={`mb-4 inline-flex size-12 items-center justify-center rounded-2xl ${t.soft} ${t.text} border-2 ${t.border}`}
      >
        <Icon className="size-5" />
      </div>
      <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold no-underline">{title}</h3>
      <p className="mt-2 text-sm text-[#5B4B7A] no-underline">{desc}</p>
      <span className={`mt-4 inline-flex items-center gap-1 text-sm font-bold no-underline ${t.text}`}>
        {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

