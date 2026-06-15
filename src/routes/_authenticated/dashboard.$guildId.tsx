import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Hash,
  Users,
  Shield,
  Coins,
  TrendingUp,
  Sparkles,
  ScrollText,
  Lock,
  UserPlus,
  Smile,
  Terminal,
  FileCode2,
} from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { ModuleCard } from "@/components/dashboard/ModuleCard";


export const Route = createFileRoute("/_authenticated/dashboard/$guildId")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guild = guilds.find((g) => g.id === params.guildId);
    if (!guild) throw notFound();
    return { user, guild };
  },
  component: GuildOverview,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background text-center">
      <div>
        <p className="text-lg font-semibold">Servidor não encontrado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Você não tem permissão de gerenciar esse servidor.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Voltar pra lista
        </Link>
      </div>
    </div>
  ),
});

function GuildOverview() {
  const { user, guild } = Route.useLoaderData();
  // Mantém o cache de guilds fresco caso o usuário navegue voltando.
  useSuspenseQuery({ queryKey: ["my-guilds"], queryFn: () => listMyGuilds() });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar guildId={guild.id} />
      <div className="flex-1">
        <DashboardTopbar
          user={user}
          title={guild.name}
          subtitle={guild.owner ? "Dono do servidor" : "Pode gerenciar configurações"}
        />

        <main className="mx-auto max-w-5xl px-6 py-8">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              {guild.iconUrl ? (
                <img
                  src={guild.iconUrl}
                  alt=""
                  className="size-16 rounded-2xl ring-1 ring-border"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-lg font-semibold text-primary ring-1 ring-primary/30">
                  {guild.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">{guild.name}</h2>
                <p className="text-xs text-muted-foreground">ID: {guild.id}</p>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={<Hash className="size-4" />} label="Status do bot" value="Conectado" hint="ws atualizado em breve" />
            <StatCard icon={<Users className="size-4" />} label="Plano" value={guild.owner ? "Padrão" : "Padrão"} hint="Premium em breve" />
            <StatCard label="Configurações salvas" value="—" hint="Disponível na Onda 3" />
          </section>

          <section className="mt-8">
            <div className="mb-3">
              <h3 className="text-base font-semibold">Módulos</h3>
              <p className="text-xs text-muted-foreground">
                Configure cada sistema do bot. Tudo salvo aqui é lido em tempo real pelo bot.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ModuleCard to="/dashboard/$guildId/welcome" params={{ guildId: guild.id }} icon={Sparkles} title="Boas-vindas" description="Mensagem de entrada com variáveis e embed personalizável." />
              <ModuleCard to="/dashboard/$guildId/logs" params={{ guildId: guild.id }} icon={ScrollText} title="Logs" description="Canal de logs + toggle por evento (mensagens, membros, canais, cargos)." />
              <ModuleCard to="/dashboard/$guildId/autorole" params={{ guildId: guild.id }} icon={UserPlus} title="Autorole" description="Cargos atribuídos automaticamente a novos membros e bots." />
              <ModuleCard to="/dashboard/$guildId/reaction-roles" params={{ guildId: guild.id }} icon={Smile} title="Cargos por reação" description="Membros pegam cargos reagindo a mensagens do bot." />
              <ModuleCard to="/dashboard/$guildId/moderation" params={{ guildId: guild.id }} icon={Shield} title="Moderação" description="Histórico de warns, mutes, kicks e bans com casos numerados." />
              <ModuleCard to="/dashboard/$guildId/automod" params={{ guildId: guild.id }} icon={Lock} title="AutoMod" description="Anti-spam, anti-link, anti-invite, caps, mentions e blacklist." />
              <ModuleCard to="/dashboard/$guildId/leveling" params={{ guildId: guild.id }} icon={TrendingUp} title="Níveis & XP" description="XP por mensagem, ranking, mensagem de level up e cargos por nível." />
              <ModuleCard to="/dashboard/$guildId/economy" params={{ guildId: guild.id }} icon={Coins} title="Economia" description="Moeda própria, daily, work, loja de cargos e inventário." />
              <ModuleCard to="/dashboard/$guildId/commands" params={{ guildId: guild.id }} icon={Terminal} title="Comandos custom" description="Crie /comandos próprios com texto, embed ou ações." />
              <ModuleCard to="/dashboard/$guildId/embeds" params={{ guildId: guild.id }} icon={FileCode2} title="Embeds" description="Editor visual de embeds reutilizáveis com preview ao vivo." />
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
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
