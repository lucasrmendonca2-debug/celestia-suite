import { createFileRoute, Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { Mascot } from "@/components/Mascot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenox — Bot premium para Discord" },
      {
        name: "description",
        content:
          "Moderação, economia, level, tickets, sorteios e dashboard completo — o bot mais completo do Brasil.",
      },
      { property: "og:title", content: "Zenox — Bot premium para Discord" },
      {
        property: "og:description",
        content:
          "Painel web, economia interna, AutoMod, enquetes e sugestões. Um bot, todos os módulos.",
      },
    ],
  }),
  component: Landing,
});

function startDiscordLogin(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  window.location.href = `/api/auth/discord/login?origin=${encodeURIComponent(
    window.location.origin,
  )}`;
}

type Tone = "pink" | "cyan" | "purple" | "yellow";
const TONES: Record<Tone, { hex: string; bgSoft: string; text: string; border: string }> = {
  pink:   { hex: "#FF5FB4", bgSoft: "bg-[#FF5FB4]/20", text: "text-[#FF5FB4]", border: "hover:border-[#FF5FB4]/50" },
  cyan:   { hex: "#3FE0FF", bgSoft: "bg-[#3FE0FF]/20", text: "text-[#3FE0FF]", border: "hover:border-[#3FE0FF]/50" },
  purple: { hex: "#9D5BFF", bgSoft: "bg-[#9D5BFF]/20", text: "text-[#9D5BFF]", border: "hover:border-[#9D5BFF]/50" },
  yellow: { hex: "#FFE25F", bgSoft: "bg-[#FFE25F]/20", text: "text-[#FFE25F]", border: "hover:border-[#FFE25F]/50" },
};

