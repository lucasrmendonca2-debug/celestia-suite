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
} from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { getGuildOverview } from "@/lib/guild/overview.functions";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guild = guilds.find((g) => g.id === params.guildId);
    if (!guild) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["guild-overview", params.guildId],
      queryFn: () => getGuildOverview({ data: { guildId: params.guildId } }),
      staleTime: 30_000,
    });
    return { user, guild };
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

  // Permissões críticas pra Saúde do bot
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

  // Checklist de configuração
  const checklist = [
    {
      key: "bot",
      ok: overview.bot.present,
      label: "Bot presente no servidor",
      to: null as string | null,
      cta: "",
    },
    {
      key: "logs",
      ok: overview.config.logsChannelSet,
      label: "Canal de logs configurado",
      to: `/dashboard/${guild.id}/logs`,
      cta: "Configurar logs",
    },
    {
      key: "welcome",
      ok: overview.config.welcomeEnabled && overview.config.welcomeChannelSet,
      label: "Boas-vindas configuradas",
      to: `/dashboard/${guild.id}/welcome`,
      cta: "Configurar boas-vindas",
    },
    {
      key: "tickets",
      ok: overview.config.ticketsEnabled && overview.config.ticketsConfigured,
      label: "Tickets configurados",
      to: `/dashboard/${guild.id}/tickets`,
      cta: "Configurar tickets",
    },
    {
      key: "moderation",
      ok: overview.config.moderationConfigured,
      label: "Moderação ativada",
      to: `/dashboard/${guild.id}/moderation`,
      cta: "Configurar moderação",
    },
    {
      key: "economy",
      ok: overview.config.economyEnabled,
      label: "Economia ativada",
      to: `/dashboard/${guild.id}/economy`,
      cta: "Configurar economia",
    },
    {
      key: "permissions",
      ok: overview.bot.isAdmin || missing.length === 0,
      label: "Permissões do bot revisadas",
      to: null,
      cta: "",
    },
  ];

  const done = checklist.filter((c) => c.ok).length;
  const total = checklist.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar guildId={guild.id} />
      <div className="flex-1">
        <DashboardTopbar
          user={user}
          title={displayName}
          subtitle={guild.owner ? "Dono do servidor" : "Pode gerenciar configurações"}
          guildId={guild.id}
        />

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          {/* Header do servidor */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {displayIcon ? (
                  <img
                    src={displayIcon}
                    alt=""
                    className="size-14 shrink-0 rounded-2xl ring-1 ring-border sm:size-16"
                  />
                ) : (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-base font-semibold text-primary ring-1 ring-primary/30 sm:size-16">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold sm:text-xl">{displayName}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>ID {guild.id}</span>
                    {overview.discord.memberCount != null && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" />
                        {fmt.format(overview.discord.memberCount)} membros
                      </span>
                    )}
                    {overview.discord.presenceCount != null && (
                      <span className="inline-flex items-center gap-1">
                        <Activity className="size-3 text-emerald-500" />
                        {fmt.format(overview.discord.presenceCount)} online
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <BotStatusBadge present={overview.bot.present} />
              </div>
            </div>
          </section>

          {/* Métricas reais */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Sparkles className="size-4" />}
              label="Módulos ativos"
              value={`${overview.counts.activeModules}/6`}
              hint="Welcome, logs, tickets, moderação, economia e level"
            />
            <StatCard
              icon={<Ticket className="size-4" />}
              label="Tickets abertos"
              value={fmt.format(overview.counts.openTickets)}
              hint="Atendimentos em andamento agora"
            />
            <StatCard
              icon={<Shield className="size-4" />}
              label="Punições (7 dias)"
              value={fmt.format(overview.counts.modCases7d)}
              hint="Warn, mute, kick e ban registrados"
            />
            <StatCard
              icon={<ScrollText className="size-4" />}
              label="Comandos custom"
              value={fmt.format(overview.counts.customCommands)}
              hint="Criados no dashboard"
            />
          </section>

          {/* Checklist + Saúde do bot */}
          <section className="grid gap-4 lg:grid-cols-5">
            {/* Checklist */}
            <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Configuração inicial</h3>
                  <p className="text-xs text-muted-foreground">
                    {done} de {total} prontos
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {pct}%
                </span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {item.ok ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={`truncate text-sm ${
                          item.ok ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {!item.ok && item.to && (
                      <Link
                        to={item.to}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-input bg-card px-2.5 py-1 text-xs font-medium transition hover:bg-accent"
                      >
                        {item.cta}
                        <ArrowRight className="size-3" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Saúde do bot */}
            <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <HeartPulse className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Saúde do bot</h3>
              </div>

              {!overview.bot.present ? (
                <HealthRow tone="error" text="O bot não está no servidor." />
              ) : overview.bot.isAdmin ? (
                <HealthRow
                  tone="ok"
                  text="Bot é administrador. Todas as ações estão liberadas."
                />
              ) : (
                <div className="space-y-1.5">
                  {critical.map((p) => (
                    <HealthRow
                      key={p.key}
                      tone={p.ok ? "ok" : "warn"}
                      text={
                        p.ok
                          ? `OK — ${p.label.toLowerCase()}`
                          : `Faltando: ${p.label.toLowerCase()}`
                      }
                    />
                  ))}
                  {missing.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Ajuste as permissões do cargo do bot no Discord para destravar todos os
                      recursos.
                    </p>
                  )}
                </div>
              )}

              {overview.bot.present && overview.bot.highestRolePosition > 0 && (
                <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  <Bot className="mr-1 inline size-3" />
                  Cargo mais alto do bot: posição {overview.bot.highestRolePosition}. Para
                  entregar cargos VIP, o cargo do bot precisa estar acima deles.
                </p>
              )}
            </div>
          </section>

          {/* Atalhos rápidos */}
          <section>
            <div className="mb-3">
              <h3 className="text-sm font-semibold">Atalhos rápidos</h3>
              <p className="text-xs text-muted-foreground">
                Tudo salvo aqui é lido em tempo real pelo bot.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <QuickAction
                to={`/dashboard/${guild.id}/welcome`}
                icon={<Sparkles className="size-4" />}
                title="Boas-vindas"
                desc="Mensagem e embed para novos membros."
              />
              <QuickAction
                to={`/dashboard/${guild.id}/logs`}
                icon={<ScrollText className="size-4" />}
                title="Logs"
                desc="Acompanhe tudo que acontece no servidor."
              />
              <QuickAction
                to={`/dashboard/${guild.id}/tickets`}
                icon={<Ticket className="size-4" />}
                title="Tickets"
                desc="Painel de atendimento profissional."
              />
              <QuickAction
                to={`/dashboard/${guild.id}/moderation`}
                icon={<Shield className="size-4" />}
                title="Moderação"
                desc="Warns, mutes, kicks e bans com histórico."
              />
              <QuickAction
                to={`/dashboard/${guild.id}/economy`}
                icon={<Coins className="size-4" />}
                title="Economia"
                desc="Moeda, daily, work e loja de cargos."
              />
              <QuickAction
                to={`/dashboard/${guild.id}/social`}
                icon={<TrendingUp className="size-4" />}
                title="Social & Level"
                desc="XP, ranking e recompensas por nível."
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function BotStatusBadge({ present }: { present: boolean }) {
  if (present) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]" />
        Bot online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
      <AlertTriangle className="size-3" />
      Bot fora do servidor
    </span>
  );
}

function HealthRow({ tone, text }: { tone: "ok" | "warn" | "error"; text: string }) {
  const cfg =
    tone === "ok"
      ? { icon: CheckCircle2, color: "text-emerald-500" }
      : tone === "warn"
        ? { icon: AlertTriangle, color: "text-amber-500" }
        : { icon: AlertTriangle, color: "text-destructive" };
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`size-4 shrink-0 ${cfg.color}`} />
      <span className="text-foreground/90">{text}</span>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-accent"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
