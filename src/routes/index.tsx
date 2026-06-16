import { createFileRoute, Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import {
  Shield,
  Coins,
  TrendingUp,
  Ticket,
  MessageSquare,
  ScrollText,
  ArrowUpRight,
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
          "Moderação, economia, level, tickets e dashboard completo. Um bot, todos os módulos.",
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
    n: "01",
    icon: Shield,
    title: "Moderação",
    desc: "Warns, mutes e bans temporários. AutoMod, histórico, casos auditáveis.",
  },
  {
    n: "02",
    icon: Ticket,
    title: "Tickets v2",
    desc: "Claim, SLA, auto-close, tags, prioridades e transcripts.",
  },
  {
    n: "03",
    icon: ScrollText,
    title: "Logs",
    desc: "Mensagens, membros, cargos, canais, voz e convites. Categorizado.",
  },
  {
    n: "04",
    icon: Coins,
    title: "Economia",
    desc: "Moeda interna, loja, daily, work, rob, ranking. Anti-abuso embutido.",
  },
  {
    n: "05",
    icon: TrendingUp,
    title: "Leveling",
    desc: "XP por mensagem e voz, multiplicadores, cards e leaderboard.",
  },
  {
    n: "06",
    icon: MessageSquare,
    title: "Embeds & boas-vindas",
    desc: "Editor visual de embeds, autorole, welcome com placeholders.",
  },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* subtle backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,theme(colors.primary/0.10),transparent_70%)]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative size-8 overflow-hidden rounded-md bg-muted ring-1 ring-border">
              <img
                src={mascot.url}
                alt="Zenox"
                className="absolute inset-0 size-full scale-[2.2] object-cover object-top"
              />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Zenox</span>
            <span className="ml-2 hidden text-[11px] font-mono uppercase tracking-widest text-muted-foreground sm:inline">
              v0.4 · wave 4
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm sm:gap-4">
            <a
              href="#features"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Módulos
            </a>
            <Link
              to="/dashboard"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Dashboard
            </Link>

            <ThemeToggle />
            <a
              href="/api/auth/discord/login"
              onClick={startDiscordLogin}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:bg-foreground/85"
            >
              Entrar
              <ArrowUpRight className="size-3.5" />
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-20 grid items-center gap-12 sm:mt-28 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div className="flex flex-col">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="mr-2 inline-block size-1.5 translate-y-[-2px] rounded-full bg-primary align-middle" />
              bot premium para Discord
            </p>
            <h1 className="text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-[64px]">
              Seu servidor,
              <br />
              <span className="text-muted-foreground">do nível</span>{" "}
              <span className="italic text-primary">pro top.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              Moderação, economia, level, tickets e um painel web pra
              configurar tudo — sem digitar um único comando.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="/api/auth/discord/login"
                onClick={startDiscordLogin}
                className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Começar agora
                <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-2 py-2.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Ver dashboard →
              </Link>
            </div>

            {/* Stats inline */}
            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
              {[
                ["60+", "comandos slash"],
                ["10", "módulos"],
                ["99.9%", "uptime"],
                ["<80ms", "latência"],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-semibold tracking-tight">{v}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mascot — flat, editorial */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted/30">
              {/* corner labels */}
              <div className="absolute left-3 top-3 z-10 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                fig.01 — mascote
              </div>
              <div className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                online
              </div>
              <img
                src={mascot.url}
                alt="Mascote do Zenox"
                className="absolute inset-0 size-full object-contain p-6"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-28 sm:mt-40">
          <div className="mb-10 flex items-end justify-between gap-6 border-b border-border pb-4">
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                índice — 01
              </p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Tudo num bot só
              </h2>
            </div>
            <p className="hidden max-w-sm text-sm text-muted-foreground sm:block">
              Pare de instalar seis bots. O Zenox cobre o stack inteiro do seu servidor.
            </p>
          </div>
          <div className="grid divide-border border-border sm:grid-cols-2 sm:divide-x sm:border-y lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group relative p-6 transition hover:bg-muted/30 ${
                  i >= 3 ? "sm:border-t sm:border-border" : ""
                } ${i < features.length - 1 ? "border-b border-border sm:border-b-0" : ""}`}
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    {f.n}
                  </span>
                  <f.icon className="size-4 text-muted-foreground transition group-hover:text-primary" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-28 sm:mt-36">
          <div className="flex flex-col items-start justify-between gap-6 border-t border-border pt-10 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                índice — 02
              </p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Configure tudo pelo painel.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Login com Discord, escolhe o servidor, ativa os módulos. Sem comando, sem fricção.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/api/auth/discord/login"
                onClick={startDiscordLogin}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Adicionar ao servidor
                <ArrowUpRight className="size-4" />
              </a>
              <Link
                to="/dashboard"
                className="px-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                abrir dashboard →
              </Link>
            </div>
          </div>
        </section>


        <footer className="mt-24 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Zenox — wave 4</p>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="hover:text-foreground">
              dashboard
            </Link>
            <a href="#features" className="hover:text-foreground">
              módulos
            </a>
            <a href="#mascot" className="hover:text-foreground">
              o que faço
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
