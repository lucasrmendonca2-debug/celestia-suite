import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Mascot } from "@/components/Mascot";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Heart, Sparkles, Trophy } from "lucide-react";
import { getHallOfFame, type HallEntryDTO } from "@/lib/hall-of-fame.functions";

const hofOptions = queryOptions({
  queryKey: ["hall-of-fame"],
  queryFn: () => getHallOfFame(),
  staleTime: 1000 * 60 * 5,
});

const MEDALS = ["🥇", "🥈", "🥉"];

function fmt(n: number | undefined) {
  return (n ?? 0).toLocaleString("pt-BR");
}

function shortId(id: string) {
  if (id.length <= 6) return id;
  return `${id.slice(0, 4)}…${id.slice(-3)}`;
}

function TopList({
  title,
  icon,
  accent,
  entries,
  valueKey,
  valueLabel,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  entries: HallEntryDTO[];
  valueKey: "xp" | "coins" | "rep";
  valueLabel: string;
}) {
  return (
    <Card className="overflow-hidden border-2 border-[#1B0E3B] bg-white p-0 shadow-[0_6px_0_0_#1B0E3B]">
      <div
        className="flex items-center gap-2 border-b-2 border-[#1B0E3B] px-5 py-3 text-white"
        style={{ background: accent }}
      >
        {icon}
        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold">{title}</h3>
      </div>
      <ol className="divide-y divide-[#1B0E3B]/10">
        {entries.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-[#5B4B7A]">
            Sem dados ainda — volte em breve.
          </li>
        ) : (
          entries.map((e, idx) => {
            const isTop = idx < 3;
            return (
              <li
                key={`${e.user_id}-${idx}`}
                className="flex items-center gap-3 px-4 py-3 animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                    isTop
                      ? "bg-[#FBBF24] text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]"
                      : "bg-[#1B0E3B]/5 text-[#5B4B7A]"
                  }`}
                >
                  {isTop ? MEDALS[idx] : idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm text-[#1B0E3B]">
                    {shortId(e.user_id)}
                  </p>
                  <p className="text-xs text-[#5B4B7A]">ID Discord</p>
                </div>
                <Badge
                  className="border-2 border-[#1B0E3B] text-[#1B0E3B] shadow-[0_2px_0_0_#1B0E3B]"
                  style={{ background: isTop ? "#FFF3D1" : "white" }}
                >
                  {fmt(e[valueKey])} {valueLabel}
                </Badge>
              </li>
            );
          })
        )}
      </ol>
    </Card>
  );
}

function HallDaFama() {
  const { data } = useSuspenseQuery(hofOptions);

  return (
    <div className="min-h-dvh overflow-hidden bg-[#FBF7FF] font-['Inter'] text-[#1B0E3B]">
      <div className="pointer-events-none absolute right-[-10%] top-20 -z-10 size-[500px] rounded-full bg-[#FBBF24]/30 blur-[120px]" />
      <div className="pointer-events-none absolute left-[-10%] top-[40%] -z-10 size-[500px] rounded-full bg-[#EC4899]/20 blur-[120px]" />

      <section className="px-4 pb-12 pt-24 md:px-6 md:pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]">
                <Trophy className="size-3" /> Hall da Fama
              </span>
              <h1 className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold leading-tight md:text-6xl">
                Os lendários da{" "}
                <span className="text-[#EC4899]">temporada{data.season ? "" : " atual"}</span>
              </h1>
              <p className="mt-4 max-w-xl text-[#5B4B7A]">
                Top 10 jogadores em XP, moedas e reputação. Quer aparecer aqui?
                Mande mensagens, ajude os outros e use o bot todos os dias.
              </p>
              {data.season && (
                <div className="mt-4 inline-flex flex-col rounded-2xl border-2 border-[#1B0E3B] bg-white px-4 py-2 shadow-[0_4px_0_0_#1B0E3B]">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5B4B7A]">
                    Temporada
                  </span>
                  <span className="text-lg font-extrabold text-[#7C3AED]">{data.season.name}</span>
                </div>
              )}
            </div>
            <Mascot variant="celebrate" size={260} glow className="mx-auto" />
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <TopList
            title="Top XP"
            icon={<Sparkles className="size-5" />}
            accent="#7C3AED"
            entries={data.top_xp}
            valueKey="xp"
            valueLabel="XP"
          />
          <TopList
            title="Top Moedas"
            icon={<Coins className="size-5" />}
            accent="#F59E0B"
            entries={data.top_coins}
            valueKey="coins"
            valueLabel="🪙"
          />
          <TopList
            title="Top Reputação"
            icon={<Heart className="size-5" />}
            accent="#EC4899"
            entries={data.top_rep}
            valueKey="rep"
            valueLabel="rep"
          />
        </div>
        <p className="mt-6 text-center text-xs text-[#5B4B7A]">
          Atualizado em {new Date(data.generated_at).toLocaleString("pt-BR")}
        </p>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/hall-da-fama")({
  loader: ({ context }) => context.queryClient.ensureQueryData(hofOptions),
  component: HallDaFama,
  head: () => ({
    meta: [
      { title: "Hall da Fama — Zenox" },
      {
        name: "description",
        content: "Top jogadores em XP, moedas e reputação da temporada atual do Zenox.",
      },
      { property: "og:title", content: "Hall da Fama — Zenox" },
      {
        property: "og:description",
        content: "Os lendários da temporada atual: top 10 XP, moedas e reputação.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <main className="flex min-h-dvh items-center justify-center p-6 bg-[#FBF7FF]">
      <p className="text-sm text-[#5B4B7A]">Erro ao carregar Hall da Fama: {String(error)}</p>
    </main>
  ),
  notFoundComponent: () => <p>Não encontrado</p>,
});
