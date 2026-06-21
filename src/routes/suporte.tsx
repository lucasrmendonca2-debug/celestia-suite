import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, MessageCircle, Mail, LifeBuoy } from "lucide-react";
import { PublicPage } from "@/components/site/PublicPage";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte & FAQ — Zenox" },
      { name: "description", content: "Tire dúvidas, leia o FAQ e fale com a equipe do Zenox." },
    ],
  }),
  component: Suporte,
});

const faq = [
  { q: "O Zenox é grátis?", a: "Sim! Todos os módulos básicos são gratuitos. O Zenox+ é opcional e dá uns extras pra quem quiser apoiar o projeto." },
  { q: "Como adiciono o bot no meu servidor?", a: "Clica em 'Adicionar agora' no topo do site, faz login com o Discord e escolhe o servidor. Leva uns 30 segundos." },
  { q: "Preciso saber programar pra configurar?", a: "Não. Todo o setup é feito pelo painel web, com botões e formulários. Sem código." },
  { q: "Quais permissões o bot pede?", a: "Só as necessárias pra cada módulo que você ativar. Você pode revisar tudo no Discord antes de aceitar." },
  { q: "Posso cancelar o Zenox+ quando quiser?", a: "Pode sim. Sem multa, sem fidelidade — basta cancelar no painel." },
  { q: "Onde reporto bugs ou sugestões?", a: "No nosso servidor de suporte do Discord ou pelo formulário aqui embaixo. A gente responde rápido." },
];

function Suporte() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <PublicPage
      eyebrow="Suporte"
      title="Tá com dúvida?"
      highlight="A gente te ajuda."
      description="Olha o FAQ ou fala direto com a galera no servidor de suporte."
    >
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="grid gap-4 md:grid-cols-3">
          <ChannelCard
            icon={MessageCircle}
            color="#7C3AED"
            soft="#EDE3FF"
            title="Discord oficial"
            desc="Tira dúvida na hora com a gente e com outros usuários."
            cta="Entrar no server"
            href="https://discord.gg/wda"
          />
          <ChannelCard
            icon={LifeBuoy}
            color="#10D9A0"
            soft="#D6FBEC"
            title="Status do bot"
            desc="Vê em tempo real se algum serviço tá fora do ar."
            cta="Ver status"
            to="/status"
          />
          <ChannelCard
            icon={Mail}
            color="#EC4899"
            soft="#FFE4F1"
            title="Reportar bug"
            desc="Achou algo estranho? Manda ticket no servidor de suporte."
            cta="Abrir ticket"
            href="https://discord.gg/wda"
          />
        </div>

        <div className="rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-6 shadow-[0_6px_0_0_#7C3AED] md:p-8">
          <h2 className="mb-6 font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tight">
            Perguntas frequentes
          </h2>
          <ul className="divide-y divide-[#1B0E3B]/10">
            {faq.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between py-4 text-left"
                  >
                    <span className="font-['Plus_Jakarta_Sans'] font-extrabold">{item.q}</span>
                    <ChevronDown
                      className={`size-5 text-[#7C3AED] transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && <p className="pb-5 text-sm text-[#5B4B7A]">{item.a}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </PublicPage>
  );
}

function ChannelCard({
  icon: Icon,
  color,
  soft,
  title,
  desc,
  cta,
  to,
  href,
}: {
  icon: typeof MessageCircle;
  color: string;
  soft: string;
  title: string;
  desc: string;
  cta: string;
  to?: string;
  href?: string;
}) {
  const inner = (
    <>
      <div
        className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl border-2"
        style={{ background: soft, color, borderColor: color }}
      >
        <Icon className="size-5" />
      </div>
      <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-extrabold">{title}</h3>
      <p className="mt-1 text-sm text-[#5B4B7A]">{desc}</p>
      <span className="mt-3 inline-block text-sm font-bold" style={{ color }}>
        {cta} →
      </span>
    </>
  );
  const className =
    "block rounded-3xl border-2 border-[#1B0E3B] bg-white p-6 shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-1";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}
