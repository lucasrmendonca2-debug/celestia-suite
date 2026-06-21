import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, Activity, Server } from "lucide-react";
import { PublicPage } from "@/components/site/PublicPage";
import { getPublicStats } from "@/lib/public-stats.functions";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status — Zenox" },
      { name: "description", content: "Status atual do bot Zenox e dos serviços conectados." },
      { property: "og:title", content: "Status — Zenox" },
      { property: "og:description", content: "Veja em tempo real se o Zenox está online." },
    ],
  }),
  loader: () => getPublicStats(),
  component: Status,
});

function formatRelative(iso: string | null): string {
  if (!iso) return "sem heartbeat registrado";
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `há ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const days = Math.floor(hr / 24);
  return `há ${days} dia${days === 1 ? "" : "s"}`;
}

function Status() {
  const stats = Route.useLoaderData();
  const online = stats.online;

  const services = [
    {
      name: "Bot Discord",
      ok: online,
      detail: online ? "Heartbeat recente" : formatRelative(stats.lastHeartbeat),
    },
    {
      name: "Dashboard web",
      ok: true,
      detail: "Você está vendo essa página, então tá no ar.",
    },
    {
      name: "Banco de dados",
      ok: true,
      detail: "Disponível",
    },
  ];

  return (
    <PublicPage
      eyebrow="Status"
      title={online ? "Tudo rodando" : "Bot offline"}
      highlight={online ? "suave." : "no momento."}
      description={
        online
          ? "Acompanhe o status atual do Zenox e dos serviços conectados."
          : "O bot não enviou heartbeat recente. Os outros serviços continuam disponíveis."
      }
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <div
          className="rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-8"
          style={{ boxShadow: `0 6px 0 0 ${online ? "#10D9A0" : "#FBBF24"}` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-flex size-10 items-center justify-center rounded-full"
              style={{
                background: online ? "#D6FBEC" : "#FFF3D1",
                color: online ? "#047857" : "#B45309",
              }}
            >
              {online ? <CheckCircle2 className="size-5" /> : <AlertTriangle className="size-5" />}
            </span>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold">
                {online ? "Todos os sistemas operacionais" : "Bot fora do ar"}
              </h2>
              <p className="text-sm text-[#5B4B7A]">
                Último heartbeat: {formatRelative(stats.lastHeartbeat)}
                {stats.servers > 0 ? ` · ${stats.servers} servidor${stats.servers === 1 ? "" : "es"} conectado${stats.servers === 1 ? "" : "s"}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl border-2 border-[#1B0E3B] bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex size-9 items-center justify-center rounded-xl border-2"
                  style={{
                    background: s.ok ? "#D6FBEC" : "#FFF3D1",
                    color: s.ok ? "#047857" : "#B45309",
                    borderColor: s.ok ? "#10D9A0" : "#FBBF24",
                  }}
                >
                  <Activity className="size-4" />
                </span>
                <div>
                  <p className="font-['Plus_Jakarta_Sans'] font-extrabold">{s.name}</p>
                  <p className="text-xs text-[#5B4B7A]">{s.ok ? "operacional" : "degradado"}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#5B4B7A]">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 font-['Plus_Jakarta_Sans'] text-lg font-extrabold">
            <Server className="size-5 text-[#7C3AED]" /> Em números
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Servidores conectados" value={String(stats.servers)} />
            <Stat label="Membros alcançados" value={stats.members.toLocaleString("pt-BR")} />
            <Stat label="Comandos slash" value={String(stats.commands)} />
          </div>
        </div>
      </div>
    </PublicPage>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-[#1B0E3B]/15 bg-[#FBF7FF] p-4">
      <p className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#1B0E3B]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#5B4B7A]">{label}</p>
    </div>
  );
}
