import { createFileRoute, Link } from "@tanstack/react-router";
import { Rocket, Settings2, Shield, Terminal, LifeBuoy, Crown } from "lucide-react";
import { PublicPage } from "@/components/site/PublicPage";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentação — Zenox" },
      { name: "description", content: "Atalhos pros principais recursos e canais de suporte do Zenox." },
      { property: "og:title", content: "Documentação — Zenox" },
      { property: "og:description", content: "Comece em minutos: adicionar o bot, configurar e tirar dúvidas." },
    ],
  }),
  component: Docs,
});

type Section = {
  icon: typeof Rocket;
  color: string;
  soft: string;
  title: string;
  desc: string;
  href: string;
  external?: boolean;
};

const sections: Section[] = [
  {
    icon: Rocket,
    color: "#7C3AED",
    soft: "#EDE3FF",
    title: "Começando",
    desc: "Entre com o Discord, escolha um servidor e configure o básico em poucos cliques.",
    href: "/api/auth/discord/login",
    external: true,
  },
  {
    icon: Terminal,
    color: "#FBBF24",
    soft: "#FFF3D1",
    title: "Lista de comandos",
    desc: "Todos os comandos slash do bot, agrupados por categoria.",
    href: "/comandos",
  },
  {
    icon: Settings2,
    color: "#EC4899",
    soft: "#FFE4F1",
    title: "Recursos & módulos",
    desc: "Visão geral dos módulos: moderação, economia, level, tickets e mais.",
    href: "/recursos",
  },
  {
    icon: Shield,
    color: "#FB7185",
    soft: "#FFE0E5",
    title: "Painel do servidor",
    desc: "Configure permissões, módulos e logs direto pelo dashboard.",
    href: "/servidores",
  },
  {
    icon: Crown,
    color: "#10D9A0",
    soft: "#D6FBEC",
    title: "Planos premium",
    desc: "Veja os planos VIP e premium do servidor e o que cada um libera.",
    href: "/premium",
  },
  {
    icon: LifeBuoy,
    color: "#38BDF8",
    soft: "#DCF3FF",
    title: "Suporte",
    desc: "Entre no servidor de suporte oficial pra tirar dúvidas e pedir ajuda.",
    href: "/suporte",
  },
];

function Docs() {
  return (
    <PublicPage
      eyebrow="Docs"
      title="Atalhos rápidos do"
      highlight="Zenox."
      description="Documentação completa ainda está em produção. Por enquanto, esses atalhos cobrem o que a maioria das pessoas precisa."
    >
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          const inner = (
            <>
              <div
                className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl border-2"
                style={{ background: s.soft, color: s.color, borderColor: s.color }}
              >
                <Icon className="size-5" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold">{s.title}</h3>
              <p className="mt-1 text-sm text-[#5B4B7A]">{s.desc}</p>
            </>
          );
          const className =
            "group rounded-3xl border-2 border-[#1B0E3B] bg-white p-6 shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-1";
          return s.external ? (
            <a key={s.title} href={s.href} className={className}>
              {inner}
            </a>
          ) : (
            <Link key={s.title} to={s.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </PublicPage>
  );
}
