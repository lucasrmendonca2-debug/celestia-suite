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
  Sparkles,
  Vote,
  Lightbulb,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenox — Bot premium para Discord" },
      {
        name: "description",
        content:
          "Moderação, economia, level, tickets, sorteios e dashboard completo — tudo em um único bot.",
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

const features = [
  { n: "01", icon: Shield, title: "Moderação", desc: "Warns, mutes e bans temporários. AutoMod, histórico e casos auditáveis." },
  { n: "02", icon: Ticket, title: "Tickets v2", desc: "Claim, SLA, auto-close, tags, prioridades e transcripts." },
  { n: "03", icon: ScrollText, title: "Logs", desc: "Mensagens, membros, cargos, canais, voz e convites. Categorizado." },
  { n: "04", icon: Coins, title: "Economia", desc: "Moeda interna, loja, daily, work, rob, ranking. Anti-abuso." },
  { n: "05", icon: TrendingUp, title: "Leveling", desc: "XP por mensagem e voz, multiplicadores, cards e leaderboard." },
  { n: "06", icon: MessageSquare, title: "Embeds & boas-vindas", desc: "Editor de embeds, autorole e welcome com placeholders." },
  { n: "07", icon: Sparkles, title: "Sorteios", desc: "Giveaways com requisitos, reroll automático e histórico." },
  { n: "08", icon: Vote, title: "Enquetes", desc: "Votações com botões, prazo e resultados em tempo real." },
  { n: "09", icon: Lightbulb, title: "Sugestões", desc: "Canal dedicado, votos da comunidade e fluxo de aprovação." },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_55%_60%_at_50%_0%,theme(colors.primary/0.10),transparent_70%)]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/40">
              <span className="font-mono text-[13px] font-bold tracking-tighter text-primary">Z</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Zenox</span>
            <span className="ml-2 hidden text-[11px] font-mono uppercase tracking-widest text-muted-foreground sm:inline">
              v0.5 · wave 5
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm sm:gap-4">
            <a href="#modulos" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Módulos
            </a>
            <Link to="/comandos" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Comandos
            </Link>
            <Link to="/dashboard" className="hidden text-muted-foreground hover:text-foreground sm:inline">
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

        {/* Hero — single column, clean */}
        <section className="mt-24 flex flex-col items-start sm:mt-32">
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="mr-2 inline-block size-1.5 translate-y-[-2px] rounded-full bg-primary align-middle" />
            bot premium para Discord
          </p>
          <h1 className="max-w-3xl text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-[68px]">
            Seu servidor
            <br />
            <span className="text-muted-foreground">no</span>{" "}
            <span className="italic text-primary">mais alto nível.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[17px]">
            Moderação, economia, level, tickets, sorteios, enquetes e um painel
            web pra configurar tudo — sem digitar um único comando.
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
          <div className="mt-12 flex w-full flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
            {[
              ["80+", "comandos slash"],
              ["13", "módulos"],
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
        </section>

        {/* Features */}
        <section id="modulos" className="mt-28 sm:mt-40">
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
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-28 sm:mt-36">
          <div className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-card/40 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Pronto pra subir o nível do seu servidor?
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Login com Discord. Configuração em minutos. Sem cartão de crédito.
              </p>
            </div>
            <a
              href="/api/auth/discord/login"
              onClick={startDiscordLogin}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Adicionar Zenox
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Zenox. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <a href="#modulos" className="hover:text-foreground">Módulos</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
