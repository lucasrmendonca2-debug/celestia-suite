import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar } from "lucide-react";
import { PublicPage } from "@/components/site/PublicPage";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog & Novidades — Zenox" },
      { name: "description", content: "Atualizações, novidades e dicas sobre o bot Zenox." },
    ],
  }),
  component: Blog,
});

const posts = [
  {
    tag: "Update",
    date: "15 jun 2026",
    title: "Tickets v2: painéis múltiplos, departamentos e transcrições HTML",
    excerpt: "A reforma mais pedida tá no ar. Crie quantos painéis quiser, separe por equipe e exporte cada atendimento.",
    tone: "#7C3AED",
    soft: "#EDE3FF",
  },
  {
    tag: "Recurso",
    date: "02 jun 2026",
    title: "Rank cards customizados chegaram pro Zenox+",
    excerpt: "Coloque o fundo que quiser no rank card, escolha a cor da barra e use a fonte da sua marca.",
    tone: "#EC4899",
    soft: "#FFE4F1",
  },
  {
    tag: "Comunidade",
    date: "20 mai 2026",
    title: "Como organizamos sorteios na comunidade oficial",
    excerpt: "Dicas práticas pra fazer sorteios que engajam de verdade — com requisitos, mensagem custom e pós-venda.",
    tone: "#FBBF24",
    soft: "#FFF3D1",
  },
  {
    tag: "Bastidores",
    date: "05 mai 2026",
    title: "Como o Zenox aguenta 12 mil servidores com latência <80ms",
    excerpt: "Um papo técnico sobre sharding, cache e como entregamos resposta rápida pro Brasil inteiro.",
    tone: "#10D9A0",
    soft: "#D6FBEC",
  },
];

function Blog() {
  return (
    <PublicPage
      eyebrow="Blog"
      title="O que rolou de"
      highlight="novo."
      description="Atualizações do bot, dicas pra sua comunidade e bastidores do projeto."
    >
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <article
            key={p.title}
            className="group rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-6 shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center gap-1 rounded-full border-2 border-[#1B0E3B] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest"
                style={{ background: p.soft, color: p.tone }}
              >
                {p.tag}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#5B4B7A]">
                <Calendar className="size-3" /> {p.date}
              </span>
            </div>
            <h2 className="mt-4 font-['Plus_Jakarta_Sans'] text-2xl font-extrabold leading-tight">
              {p.title}
            </h2>
            <p className="mt-2 text-sm text-[#5B4B7A]">{p.excerpt}</p>
            <Link
              to="/blog"
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold"
              style={{ color: p.tone }}
            >
              Ler mais <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </article>
        ))}
      </div>
    </PublicPage>
  );
}
