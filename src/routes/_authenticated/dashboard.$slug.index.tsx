import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Users,
  Ticket,
  Shield,
  Sparkles,
  ScrollText,
  TrendingUp,
  Coins,
  Activity,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  HeartPulse,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { getGuildOverview } from "@/lib/guild/overview.functions";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Mascot } from "@/components/Mascot";
import { resolveGuildIdFromSlug, buildGuildSlug } from "@/lib/guild/slug";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    const guild = guilds.find((g) => g.id === guildId);
    if (!guild) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["guild-overview", guildId],
      queryFn: () => getGuildOverview({ data: { guildId: guildId } }),
      staleTime: 30_000,
    });
    return { guildId, user, guild };
  },
  component: GuildOverviewPage,
});

const fmt = new Intl.NumberFormat("pt-BR");

function GuildOverviewPage() {
  const { user, guild } = Route.useLoaderData();
  const { data: overview } = useSuspenseQuery({
    queryKey: ["guild-overview", guild.id],
    queryFn: () => getGuildOverview({ data: { guildId: guild.id } }),
    staleTime: 30_000,
  });

  const displayIcon = overview.discord.iconUrl ?? guild.iconUrl ?? null;
  const displayName = overview.discord.name || guild.name;

  const criticalKeys = [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "MANAGE_CHANNELS",
    "MANAGE_ROLES",
    "MANAGE_MESSAGES",
    "MODERATE_MEMBERS",
  ] as const;
  const critical = overview.bot.permissions.filter((p) =>
    (criticalKeys as readonly string[]).includes(p.key),
  );
  const missing = critical.filter((p) => !p.ok);

  const checklist = [
    { key: "bot", ok: overview.bot.present, label: "Bot presente no servidor", to: null, cta: "" },
    { key: "logs", ok: overview.config.logsChannelSet, label: "Canal de logs configurado", to: `/dashboard/${slug}/logs`, cta: "Configurar" },
    { key: "welcome", ok: overview.config.welcomeEnabled && overview.config.welcomeChannelSet, label: "Boas-vindas ativas", to: `/dashboard/${slug}/boas-vindas`, cta: "Configurar" },
    { key: "tickets", ok: overview.config.ticketsEnabled && overview.config.ticketsConfigured, label: "Tickets configurados", to: `/dashboard/${slug}/tickets`, cta: "Configurar" },
    { key: "moderation", ok: overview.config.moderationConfigured, label: "Moderação ativada", to: `/dashboard/${slug}/moderacao`, cta: "Configurar" },
    { key: "economy", ok: overview.config.economyEnabled, label: "Economia ativada", to: `/dashboard/${slug}/economia`, cta: "Configurar" },
    { key: "permissions", ok: overview.bot.isAdmin || missing.length === 0, label: "Permissões do bot ok", to: null, cta: "" },
  ];

  const done = checklist.filter((c) => c.ok).length;
  const total = checklist.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="aurora-shell flex min-h-screen text-foreground">
      <DashboardSidebar guildId={guild.id} />
      <div className="relative z-10 flex-1">
        <DashboardTopbar
          user={user}
          title={displayName}
          subtitle={guild.owner ? "Dono do servidor" : "Permissão de gerenciar"}
          guildId={guild.id}
        />

        <main className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
          {/* Hero do servidor */}
          <section className="aurora-panel relative overflow-hidden p-6 sm:p-8">
            <div
              aria-hidden
              className="absolute -right-10 -top-10 size-64 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--aurora-pink) 70%, transparent), transparent 70%)",
              }}
            />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-5">
                {displayIcon ? (
                  <img
                    src={displayIcon}
                    alt=""
                    className="size-20 shrink-0 rounded-3xl ring-2 ring-[color-mix(in_oklab,var(--aurora-lavender)_55%,transparent)]"
                  />
                ) : (
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-[color-mix(in_oklab,var(--aurora-lavender)_25%,transparent)] font-display text-xl font-bold ring-2 ring-[color-mix(in_oklab,var(--aurora-lavender)_55%,transparent)]">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-display mb-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <Sparkles className="size-3 text-[var(--aurora-pink)]" /> visão geral
                  </p>
                  <h2 className="font-display truncate text-2xl font-bold sm:text-3xl">
                    {displayName}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">ID {guild.id}</span>
                    {overview.discord.memberCount != null && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" />
                        {fmt.format(overview.discord.memberCount)} membros
                      </span>
                    )}
                    {overview.discord.presenceCount != null && (
                      <span className="inline-flex items-center gap-1">
                        <span className="aurora-glow-dot size-1.5 rounded-full" />
                        {fmt.format(overview.discord.presenceCount)} online
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <BotStatusBadge present={overview.bot.present} />
            </div>
          </section>

          {/* Métricas */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Sparkles}
              tone="lavender"
              label="Módulos ativos"
              value={`${overview.counts.activeModules}/6`}
              hint="Welcome · logs · tickets · mod · economia · level"
            />
            <StatCard
              icon={Ticket}
              tone="cyan"
              label="Tickets abertos"
              value={fmt.format(overview.counts.openTickets)}
              hint="Em atendimento agora"
            />
            <StatCard
              icon={Shield}
              tone="pink"
              label="Punições (7d)"
              value={fmt.format(overview.counts.modCases7d)}
              hint="Warn · mute · kick · ban"
            />
            <StatCard
              icon={ScrollText}
              tone="mint"
              label="Comandos custom"
              value={fmt.format(overview.counts.customCommands)}
              hint="Criados no dashboard"
            />
          </section>

          {/* Checklist + Saúde */}
          <section className="grid gap-4 lg:grid-cols-5">
            <div className="aurora-panel p-6 lg:col-span-3">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold">Configuração inicial</h3>
                  <p className="text-xs text-muted-foreground">
                    {done} de {total} prontos
                  </p>
                </div>
                <span
                  className="font-display rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs font-semibold backdrop-blur"
                  style={{ color: "var(--aurora-deep)" }}
                >
                  {pct}%
                </span>
              </div>
              <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: "var(--gradient-aurora)",
                    boxShadow: "0 0 16px color-mix(in oklab, var(--aurora-pink) 60%, transparent)",
                  }}
                />
              </div>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li
                    key={item.key}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/40 px-4 py-3 backdrop-blur transition hover:border-[color-mix(in_oklab,var(--aurora-lavender)_50%,transparent)] hover:bg-[color-mix(in_oklab,var(--aurora-lavender)_8%,transparent)]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {item.ok ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={`truncate text-sm ${item.ok ? "text-foreground" : "text-muted-foreground"}`}>
                        {item.label}
                      </span>
                    </div>
                    {!item.ok && item.to && (
                      <Link
                        to={item.to}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium transition group-hover:border-[color-mix(in_oklab,var(--aurora-pink)_55%,transparent)] group-hover:bg-[color-mix(in_oklab,var(--aurora-pink)_15%,transparent)]"
                      >
                        {item.cta}
                        <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="aurora-panel p-6 lg:col-span-2">
              <div className="mb-5 flex items-center gap-2">
                <HeartPulse className="size-4 text-[var(--aurora-pink)]" />
                <h3 className="font-display text-base font-bold">Saúde do bot</h3>
              </div>

              {!overview.bot.present ? (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <Mascot variant="error" size={88} />
                  <HealthRow tone="error" text="O bot não está no servidor." />
                </div>
              ) : overview.bot.isAdmin ? (
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <Mascot variant="celebrate" size={88} />
                  <HealthRow tone="ok" text="Bot é administrador. Tudo liberado." />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {critical.map((p) => (
                    <HealthRow
                      key={p.key}
                      tone={p.ok ? "ok" : "warn"}
                      text={p.ok ? `OK — ${p.label.toLowerCase()}` : `Faltando: ${p.label.toLowerCase()}`}
                    />
                  ))}
                  {missing.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Ajuste as permissões do cargo do bot no Discord para destravar tudo.
                    </p>
                  )}
                </div>
              )}

              {overview.bot.present && overview.bot.highestRolePosition > 0 && (
                <p className="mt-4 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <Bot className="mr-1 inline size-3" />
                  Cargo mais alto: posição {overview.bot.highestRolePosition}. Pra entregar VIP, o cargo do bot precisa estar acima.
                </p>
              )}
            </div>
          </section>

          {/* Atalhos */}
          <section>
            <div className="mb-4">
              <h3 className="font-display text-base font-bold">Atalhos rápidos</h3>
              <p className="text-xs text-muted-foreground">Toda alteração é lida ao vivo pelo bot.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <QuickAction to={`/dashboard/${slug}/boas-vindas`} icon={Sparkles} tone="lavender" title="Boas-vindas" desc="Mensagem e embed para novos." />
              <QuickAction to={`/dashboard/${slug}/logs`} icon={ScrollText} tone="cyan" title="Logs" desc="Tudo que acontece no servidor." />
              <QuickAction to={`/dashboard/${slug}/tickets`} icon={Ticket} tone="pink" title="Tickets" desc="Painel de atendimento." />
              <QuickAction to={`/dashboard/${slug}/moderacao`} icon={Shield} tone="mint" title="Moderação" desc="Warns, mutes, kicks e bans." />
              <QuickAction to={`/dashboard/${slug}/economia`} icon={Coins} tone="peach" title="Economia" desc="Moeda, daily, work, loja." />
              <QuickAction to={`/dashboard/${slug}/social`} icon={TrendingUp} tone="lavender" title="Social & Level" desc="XP, ranking, recompensas." />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

type Tone = "lavender" | "cyan" | "pink" | "mint" | "peach";
const TONE_BG: Record<Tone, string> = {
  lavender: "var(--aurora-lavender)",
  cyan: "var(--aurora-cyan)",
  pink: "var(--aurora-pink)",
  mint: "var(--aurora-mint)",
  peach: "var(--aurora-peach)",
};

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="aurora-panel aurora-card-hover relative overflow-hidden p-5">
      <div
        aria-hidden
        className="absolute -right-6 -top-6 size-20 rounded-full opacity-40 blur-2xl"
        style={{ background: `color-mix(in oklab, ${TONE_BG[tone]} 60%, transparent)` }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{
              background: `color-mix(in oklab, ${TONE_BG[tone]} 22%, transparent)`,
              color: "var(--foreground)",
            }}
          >
            <Icon className="size-3.5" />
          </div>
          <span className="font-display">{label}</span>
        </div>
        <p className="font-display mt-3 text-3xl font-bold tabular-nums tracking-tight">
          {value}
        </p>
        {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function BotStatusBadge({ present }: { present: boolean }) {
  if (present) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="aurora-glow-dot size-1.5 rounded-full" />
        Bot online
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
      <AlertTriangle className="size-3" />
      Bot fora do servidor
    </span>
  );
}

function HealthRow({ tone, text }: { tone: "ok" | "warn" | "error"; text: string }) {
  const cfg =
    tone === "ok"
      ? { Icon: CheckCircle2, color: "text-emerald-500" }
      : tone === "warn"
        ? { Icon: AlertTriangle, color: "text-amber-500" }
        : { Icon: AlertTriangle, color: "text-destructive" };
  const Icon = cfg.Icon;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`size-4 shrink-0 ${cfg.color}`} />
      <span className="text-foreground/90">{text}</span>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  tone,
  title,
  desc,
}: {
  to: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="aurora-panel aurora-card-hover group relative flex items-start gap-3 overflow-hidden p-5"
    >
      <div
        aria-hidden
        className="absolute -right-4 -top-4 size-16 rounded-full opacity-0 blur-2xl transition group-hover:opacity-60"
        style={{ background: `color-mix(in oklab, ${TONE_BG[tone]} 60%, transparent)` }}
      />
      <div
        className="relative flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `color-mix(in oklab, ${TONE_BG[tone]} 25%, transparent)`,
          boxShadow: `inset 0 1px 0 color-mix(in oklab, white 25%, transparent)`,
        }}
      >
        <Icon className="size-4" />
      </div>
      <div className="relative min-w-0 flex-1">
        <p className="font-display text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="relative size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
