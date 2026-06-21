import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Crown, ShieldCheck, Search, ArrowRight, Plus, Server, Sparkles, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { buildGuildSlug } from "@/lib/guild/slug";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { Mascot } from "@/components/Mascot";

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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#FBF7FF] p-6 font-['Inter'] text-[#1B0E3B]">
      <Mascot variant="error" size={140} glow />
      <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold">Falha ao carregar o dashboard</h1>
      <pre className="max-w-2xl whitespace-pre-wrap rounded-2xl border-2 border-[#1B0E3B] bg-white p-4 text-xs text-[#5B4B7A] shadow-[0_4px_0_0_#1B0E3B]">
        {error instanceof Error ? `${error.name}: ${error.message}` : String(error)}
      </pre>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="rounded-full border-2 border-[#1B0E3B] bg-white px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-[#1B0E3B] shadow-[0_4px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
        >
          Tentar de novo
        </button>
        <a
          href="/entrar"
          className="rounded-full border-2 border-[#1B0E3B] bg-[#7C3AED] px-5 py-2.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_4px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
        >
          Logar novamente
        </a>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
});

type Tone = "purple" | "pink" | "sun" | "mint" | "sky" | "coral";

const TONE: Record<Tone, { bg: string; soft: string; text: string }> = {
  purple: { bg: "bg-[#7C3AED]", soft: "bg-[#EDE3FF]", text: "text-[#7C3AED]" },
  pink: { bg: "bg-[#EC4899]", soft: "bg-[#FFE4F1]", text: "text-[#EC4899]" },
  sun: { bg: "bg-[#FBBF24]", soft: "bg-[#FFF3D1]", text: "text-[#B45309]" },
  mint: { bg: "bg-[#10D9A0]", soft: "bg-[#D6FBEC]", text: "text-[#047857]" },
  sky: { bg: "bg-[#38BDF8]", soft: "bg-[#DCF3FF]", text: "text-[#0369A1]" },
  coral: { bg: "bg-[#FB7185]", soft: "bg-[#FFE0E5]", text: "text-[#BE123C]" },
};

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
    <div className="relative min-h-dvh overflow-hidden bg-[#FBF7FF] font-['Inter'] text-[#1B0E3B] selection:bg-[#7C3AED] selection:text-white">
      {/* Floating blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 size-80 rounded-full bg-[#7C3AED]/20 blur-3xl" />
        <div className="absolute -right-20 top-1/3 size-96 rounded-full bg-[#EC4899]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-[#FBBF24]/25 blur-3xl" />
      </div>

      <DashboardTopbar
        user={user}
        title="Seus servidores"
        subtitle="Apenas servidores onde você pode gerenciar configurações."
      />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {guilds.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Hero banner */}
            <section className="relative mb-8">
              <div className="absolute inset-0 -z-10 translate-x-2 translate-y-2 rounded-[2rem] bg-[#1B0E3B]" />
              <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#1B0E3B] bg-gradient-to-br from-[#FFE4F1] via-[#F1E9FF] to-[#FFF3D1] p-6 shadow-[0_6px_0_0_#1B0E3B] sm:p-8">
                <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_2px_0_0_#1B0E3B]">
                      <Sparkles className="size-3" /> Olá, {user.username ?? "viajante"}
                    </span>
                    <h1 className="mt-3 font-['Plus_Jakarta_Sans'] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                      Escolha um servidor pra{" "}
                      <span className="relative inline-block">
                        <span className="relative z-10">encantar</span>
                        <span aria-hidden className="absolute -bottom-1 left-0 -z-0 h-2.5 w-full -rotate-1 rounded-full bg-[#FBBF24]" />
                      </span>
                      .
                    </h1>
                    <p className="mt-2 max-w-lg text-sm text-[#5B4B7A]">
                      Tudo que você configurar aqui aparece no Discord em segundos.
                    </p>
                  </div>
                  <Mascot variant="celebrate" size={120} glow className="shrink-0" />
                </div>
              </div>
            </section>

            {/* Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <ChunkyStat label="Servidores" value={guilds.length} icon={Server} tone="purple" hint="Onde você manda" />
              <ChunkyStat label="Donos" value={ownerCount} icon={Crown} tone="sun" hint="Cabeça da operação" />
              <ChunkyStat label="Gerenciados" value={guilds.length - ownerCount} icon={ShieldCheck} tone="mint" hint="Com permissão" />
            </div>

            {/* Controls */}
            <section className="mb-6 rounded-3xl border-2 border-[#1B0E3B] bg-white p-4 shadow-[0_4px_0_0_#1B0E3B]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5B4B7A]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar servidor..."
                    className="h-11 w-full rounded-full border-2 border-[#1B0E3B] bg-[#FBF7FF] pl-9 pr-3 text-sm font-semibold text-[#1B0E3B] outline-none transition placeholder:text-[#5B4B7A]/60 focus:bg-white focus:ring-2 focus:ring-[#EC4899]/40"
                  />
                </div>
                <div className="flex items-center gap-1 rounded-full border-2 border-[#1B0E3B] bg-[#FBF7FF] p-1">
                  {(["all", "owner", "manager"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider transition ${
                        filter === f
                          ? "bg-[#1B0E3B] text-white shadow-[0_2px_0_0_#1B0E3B]"
                          : "text-[#5B4B7A] hover:text-[#1B0E3B]"
                      }`}
                    >
                      {f === "all" ? "Todos" : f === "owner" ? "Dono" : "Gerente"}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <p className="mb-4 font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#5B4B7A]">
              Mostrando {filtered.length} de {guilds.length} servidor
              {guilds.length === 1 ? "" : "es"}
            </p>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-[#1B0E3B] bg-white p-10 text-center shadow-[0_4px_0_0_#1B0E3B]">
                <Mascot variant="sleeping" size={100} />
                <p className="text-sm font-semibold text-[#5B4B7A]">Nenhum servidor corresponde à busca.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((g, i) => {
                  const tones: Tone[] = ["purple", "pink", "sun", "mint", "sky", "coral"];
                  const tone = tones[i % tones.length];
                  const t = TONE[tone];
                  return (
                    <Link
                      key={g.id}
                      to="/dashboard/$slug"
                      params={{ slug: buildGuildSlug(g) }}
                      className="group relative flex items-center gap-3 overflow-hidden rounded-3xl border-2 border-[#1B0E3B] bg-white p-4 shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-1"
                    >
                      <span
                        aria-hidden
                        className={`pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-50 blur-2xl transition-transform duration-500 group-hover:scale-125 ${t.bg}`}
                      />
                      <div className="relative">
                        {g.iconUrl ? (
                          <img loading="lazy" decoding="async"
                            src={g.iconUrl}
                            alt=""
                            className="size-14 shrink-0 rounded-2xl border-2 border-[#1B0E3B]"
                          />
                        ) : (
                          <div
                            className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#1B0E3B] font-['Plus_Jakarta_Sans'] text-sm font-extrabold text-[#1B0E3B] ${t.soft}`}
                          >
                            {g.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="relative min-w-0 flex-1">
                        <p className="font-['Plus_Jakarta_Sans'] truncate text-base font-extrabold text-[#1B0E3B]">
                          {g.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#5B4B7A]">
                          {g.owner ? (
                            <>
                              <Crown className="size-3 text-[#B45309]" /> Você é o dono
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="size-3" /> Pode gerenciar
                            </>
                          )}
                        </p>
                      </div>
                      <ArrowRight className="relative size-4 shrink-0 text-[#5B4B7A] transition group-hover:translate-x-0.5 group-hover:text-[#1B0E3B]" />
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

function ChunkyStat({
  label,
  value,
  icon: Icon,
  tone,
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: Tone;
  hint: string;
}) {
  const t = TONE[tone];
  return (
    <div className="relative rounded-3xl border-2 border-[#1B0E3B] bg-white p-5 shadow-[0_5px_0_0_#1B0E3B]">
      <div className={`mb-3 inline-flex size-11 items-center justify-center rounded-2xl border-2 border-[#1B0E3B] ${t.soft} ${t.text}`}>
        <Icon className="size-5" />
      </div>
      <div className={`font-['Plus_Jakarta_Sans'] text-3xl font-extrabold ${t.text}`}>{value}</div>
      <div className="mt-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B]">{label}</div>
      <div className="mt-0.5 text-xs text-[#5B4B7A]">{hint}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative mx-auto mt-10 max-w-md">
      <div className="absolute inset-0 -z-10 translate-x-2 translate-y-2 rounded-[2rem] bg-[#1B0E3B]" />
      <div className="relative flex flex-col items-center rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-10 text-center shadow-[0_6px_0_0_#1B0E3B]">
        <Mascot variant="sleeping" size={140} glow />
        <div className="mt-4 inline-flex size-12 items-center justify-center rounded-2xl border-2 border-[#1B0E3B] bg-[#FFE4F1] text-[#EC4899]">
          <Plus className="size-6" />
        </div>
        <p className="font-['Plus_Jakarta_Sans'] mt-3 text-lg font-extrabold">Nenhum servidor gerenciável</p>
        <p className="mt-2 text-sm text-[#5B4B7A]">
          Você precisa ter <strong className="text-[#1B0E3B]">Gerenciar Servidor</strong> ou{" "}
          <strong className="text-[#1B0E3B]">Administrador</strong> em pelo menos um servidor onde o
          Zenox esteja (ou possa ser adicionado).
        </p>
      </div>
    </div>
  );
}
