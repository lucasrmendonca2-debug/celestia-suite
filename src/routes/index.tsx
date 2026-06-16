import { createFileRoute, Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import {
  Shield,
  Coins,
  TrendingUp,
  Ticket,
  Sparkles,
  MessageSquare,
  Bot,
  Zap,
  LayoutDashboard,
  ScrollText,
  Users,
  ArrowRight,
} from "lucide-react";
import mascot from "@/assets/zenox-mascot.png.asset.json";
import { ThemeToggle } from "@/components/ThemeProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenox — Bot premium para Discord" },
      {
        name: "description",
        content:
          "Moderação, economia, level, tickets e dashboard completo. O Zenox deixa seu Discord do nível pro top.",
      },
      { property: "og:title", content: "Zenox — Bot premium para Discord" },
      {
        property: "og:description",
        content: "Painel web, economia interna, AutoMod e mais — tudo num bot só.",
      },
      { property: "og:image", content: mascot.url },
      { name: "twitter:image", content: mascot.url },
      { name: "twitter:card", content: "summary_large_image" },
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

const features = [
  {
    icon: Shield,
    title: "Moderação avançada",
    desc: "Warns, mutes, bans temporários, AutoMod, histórico completo e casos auditáveis.",
  },
  {
    icon: Ticket,
    title: "Tickets v2",
    desc: "Claim, SLA, auto-close, tags, prioridades, transcripts e métricas de atendimento.",
  },
  {
    icon: ScrollText,
    title: "Logs do servidor",
    desc: "Mensagens, membros, cargos, canais, voz e convites — tudo categorizado e filtrável.",
  },
  {
    icon: Coins,
    title: "Economia",
    desc: "Moeda interna, loja, daily, work, rob, crime, ranking — com anti-abuso embutido.",
  },
  {
    icon: TrendingUp,
    title: "Leveling",
    desc: "XP por mensagem e voz, multiplicadores, cards de rank e leaderboard.",
  },
  {
    icon: MessageSquare,
    title: "Embeds & boas-vindas",
    desc: "Editor visual de embeds, autorole, welcome/leave com placeholders dinâmicos.",
  },
];

const stats = [
  { label: "Comandos slash", value: "60+" },
  { label: "Módulos", value: "10" },
  { label: "Uptime", value: "99.9%" },
  { label: "Latência", value: "<80ms" },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,theme(colors.primary/0.25),transparent_70%)]" />
        <div className="absolute left-1/2 top-1/2 -z-10 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border/0.4)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/0.4)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-30" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative size-9 overflow-hidden rounded-xl bg-primary/15 ring-1 ring-primary/40">
              <img src={mascot.url} alt="Zenox" className="absolute inset-0 size-full scale-[2.2] object-cover object-top" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zenox</span>
          </div>
          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            <a href="#features" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Recursos
            </a>
            <a href="#mascot" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              O que posso fazer
            </a>
            <Link to="/dashboard" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Dashboard
            </Link>
            <ThemeToggle />
            <a
              href="/api/auth/discord/login"
              onClick={startDiscordLogin}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Bot className="size-4" />
              <span className="hidden sm:inline">Entrar com Discord</span>
              <span className="sm:hidden">Entrar</span>
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-12 grid items-center gap-10 sm:mt-20 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3" /> Onda 4 ao vivo — Logs + Tickets v2
            </span>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              O Discord da sua comunidade,{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
                do nível pro top.
              </span>
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Zenox é um bot multifuncional com moderação avançada, economia, level, tickets e
              um dashboard premium pra configurar tudo sem digitar um único comando.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/api/auth/discord/login"
                onClick={startDiscordLogin}
                className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                Começar agora
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </a>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
              >
                <LayoutDashboard className="size-4" />
                Ver dashboard
              </Link>
            </div>

            {/* Stats */}
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-card/50 p-3 backdrop-blur"
                >
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="text-xl font-bold tracking-tight">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Mascot card */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/30 via-blue-500/20 to-purple-500/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/40 p-6 backdrop-blur">
              <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Zap className="size-3" /> Online
              </div>
              <img
                src={mascot.url}
                alt="Mascote do Zenox"
                className="mx-auto h-[360px] w-auto object-contain drop-shadow-2xl sm:h-[420px]"
              />
              <div className="mt-2 text-center">
                <p className="text-lg font-bold">Zenox</p>
                <p className="text-xs text-muted-foreground">
                  Sempre pronto pra moderar, organizar e turbinar seu servidor.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-24 sm:mt-32">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tudo num bot só</h2>
            <p className="mt-2 text-muted-foreground">
              Pare de instalar 6 bots diferentes. O Zenox cobre o stack inteiro do seu servidor.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-5 transition hover:border-primary/40 hover:bg-card"
              >
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What I can do — mascot section */}
        <section
          id="mascot"
          className="relative mt-24 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card/80 to-primary/10 p-6 sm:mt-32 sm:p-10"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="order-2 mx-auto lg:order-1">
              <img
                src={mascot.url}
                alt="Zenox mostrando suas funções"
                className="h-[320px] w-auto object-contain drop-shadow-2xl sm:h-[420px]"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3" /> O que posso fazer
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Seu assistente de servidor, em um chibi só.
              </h2>
              <p className="mt-3 text-muted-foreground">
                De moderação preventiva a economia interna, o Zenox cobre tudo. Aponta, configura
                no dashboard, e deixa o trabalho pesado comigo.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Shield, text: "Modero raids, spam e palavrões antes de você ver" },
                  { icon: Ticket, text: "Abro tickets organizados com SLA e auto-close" },
                  { icon: Users, text: "Recepciono novos membros com welcome custom" },
                  { icon: Coins, text: "Cuido da economia: moedas, loja, daily, ranking" },
                  { icon: TrendingUp, text: "Dou XP por atividade e mostro cards de rank" },
                  { icon: ScrollText, text: "Registro tudo que acontece no servidor" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                      <item.icon className="size-3.5" />
                    </span>
                    <span className="text-muted-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/api/auth/discord/login"
                  onClick={startDiscordLogin}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Adicionar ao meu servidor
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Zenox. Feito com café e regex.</p>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <a href="#features" className="hover:text-foreground">
              Recursos
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
