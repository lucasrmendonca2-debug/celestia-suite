import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Crown, ShieldCheck, Search, ArrowRight, Plus, Server, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { buildGuildSlug } from "@/lib/guild/slug";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Mascot } from "@/components/Mascot";
import { AuroraStatCard } from "@/components/dashboard/aurora-ui";

export const Route = createFileRoute("/_authenticated/servidores")({
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
    <div className="aurora-shell flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-foreground">
      <Mascot variant="error" size={140} glow />
      <h1 className="font-display text-xl font-bold">Falha ao carregar o dashboard</h1>
      <pre className="aurora-panel max-w-2xl whitespace-pre-wrap p-4 text-xs text-muted-foreground">
        {error instanceof Error ? `${error.name}: ${error.message}` : String(error)}
      </pre>
      <div className="flex gap-2">
        <button onClick={reset} className="rounded-xl border border-border bg-card/60 px-4 py-2 text-sm backdrop-blur transition hover:bg-accent/50">Tentar de novo</button>
        <a href="/entrar" className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90">Logar novamente</a>
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

  const ownerCount = guilds.filter((g) => g.owner).length;

  return (
    <div className="aurora-shell min-h-screen text-foreground">
      <DashboardTopbar
        user={user}
        title="Seus servidores"
        subtitle="Apenas servidores onde você pode gerenciar configurações."
      />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {guilds.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Hero banner */}
            <section className="aurora-panel relative mb-6 overflow-hidden p-5 sm:p-7">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full blur-3xl opacity-60"
                style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--aurora-pink) 70%, transparent), transparent 70%)" }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -left-24 bottom-[-60px] size-80 rounded-full blur-3xl opacity-50"
                style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--aurora-lavender) 70%, transparent), transparent 70%)" }}
              />
              <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
                    <Sparkles className="size-3" /> Olá, {user.username ?? "viajante"}
                  </span>
                  <h1 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    Escolha um servidor pra ✨ encantar
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tudo que você configurar aqui aparece no Discord em segundos.
                  </p>
                </div>
                <Mascot variant="celebrate" size={120} glow className="shrink-0" />
              </div>
            </section>

            {/* Stats */}
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <AuroraStatCard label="Servidores" value={guilds.length} icon={Server} tone="lavender" hint="Onde você manda" />
              <AuroraStatCard label="Donos" value={ownerCount} icon={Crown} tone="peach" hint="Cabeça da operação" />
              <AuroraStatCard label="Gerenciados" value={guilds.length - ownerCount} icon={ShieldCheck} tone="mint" hint="Com permissão" />
            </div>

            {/* Controls */}
            <section className="aurora-panel mb-6 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar servidor..."
                    className="h-10 w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 text-sm outline-none backdrop-blur transition focus:border-[color:color-mix(in_oklab,var(--aurora-pink)_50%,var(--border))] focus:ring-2 focus:ring-[color:color-mix(in_oklab,var(--aurora-pink)_30%,transparent)]"
                  />
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background/60 p-1 backdrop-blur">
                  {(["all", "owner", "manager"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        filter === f
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f === "all" ? "Todos" : f === "owner" ? "Dono" : "Gerente"}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <p className="font-display mb-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Mostrando {filtered.length} de {guilds.length} servidor
              {guilds.length === 1 ? "" : "es"}
            </p>

            {filtered.length === 0 ? (
              <div className="aurora-panel flex flex-col items-center justify-center gap-3 p-10 text-center">
                <Mascot variant="sleeping" size={100} />
                <p className="text-sm text-muted-foreground">Nenhum servidor corresponde à busca.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((g, i) => {
                  const tones = ["lavender", "pink", "cyan", "mint", "peach"] as const;
                  const tone = tones[i % tones.length];
                  return (
                    <Link
                      key={g.id}
                      to="/dashboard/$slug"
                      params={{ slug: buildGuildSlug(g) }}
                      className="aurora-panel aurora-card-hover group relative flex items-center gap-3 overflow-hidden p-4"
                      style={{
                        background: `linear-gradient(160deg, color-mix(in oklab, var(--aurora-${tone}) 14%, var(--card)), color-mix(in oklab, var(--card) 70%, transparent))`,
                      }}
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full blur-2xl opacity-50 transition-transform duration-500 group-hover:scale-125"
                        style={{ background: `radial-gradient(circle, color-mix(in oklab, var(--aurora-${tone}) 75%, transparent), transparent 70%)` }}
                      />
                      <div className="relative">
                        {g.iconUrl ? (
                          <img
                            src={g.iconUrl}
                            alt=""
                            className="size-12 shrink-0 rounded-2xl ring-2 ring-background/40"
                          />
                        ) : (
                          <div
                            className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-foreground/90 ring-2 ring-background/40"
                            style={{ background: `linear-gradient(135deg, color-mix(in oklab, var(--aurora-${tone}) 60%, transparent), color-mix(in oklab, var(--aurora-pink) 30%, transparent))` }}
                          >
                            {g.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="relative min-w-0 flex-1">
                        <p className="font-display truncate font-semibold">{g.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          {g.owner ? (
                            <>
                              <Crown className="size-3 text-amber-500" /> Você é o dono
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="size-3" /> Pode gerenciar
                            </>
                          )}
                        </p>
                      </div>
                      <ArrowRight className="relative size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
                  );
                })}
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
    <div className="aurora-panel mx-auto mt-10 flex max-w-md flex-col items-center p-10 text-center">
      <Mascot variant="sleeping" size={140} glow />
      <div className="mt-4 inline-flex size-12 items-center justify-center rounded-2xl bg-[color:color-mix(in_oklab,var(--aurora-pink)_25%,transparent)] text-foreground/90 ring-1 ring-[color:color-mix(in_oklab,var(--aurora-pink)_40%,transparent)]">
        <Plus className="size-6" />
      </div>
      <p className="font-display mt-3 text-base font-semibold">Nenhum servidor gerenciável</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Você precisa ter <strong>Gerenciar Servidor</strong> ou <strong>Administrador</strong> em
        pelo menos um servidor onde o Zenox esteja (ou possa ser adicionado).
      </p>
    </div>
  );
}
