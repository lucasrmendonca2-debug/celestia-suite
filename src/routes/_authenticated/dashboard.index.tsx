import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Crown, ShieldCheck } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  loader: async ({ context }) => {
    const [user, guilds] = await Promise.all([
      requireUser(),
      context.queryClient.ensureQueryData({
        queryKey: ["my-guilds"],
        queryFn: () => listMyGuilds(),
      }),
    ]);
    return { user, guildsCount: guilds.length };
  },
  component: ServerPicker,
});

function ServerPicker() {
  const { user } = Route.useLoaderData();
  const { data: guilds } = useSuspenseQuery({
    queryKey: ["my-guilds"],
    queryFn: () => listMyGuilds(),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardTopbar
        user={user}
        title="Seus servidores"
        subtitle="Mostrando apenas servidores onde você pode gerenciar configurações."
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {guilds.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {guilds.length} servidor{guilds.length === 1 ? "" : "es"} disponível
              {guilds.length === 1 ? "" : "is"}.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guilds.map((g) => (
                <Link
                  key={g.id}
                  to="/dashboard/$guildId"
                  params={{ guildId: g.id }}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 hover:bg-card/80"
                >
                  <div className="flex items-center gap-3">
                    {g.iconUrl ? (
                      <img
                        src={g.iconUrl}
                        alt=""
                        className="size-12 rounded-xl ring-1 ring-border"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-sm font-semibold text-primary ring-1 ring-primary/30">
                        {g.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{g.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        {g.owner ? (
                          <>
                            <Crown className="size-3" /> Você é o dono
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="size-3" /> Pode gerenciar
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <p className="text-base font-medium">Nenhum servidor gerenciável</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Você precisa ter <strong>Gerenciar Servidor</strong> ou <strong>Administrador</strong> em
        pelo menos um servidor onde o Zenox esteja (ou pode ser adicionado).
      </p>
    </div>
  );
}
