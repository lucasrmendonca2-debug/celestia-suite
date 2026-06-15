import { createFileRoute, Outlet, Link, notFound } from "@tanstack/react-router";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";

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
  component: () => <Outlet />,
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
