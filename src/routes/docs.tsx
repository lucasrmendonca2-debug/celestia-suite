import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Rocket, Settings2, Code2, Shield, MessageSquare } from "lucide-react";
import { PublicPage } from "@/components/site/PublicPage";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentação — Zenox" },
      { name: "description", content: "Guias, tutoriais e referência completa do Zenox." },
    ],
  }),
  component: Docs,
});

const sections = [
  { icon: Rocket, color: "#7C3AED", soft: "#EDE3FF", title: "Começando", desc: "Adicione o bot, faça login no painel e configure o básico em 5 minutos." },
  { icon: Settings2, color: "#EC4899", soft: "#FFE4F1", title: "Configuração", desc: "Permissões, cargos, canais e como ligar cada módulo." },
  { icon: Shield, color: "#FB7185", soft: "#FFE0E5", title: "Moderação", desc: "AutoMod, warns, anti-flood, anti-link e logs de auditoria." },
  { icon: MessageSquare, color: "#38BDF8", soft: "#DCF3FF", title: "Embeds & Boas-vindas", desc: "Como usar o editor visual e criar mensagens incríveis." },
  { icon: BookOpen, color: "#FBBF24", soft: "#FFF3D1", title: "Comandos", desc: "Referência completa de todos os comandos slash do bot." },
  { icon: Code2, color: "#10D9A0", soft: "#D6FBEC", title: "Webhooks & API", desc: "Integre o Zenox com ferramentas externas via webhooks." },
];

function Docs() {
  return (
    <PublicPage
      eyebrow="Docs"
      title="Aprende tudo do"
      highlight="Zenox."
      description="Guias passo a passo, tutoriais em vídeo e referência completa dos comandos."
    >
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.title}
              to="/docs"
              className="group rounded-3xl border-2 border-[#1B0E3B] bg-white p-6 shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-1"
            >
              <div
                className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl border-2"
                style={{ background: s.soft, color: s.color, borderColor: s.color }}
              >
                <Icon className="size-5" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold">{s.title}</h3>
              <p className="mt-1 text-sm text-[#5B4B7A]">{s.desc}</p>
            </Link>
          );
        })}
      </div>
    </PublicPage>
  );
}
