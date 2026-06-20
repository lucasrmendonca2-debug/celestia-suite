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
  Heart,
  Wand2,
  Stars,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { Mascot } from "@/components/Mascot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenox — Bot fofo e poderoso para Discord" },
      {
        name: "description",
        content:
          "Moderação, economia, level, tickets, sorteios e dashboard completo — tudo em um único bot, com um toque mágico.",
      },
      { property: "og:title", content: "Zenox — Bot premium para Discord" },
      {
        property: "og:description",
        content:
          "Painel web encantador, economia interna, AutoMod, enquetes e sugestões. Um bot, todos os módulos.",
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

type Tone = "lavender" | "pink" | "cyan" | "mint" | "peach";

const features: { icon: LucideIcon; title: string; desc: string; tone: Tone }[] = [
  { icon: Shield, title: "Moderação", desc: "Warns, mutes, bans temporários, AutoMod e histórico auditável.", tone: "pink" },
  { icon: Ticket, title: "Tickets v2", desc: "Claim, SLA, auto-close, tags, prioridades e transcripts.", tone: "cyan" },
  { icon: ScrollText, title: "Logs detalhados", desc: "Mensagens, membros, cargos, canais, voz e convites — tudo categorizado.", tone: "lavender" },
  { icon: Coins, title: "Economia", desc: "Moeda interna, loja, daily, work, rob, ranking. Tudo anti-abuso.", tone: "peach" },
  { icon: TrendingUp, title: "Leveling", desc: "XP por mensagem e voz, multiplicadores, cards e leaderboard.", tone: "mint" },
  { icon: MessageSquare, title: "Embeds & boas-vindas", desc: "Editor visual, autorole e welcome com placeholders.", tone: "pink" },
  { icon: Sparkles, title: "Sorteios", desc: "Giveaways com requisitos, reroll automático e histórico.", tone: "cyan" },
  { icon: Vote, title: "Enquetes", desc: "Votações com botões, prazo e resultados em tempo real.", tone: "lavender" },
  { icon: Lightbulb, title: "Sugestões", desc: "Canal dedicado, votos da comunidade e fluxo de aprovação.", tone: "mint" },
];

function Landing() {
  return (
    <main className="aurora-shell relative min-h-screen overflow-hidden text-foreground">
      {/* floating sparkles */}
      <FloatingSparkles />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Mascot variant="hero" size={42} className="drop-shadow-[0_4px_18px_color-mix(in_oklab,var(--aurora-pink)_60%,transparent)]" />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold tracking-tight">Zenox</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                magia para Discord
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-sm sm:gap-3">
            <a href="#modulos" className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-[color:color-mix(in_oklab,var(--aurora-lavender)_15%,transparent)] hover:text-foreground sm:inline">
              Módulos
            </a>
            <Link to="/comandos" className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-[color:color-mix(in_oklab,var(--aurora-pink)_15%,transparent)] hover:text-foreground sm:inline">
              Comandos
            </Link>
            <Link to="/servidores" className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-[color:color-mix(in_oklab,var(--aurora-cyan)_15%,transparent)] hover:text-foreground sm:inline">
              Dashboard
            </Link>
            <ThemeToggle />
            <a
              href="/api/auth/discord/login"
              onClick={startDiscordLogin}
              className="aurora-cta inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-background shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--aurora-pink)_70%,transparent)] transition hover:scale-[1.02]"
              style={{ background: "var(--gradient-aurora)" }}
            >
              Entrar
              <ArrowUpRight className="size-3.5" />
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative mt-16 grid items-center gap-10 sm:mt-24 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <span className="aurora-pill mb-6 inline-flex items-center gap-1.5">
              <Stars className="size-3 text-[var(--aurora-pink)]" />
              bot premium · feito com carinho
            </span>
            <h1 className="font-display max-w-3xl text-[44px] font-bold leading-[1.02] tracking-tight sm:text-[68px]">
              Seu servidor{" "}
              <span className="aurora-gradient-text italic">no mais alto nível</span>
              <span className="ml-2 inline-block animate-[wiggle_2.4s_ease-in-out_infinite] text-[var(--aurora-pink)]">✦</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              Moderação, economia, level, tickets, sorteios, enquetes — e um painel
              web tão fofo que dá vontade de configurar. Sem digitar comandos.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="/api/auth/discord/login"
                onClick={startDiscordLogin}
                className="aurora-cta group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-background shadow-[0_14px_40px_-12px_color-mix(in_oklab,var(--aurora-pink)_70%,transparent)] transition hover:scale-[1.03]"
                style={{ background: "var(--gradient-aurora)" }}
              >
                <Wand2 className="size-4" />
                Começar agora
                <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <Link
                to="/servidores"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-5 py-3 text-sm font-medium backdrop-blur transition hover:bg-accent/40"
              >
                Ver dashboard
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            {/* Stats inline */}
            <div className="mt-12 grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["80+", "comandos", "lavender"],
                ["13", "módulos", "pink"],
                ["99.9%", "uptime", "cyan"],
                ["<80ms", "latência", "mint"],
              ].map(([v, l, t]) => (
                <div
                  key={l}
                  className="aurora-panel aurora-card-hover px-4 py-3"
                  style={{
                    background: `linear-gradient(160deg, color-mix(in oklab, var(--aurora-${t}) 18%, var(--card)), color-mix(in oklab, var(--card) 70%, transparent))`,
                  }}
                >
                  <div className="font-display text-2xl font-bold tabular-nums tracking-tight">{v}</div>
                  <div className="font-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mascot hero */}
          <div className="relative mx-auto hidden shrink-0 lg:block">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 animate-pulse rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--aurora-pink) 55%, transparent), transparent 70%)",
              }}
            />
            <Mascot variant="hero" size={340} glow className="animate-[float_5s_ease-in-out_infinite]" />
          </div>
        </section>

        {/* Features */}
        <section id="modulos" className="mt-28 sm:mt-40">
          <div className="mb-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <span className="aurora-pill mb-3 inline-flex items-center gap-1.5">
                <Sparkles className="size-3 text-[var(--aurora-cyan)]" />
                tudo num bot só
              </span>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Pare de instalar <span className="aurora-gradient-text">seis bots</span>.
              </h2>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">
              O Zenox cobre o stack inteiro do seu servidor — e fica bonito enquanto faz isso.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="aurora-panel aurora-card-hover group relative overflow-hidden p-6"
                  style={{
                    background: `linear-gradient(160deg, color-mix(in oklab, var(--aurora-${f.tone}) 14%, var(--card)), color-mix(in oklab, var(--card) 70%, transparent))`,
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-50 blur-3xl transition-transform duration-500 group-hover:scale-125"
                    style={{
                      background: `radial-gradient(circle, color-mix(in oklab, var(--aurora-${f.tone}) 75%, transparent), transparent 70%)`,
                    }}
                  />
                  <div className="relative">
                    <div
                      className="mb-5 flex size-11 items-center justify-center rounded-2xl text-foreground/90"
                      style={{
                        background: `linear-gradient(135deg, color-mix(in oklab, var(--aurora-${f.tone}) 45%, transparent), color-mix(in oklab, var(--aurora-pink) 22%, transparent))`,
                        boxShadow: "inset 0 1px 0 color-mix(in oklab, white 30%, transparent)",
                      }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-28 sm:mt-36">
          <div className="aurora-panel relative overflow-hidden p-8 sm:p-12">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full opacity-60 blur-3xl"
              style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--aurora-pink) 70%, transparent), transparent 70%)" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -left-20 bottom-[-100px] size-80 rounded-full opacity-50 blur-3xl"
              style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--aurora-cyan) 70%, transparent), transparent 70%)" }}
            />
            <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <Mascot variant="celebrate" size={110} glow className="shrink-0 animate-[float_4s_ease-in-out_infinite]" />
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    Pronto pra subir o nível?
                  </h3>
                  <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                    Login com Discord. Configuração em minutos. Sem cartão de crédito.
                  </p>
                </div>
              </div>
              <a
                href="/api/auth/discord/login"
                onClick={startDiscordLogin}
                className="aurora-cta inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-background shadow-[0_14px_40px_-12px_color-mix(in_oklab,var(--aurora-pink)_70%,transparent)] transition hover:scale-[1.03]"
                style={{ background: "var(--gradient-aurora)" }}
              >
                <Wand2 className="size-4" />
                Adicionar Zenox
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span className="inline-flex items-center gap-1.5">
            Feito com <Heart className="size-3 text-[var(--aurora-pink)]" /> · © {new Date().getFullYear()} Zenox
          </span>
          <div className="flex items-center gap-4">
            <Link to="/comandos" className="hover:text-foreground">Comandos</Link>
            <Link to="/servidores" className="hover:text-foreground">Dashboard</Link>
            <a href="#modulos" className="hover:text-foreground">Módulos</a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function FloatingSparkles() {
  const sparkles = [
    { left: "8%", top: "18%", size: 14, delay: "0s", tone: "pink" },
    { left: "22%", top: "62%", size: 10, delay: "1.2s", tone: "cyan" },
    { left: "78%", top: "12%", size: 16, delay: "0.6s", tone: "lavender" },
    { left: "88%", top: "48%", size: 12, delay: "2s", tone: "mint" },
    { left: "55%", top: "82%", size: 14, delay: "1.6s", tone: "peach" },
    { left: "38%", top: "8%", size: 9, delay: "2.4s", tone: "pink" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="absolute animate-[twinkle_3.5s_ease-in-out_infinite]"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            color: `var(--aurora-${s.tone})`,
            filter: `drop-shadow(0 0 8px color-mix(in oklab, var(--aurora-${s.tone}) 80%, transparent))`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-full">
            <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
          </svg>
        </span>
      ))}
    </div>
  );
}
