import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Crown, ShieldCheck, Search, ArrowRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
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
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-6">
      <h1 className="text-xl font-semibold">Falha ao carregar o dashboard</h1>
      <pre className="max-w-2xl whitespace-pre-wrap rounded bg-card p-4 text-xs text-muted-foreground">
        {error instanceof Error ? `${error.name}: ${error.message}\n\n${error.stack ?? ""}` : String(error)}
      </pre>
      <div className="flex gap-2">
        <button onClick={reset} className="rounded-md border border-border px-3 py-1.5 text-sm">Tentar de novo</button>
        <a href="/login" className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">Logar novamente</a>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
});

function ServerPicker() {
  const { user } = Route.useLoaderData();
  const { data: guilds } = useSuspenseQuery({
    queryKey: ["my-guilds"],
    queryFn: () => listMyGuilds(),
  });

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "owner" | "manager">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guilds.filter((g) => {
      if (filter === "owner" && !g.owner) return false;
      if (filter === "manager" && g.owner) return false;
      if (q && !g.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [guilds, query, filter]);

  return (
    <div className="cyber-shell cyber-grid-bg min-h-screen bg-background text-foreground">
      <DashboardTopbar
        user={user}
        title="Seus servidores"
        subtitle="Apenas servidores onde você pode gerenciar configurações."
      />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {guilds.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Controls */}
            <section className="cyber-panel mb-6 rounded-xl p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar servidor..."
                  className="h-10 w-full rounded-lg border border-[var(--cyber-line)] bg-card/70 pl-9 pr-3 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-[var(--cyber-line)] bg-card/70 p-1">
                {(["all", "owner", "manager"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      filter === f
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "all" ? "Todos" : f === "owner" ? "Dono" : "Gerente"}
                  </button>
                ))}
              </div>
            </div>
            </section>

            <p className="font-display mb-4 text-xs uppercase text-muted-foreground">
              Mostrando {filtered.length} de {guilds.length} servidor
              {guilds.length === 1 ? "" : "es"}.
            </p>

            {filtered.length === 0 ? (
              <div className="cyber-panel rounded-xl border-dashed p-10 text-center text-sm text-muted-foreground">
                Nenhum servidor corresponde à busca.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((g) => (
                  <Link
                    key={g.id}
                    to="/dashboard/$guildId"
                    params={{ guildId: g.id }}
                    className="cyber-panel cyber-card-hover group relative flex items-center gap-3 overflow-hidden rounded-xl p-4"
                  >
                    <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 opacity-0 transition group-hover:from-primary/10 group-hover:to-purple-500/5 group-hover:opacity-100" />
                    {g.iconUrl ? (
                      <img
                        src={g.iconUrl}
                        alt=""
                          className="size-12 shrink-0 rounded-xl ring-1 ring-[var(--cyber-line)]"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-semibold text-primary ring-1 ring-primary/30">
                        {g.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-display truncate font-medium">{g.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        {g.owner ? (
                          <>
                            <Crown className="size-3 text-amber-400" /> Você é o dono
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="size-3" /> Pode gerenciar
                          </>
                        )}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
        <Plus className="size-6" />
      </div>
      <p className="text-base font-medium">Nenhum servidor gerenciável</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Você precisa ter <strong>Gerenciar Servidor</strong> ou <strong>Administrador</strong> em
        pelo menos um servidor onde o Zenox esteja (ou pode ser adicionado).
      </p>
    </div>
  );
}
