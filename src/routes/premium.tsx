import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Star, Sparkles, Crown } from "lucide-react";
import { PublicPage } from "@/components/site/PublicPage";
import { Mascot } from "@/components/Mascot";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Zenox+ Premium" },
      { name: "description", content: "Apoie o Zenox e desbloqueie recursos exclusivos pro seu servidor." },
    ],
  }),
  component: Premium,
});

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    sub: "pra sempre",
    color: "#1B0E3B",
    soft: "#FFFFFF",
    cta: "Começar grátis",
    to: "/entrar",
    features: ["Todos os módulos básicos", "Até 3 painéis de ticket", "1 sorteio por vez", "Suporte na comunidade"],
  },
  {
    name: "Zenox+",
    price: "R$ 9,90",
    sub: "por mês",
    color: "#EC4899",
    soft: "#FFE4F1",
    cta: "Quero o Zenox+",
    to: "/entrar",
    featured: true,
    features: [
      "Painéis de ticket ilimitados",
      "Rank cards com fundo customizado",
      "Mais slots de sorteios e auto-roles",
      "Selo Zenox+ no servidor",
      "Fila prioritária no bot",
    ],
  },
  {
    name: "Server Pro",
    price: "R$ 24,90",
    sub: "por mês",
    color: "#7C3AED",
    soft: "#EDE3FF",
    cta: "Falar conosco",
    to: "/suporte",
    features: [
      "Tudo do Zenox+",
      "Branding customizado nos embeds",
      "Webhook de logs exportado",
      "Suporte por DM com prioridade",
    ],
  },
];

function Premium() {
  return (
    <PublicPage
      eyebrow="Zenox+"
      title="Apoia o projeto e"
      highlight="ganha extras."
      description="O Zenox é gratuito pra começar. Se você curte e quer turbinar, o Zenox+ libera recursos extras e ajuda a manter o bot rodando pra todo mundo."
    >
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <article
            key={p.name}
            className={`relative rounded-[2rem] border-2 border-[#1B0E3B] p-7 transition-transform hover:-translate-y-1 ${
              p.featured ? "shadow-[0_10px_0_0_#EC4899]" : "shadow-[0_6px_0_0_#1B0E3B]"
            }`}
            style={{ background: p.soft }}
          >
            {p.featured && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full border-2 border-[#1B0E3B] bg-[#FBBF24] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B]">
                <Star className="size-3" /> mais popular
              </span>
            )}
            <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold" style={{ color: p.color }}>
              {p.name}
            </h3>
            <div className="mt-3 flex items-end gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold">{p.price}</span>
              <span className="pb-1 text-sm text-[#5B4B7A]">{p.sub}</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-[#1B0E3B]">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: p.color }}
                  >
                    <Check className="size-3" />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to={p.to}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1B0E3B] px-5 py-2.5 text-sm font-bold text-white shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
              style={{ background: p.color }}
            >
              {p.cta}
            </Link>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-20 grid max-w-5xl items-center gap-10 rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-8 shadow-[0_8px_0_0_#7C3AED] md:grid-cols-[1fr_1.2fr] md:p-12">
        <Mascot variant="celebrate" size={260} className="mx-auto" />
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-[#FBBF24] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B]">
            <Crown className="size-3" /> Por que assinar?
          </div>
          <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tight md:text-4xl">
            Você ajuda o bot a continuar <span className="text-[#EC4899]">de graça</span> pra todo mundo.
          </h2>
          <p className="mt-3 text-[#5B4B7A]">
            Hospedagem, atualizações, novos módulos. Tudo isso custa. Cada assinatura mantém o
            Zenox rodando pra mais de 12 mil servidores brasileiros.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED]">
            <Sparkles className="size-4" /> Cancele quando quiser
          </div>
        </div>
      </div>
    </PublicPage>
  );
}