const modules: { n: string; title: string; desc: string; tone: Tone; icon: LucideIcon; offset: string }[] = [
  { n: "01", title: "Moderação", desc: "AutoMod, warns, mutes e bans temporários automáticos com histórico detalhado.", tone: "pink", icon: Shield, offset: "" },
  { n: "02", title: "Tickets v2", desc: "Suporte profissional com múltiplos painéis, departamentos e transcrições HTML.", tone: "cyan", icon: Ticket, offset: "lg:translate-y-8" },
  { n: "03", title: "Logs", desc: "Monitore tudo: mensagens editadas, cargos alterados e entradas no servidor.", tone: "purple", icon: ScrollText, offset: "" },
  { n: "04", title: "Economia", desc: "Sistema de coins, banco, loja de cargos e jogos para engajar seus membros.", tone: "yellow", icon: Coins, offset: "lg:-translate-y-2" },
  { n: "05", title: "Leveling", desc: "XP por chat e voz, rank cards customizados e cargos por conquista de nível.", tone: "pink", icon: TrendingUp, offset: "lg:translate-y-12" },
  { n: "06", title: "Embeds & Boas-vindas", desc: "Editor visual para mensagens de boas-vindas e comunicados elegantes.", tone: "cyan", icon: MessageSquare, offset: "" },
  { n: "07", title: "Sorteios", desc: "Crie sorteios com requisitos de cargos ou tempo de servidor facilmente.", tone: "purple", icon: Sparkles, offset: "lg:translate-y-4" },
  { n: "08", title: "Enquetes", desc: "Vote com reações ou botões para ouvir a opinião da sua comunidade.", tone: "yellow", icon: Vote, offset: "lg:-translate-y-5" },
  { n: "09", title: "Sugestões", desc: "Canal de feedback organizado com status de aprovado ou negado.", tone: "pink", icon: Lightbulb, offset: "lg:translate-y-10" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-[#10121F] font-['Inter'] text-white selection:bg-[#FF5FB4] selection:text-white">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/5 bg-[#10121F]/80 px-6 py-4 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF5FB4] to-[#9D5BFF] font-['Plus_Jakarta_Sans'] text-xl font-extrabold shadow-[0_0_20px_rgba(255,95,180,0.3)]">
            Z
          </div>
          <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-tight">Zenox</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-gray-400 md:flex">
          <a href="#modulos" className="transition-colors hover:text-[#3FE0FF]">Módulos</a>
          <Link to="/comandos" className="transition-colors hover:text-[#3FE0FF]">Comandos</Link>
          <Link to="/servidores" className="transition-colors hover:text-[#3FE0FF]">Dashboard</Link>
        </div>
        <a
          href="/api/auth/discord/login"
          onClick={startDiscordLogin}
          className="cursor-pointer rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-all hover:bg-[#3FE0FF]"
        >
          Entrar
        </a>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-6 pb-20 pt-32">
        <div className="absolute right-[-10%] top-20 -z-10 size-[500px] rounded-full bg-[#9D5BFF]/15 blur-[120px]" />
        <div className="absolute bottom-0 left-[-5%] -z-10 size-[400px] rounded-full bg-[#FF5FB4]/10 blur-[100px]" />

        <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
          <div className="space-y-8 lg:w-[60%]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3FE0FF]">
              <span className="size-1.5 animate-pulse rounded-full bg-[#3FE0FF]" />
              Bot Premium para Discord
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-6xl font-extrabold leading-[0.9] tracking-tighter md:text-8xl">
              Seu servidor no{" "}
              <span className="bg-gradient-to-r from-[#FF5FB4] via-[#9D5BFF] to-[#3FE0FF] bg-clip-text text-transparent">
                mais alto nível.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-gray-400 md:text-xl">
              Gerencie sua comunidade com o bot mais completo do Brasil. Diversão, segurança e
              automação em um só lugar.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/api/auth/discord/login"
                onClick={startDiscordLogin}
                className="rounded-2xl bg-[#FF5FB4] px-8 py-4 text-lg font-bold text-white shadow-[0_10px_40px_-10px_rgba(255,95,180,0.5)] transition-all hover:scale-105"
              >
                Começar agora
              </a>
              <Link
                to="/servidores"
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-bold transition-all hover:bg-white/10"
              >
                Ver dashboard
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:w-[40%]">
            <div className="relative aspect-square w-full max-w-md">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-tr from-[#FF5FB4]/20 to-[#3FE0FF]/20 blur-3xl" />
              <div className="relative z-10 flex size-full rotate-3 items-center justify-center">
                <Mascot variant="hero" size={420} glow />
              </div>
              <div className="absolute -right-4 -top-4 rotate-12 rounded-2xl border-2 border-[#10121F] bg-[#FFE25F] p-4 font-['Plus_Jakarta_Sans'] font-bold text-[#10121F] shadow-xl">
                Premium ✨
              </div>
              <div className="absolute -left-6 bottom-10 -rotate-6 rounded-2xl border-2 border-[#10121F] bg-[#3FE0FF] p-4 font-['Plus_Jakarta_Sans'] font-bold text-[#10121F] shadow-xl">
                Vibe Neon
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-6 border-y border-white/5 py-12">
          {[
            ["80+", "comandos slash", "#3FE0FF"],
            ["13", "módulos", "#FF5FB4"],
            ["99.9%", "uptime", "#9D5BFF"],
            ["<80ms", "latência", "#FFE25F"],
          ].map(([v, l, c]) => (
            <div key={l} className="flex flex-col">
              <span className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold" style={{ color: c }}>{v}</span>
              <span className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-500">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modulos" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-20">
          <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight md:text-5xl">
            Tudo num <span className="text-[#9D5BFF]">bot só.</span>
          </h2>
          <p className="text-gray-400">
            Pare de instalar seis bots. O Zenox cobre o stack inteiro do seu servidor.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const t = TONES[m.tone];
            const Icon = m.icon;
            return (
              <article
                key={m.n}
                className={`rounded-[2.5rem] border border-white/10 bg-white/5 p-8 transition-all duration-300 ${t.border} ${m.offset} hover:-translate-y-1`}
              >
                <div className={`mb-6 flex size-12 items-center justify-center rounded-2xl ${t.bgSoft} ${t.text} font-bold`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mb-3 font-['Plus_Jakarta_Sans'] text-xl font-bold">{m.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{m.desc}</p>
                <span className="mt-4 inline-block font-mono text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  módulo {m.n}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-32">
        <div className="mx-auto max-w-6xl items-center rounded-[3rem] bg-gradient-to-br from-[#9D5BFF] via-[#FF5FB4] to-[#3FE0FF] p-1">
          <div className="relative flex flex-col items-center gap-12 overflow-hidden rounded-[2.9rem] bg-[#10121F] p-12 md:flex-row md:p-20">
            <div className="absolute right-0 top-0 size-64 bg-[#3FE0FF]/10 blur-3xl" />
            <div className="relative z-10 flex-1 space-y-8">
              <h2 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight md:text-6xl">
                Pronto para levar seu server ao topo?
              </h2>
              <a
                href="/api/auth/discord/login"
                onClick={startDiscordLogin}
                className="inline-block rounded-2xl bg-[#FF5FB4] px-10 py-5 text-xl font-bold text-white shadow-[0_15px_45px_-10px_rgba(255,95,180,0.6)] transition-all hover:scale-105"
              >
                Adicionar o Zenox agora
              </a>
            </div>
            <div className="relative size-48 flex-shrink-0 md:size-64">
              <Mascot variant="celebrate" size={260} glow className="transition-transform hover:scale-110" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-20">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-12 md:flex-row">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-to-tr from-[#FF5FB4] to-[#9D5BFF]" />
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold">Zenox</span>
            </div>
            <p className="max-w-xs text-sm text-gray-500">
              O bot que redefine a experiência do seu servidor Discord com estilo e potência.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 md:grid-cols-3">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Links</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/servidores" className="hover:text-[#3FE0FF]">Dashboard</Link></li>
                <li><Link to="/comandos" className="hover:text-[#3FE0FF]">Comandos</Link></li>
                <li><a href="#modulos" className="hover:text-[#3FE0FF]">Módulos</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-[#FF5FB4]">Servidor de suporte</a></li>
                <li><a href="#" className="hover:text-[#FF5FB4]">Termos</a></li>
                <li><a href="#" className="hover:text-[#FF5FB4]">Privacidade</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Social</h4>
              <div className="flex gap-4">
                <a href="#" className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10" aria-label="Twitter" />
                <a href="#" className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors hover:bg-white/10" aria-label="Discord" />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-20 max-w-7xl border-t border-white/5 pt-8 text-center text-xs font-bold uppercase tracking-widest text-gray-600">
          © {new Date().getFullYear()} Zenox Bot • Feito com ❤ no Brasil
        </div>
      </footer>
    </div>
  );
}
