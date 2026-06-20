import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Activity, Zap, Server } from "lucide-react";
import { PublicPage } from "@/components/site/PublicPage";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status — Zenox" },
      { name: "description", content: "Uptime, latência e incidentes do bot Zenox em tempo real." },
    ],
  }),
  component: Status,
});

const services = [
  { name: "Bot Discord", status: "ok", latency: "62ms" },
  { name: "API & Dashboard", status: "ok", latency: "48ms" },
  { name: "Database", status: "ok", latency: "11ms" },
  { name: "Música (beta)", status: "degraded", latency: "210ms" },
];

const incidents = [
  { date: "18 jun 2026", title: "Manutenção programada — atualização do módulo de tickets.", tone: "info" },
  { date: "02 jun 2026", title: "Latência elevada no módulo de música por 12 minutos.", tone: "warn" },
  { date: "27 mai 2026", title: "Tudo operacional no mês anterior.", tone: "ok" },
];

function bars() {
  return Array.from({ length: 60 }, (_, i) => {
    const broken = i === 17 || i === 41;
    return broken ? "warn" : "ok";
  });
}

function Status() {
  const series = bars();
  return (
    <PublicPage
      eyebrow="Status"
      title="Tudo rodando"
      highlight="suave."
      description="Acompanhe em tempo real o status dos serviços do Zenox e o histórico dos últimos 60 dias."
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-8 shadow-[0_6px_0_0_#10D9A0]">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#D6FBEC] text-[#047857]">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold">Todos os sistemas operacionais</h2>
              <p className="text-sm text-[#5B4B7A]">Atualizado agora · uptime 99.9% nos últimos 90 dias</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-6">
          <h3 className="mb-4 font-['Plus_Jakarta_Sans'] text-lg font-extrabold">Histórico — 60 dias</h3>
          <div className="flex gap-[3px]">
            {series.map((s, i) => (
              <span
                key={i}
                className="h-10 flex-1 rounded-sm"
                style={{ background: s === "ok" ? "#10D9A0" : "#FBBF24" }}
                title={s}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#5B4B7A]">
            <span>60 dias atrás</span>
            <span>hoje</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {services.map((s) => {
            const ok = s.status === "ok";
            return (
              <div
                key={s.name}
                className="flex items-center justify-between rounded-2xl border-2 border-[#1B0E3B] bg-white p-5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex size-9 items-center justify-center rounded-xl border-2"
                    style={{
                      background: ok ? "#D6FBEC" : "#FFF3D1",
                      color: ok ? "#047857" : "#B45309",
                      borderColor: ok ? "#10D9A0" : "#FBBF24",
                    }}
                  >
                    {ok ? <Activity className="size-4" /> : <Zap className="size-4" />}
                  </span>
                  <div>
                    <p className="font-['Plus_Jakarta_Sans'] font-extrabold">{s.name}</p>
                    <p className="text-xs text-[#5B4B7A]">{ok ? "operacional" : "performance degradada"}</p>
                  </div>
                </div>
                <span className="rounded-full border border-[#1B0E3B]/10 bg-[#FBF7FF] px-3 py-1 font-mono text-xs font-bold text-[#1B0E3B]">
                  {s.latency}
                </span>
              </div>
            );
          })}
        </div>

        <div className="rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 font-['Plus_Jakarta_Sans'] text-lg font-extrabold">
            <Server className="size-5 text-[#7C3AED]" /> Incidentes recentes
          </h3>
          <ul className="space-y-3">
            {incidents.map((i) => (
              <li
                key={i.date}
                className="flex items-start gap-3 rounded-2xl border border-[#1B0E3B]/10 bg-[#FBF7FF] p-4"
              >
                <span
                  className="mt-1 inline-block size-2 shrink-0 rounded-full"
                  style={{
                    background: i.tone === "ok" ? "#10D9A0" : i.tone === "warn" ? "#FBBF24" : "#38BDF8",
                  }}
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5B4B7A]">{i.date}</p>
                  <p className="text-sm text-[#1B0E3B]">{i.title}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PublicPage>
  );
}
