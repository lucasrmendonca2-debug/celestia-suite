import { createFileRoute, Outlet, Link, notFound } from "@tanstack/react-router";
import { ExternalLink, Bot, ArrowLeft } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { checkBotInGuild } from "@/lib/guild/bot-presence.functions";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guild = guilds.find((g) => g.id === params.guildId);
    if (!guild) throw notFound();

    const presence = await context.queryClient.ensureQueryData({
      queryKey: ["bot-presence", params.guildId],
      queryFn: () => checkBotInGuild({ data: { guildId: params.guildId } }),
      staleTime: 0,
    });

    return { user, guild, presence };
  },
  component: GuildLayout,
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

function GuildLayout() {
  const { guild, presence } = Route.useLoaderData();

  if (!presence.present) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
          <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <Bot className="size-6" />
          </div>
          <h1 className="text-lg font-semibold">Zenox ainda não está nesse servidor</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para configurar <strong>{guild.name}</strong>, adicione o Zenox primeiro. Depois é só
            voltar aqui — vai destravar sozinho.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href={presence.inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <ExternalLink className="size-4" />
              Adicionar ao servidor
            </a>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-accent"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
