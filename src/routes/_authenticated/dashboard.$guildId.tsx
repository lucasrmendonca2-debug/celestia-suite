import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Hash, Users } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

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

          <section className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-8 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Edição de módulos chegando na próxima onda</p>
            <p className="mt-1">
              Boas-vindas, AutoMod, Economia, Level, Logs e Tickets — tudo configurável aqui,
              salvando direto no MongoDB que o bot já lê. Por enquanto a Onda 2 entrega o login,
              a lista de servidores e o shell do dashboard.
            </p>
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
