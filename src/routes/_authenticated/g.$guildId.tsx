import { createFileRoute, Outlet, Link, notFound } from "@tanstack/react-router";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { checkBotInGuild } from "@/lib/guild/bot-presence.functions";
import { Mascot } from "@/components/Mascot";
import { MagicLoader } from "@/components/MagicLoader";

export const Route = createFileRoute("/_authenticated/g/$guildId")({
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
  pendingComponent: () => <MagicLoader label="Convocando o Zenox…" />,
  component: GuildLayout,
  notFoundComponent: () => (
    <div className="aurora-shell flex min-h-screen items-center justify-center px-6">
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <Mascot variant="404" size={160} glow />
        <p className="mt-4 font-display text-xl font-bold">Servidor não encontrado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Você não tem permissão de gerenciar esse servidor.
        </p>
        <Link
          to="/servidores"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          <ArrowLeft className="size-4" />
          Voltar pra lista
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="aurora-shell flex min-h-screen items-center justify-center px-6">
      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <Mascot variant="error" size={160} glow />
        <p className="mt-4 font-display text-xl font-bold">Algo deu errado</p>
        <p className="mt-1 text-sm text-muted-foreground break-words">
          {error instanceof Error ? error.message : "Erro desconhecido."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Tentar de novo
          </button>
          <Link
            to="/servidores"
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-accent/50"
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  ),
});

function GuildLayout() {
  const { guild, presence } = Route.useLoaderData();

  if (!presence.present) {
    return (
      <div className="aurora-shell flex min-h-screen items-center justify-center px-6">
        <div className="aurora-panel relative z-10 w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-2 flex justify-center">
            <Mascot variant="sleeping" size={128} glow />
          </div>
          <h1 className="font-display text-lg font-bold">
            Zenox ainda não está nesse servidor
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para configurar <strong>{guild.name}</strong>, adicione o Zenox primeiro. Depois é
            só voltar aqui — vai destravar sozinho.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href={presence.inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
            >
              <ExternalLink className="size-4" />
              Adicionar ao servidor
            </a>
            <Link
              to="/servidores"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-accent/50"
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
