import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Star, Sparkles, Crown } from "lucide-react";
import { PublicPage } from "@/components/site/PublicPage";
import { Mascot } from "@/components/Mascot";
import { getPremiumPlans, getPremiumShowcase, type PremiumPlanDTO, type PremiumCosmeticDTO } from "@/lib/premium.functions";

interface PremiumLoaderData {
  plans: PremiumPlanDTO[];
  showcase: PremiumCosmeticDTO[];
}

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Zenox+ Premium" },
      { name: "description", content: "Apoie o Zenox e desbloqueie recursos exclusivos pro seu servidor." },
      { property: "og:title", content: "Zenox+ Premium" },
      { property: "og:description", content: "Planos VIP e Premium pro Zenox com preços e benefícios atualizados." },
    ],
  }),
  loader: async (): Promise<PremiumLoaderData> => {
    const [plans, showcase] = await Promise.all([getPremiumPlans(), getPremiumShowcase()]);
    return { plans, showcase };
  },
  component: Premium,
});

const PLAN_PALETTE: { color: string; soft: string }[] = [
  { color: "#10D9A0", soft: "#D6FBEC" },
  { color: "#EC4899", soft: "#FFE4F1" },
  { color: "#7C3AED", soft: "#EDE3FF" },
  { color: "#FBBF24", soft: "#FFF3D1" },
  { color: "#38BDF8", soft: "#DCF3FF" },
];

function formatPrice(plan: PremiumPlanDTO): string {
  if (plan.price <= 0) return "Grátis";
  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: plan.currency || "BRL",
  });
  return formatter.format(plan.price);
}

function planSubtitle(plan: PremiumPlanDTO): string {
  if (plan.price <= 0) return "pra sempre";
  if (plan.durationDays === 30) return "por mês";
  if (plan.durationDays === 365) return "por ano";
  return `por ${plan.durationDays} dias`;
}

function Premium() {
  const { plans, showcase } = Route.useLoaderData() as PremiumLoaderData;
  const userPlans = plans.filter((p: PremiumPlanDTO) => p.type === "USER_VIP");
  const guildPlans = plans.filter((p: PremiumPlanDTO) => p.type === "GUILD_PREMIUM");

  return (
    <PublicPage
      eyebrow="Zenox+"
      title="Apoia o projeto e"
      highlight="ganha extras."
      description="O Zenox é gratuito pra começar. Os planos abaixo destravam benefícios extras pro seu perfil ou pro seu servidor — e ajudam a manter o bot rodando."
    >
      {plans.length === 0 ? (
        <div className="mx-auto max-w-2xl rounded-[2rem] border-2 border-dashed border-[#1B0E3B] bg-white p-10 text-center text-[#5B4B7A]">
          Os planos premium aparecem aqui assim que estiverem disponíveis.
        </div>
      ) : (
        <div className="mx-auto max-w-6xl space-y-14">
          {userPlans.length > 0 && (
            <PlanSection
              title="VIP de usuário"
              subtitle="Benefícios pro seu perfil em qualquer servidor com o Zenox."
              plans={userPlans}
            />
          )}
          {guildPlans.length > 0 && (
            <PlanSection
              title="Premium pro servidor"
              subtitle="Libera limites maiores e recursos avançados pra todo o servidor."
              plans={guildPlans}
            />
          )}
        </div>
      )}

      {showcase.length > 0 && <PremiumShowcase items={showcase} />}

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
            Hospedagem, atualizações e novos módulos custam. Cada assinatura mantém o Zenox no ar
            pra toda a comunidade.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#7C3AED]">
            <Sparkles className="size-4" /> Cancele quando quiser
          </div>
        </div>
      </div>
    </PublicPage>
  );
}

function PlanSection({
  title,
  subtitle,
  plans,
}: {
  title: string;
  subtitle: string;
  plans: PremiumPlanDTO[];
}) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tight">{title}</h2>
        <p className="mt-1 text-[#5B4B7A]">{subtitle}</p>
      </div>
      <div className={`grid gap-6 ${plans.length === 1 ? "md:max-w-md" : plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {plans.map((plan, i) => {
          const palette = PLAN_PALETTE[i % PLAN_PALETTE.length];
          const featured = i === Math.floor((plans.length - 1) / 2);
          return (
            <article
              key={plan.id}
              className={`relative rounded-[2rem] border-2 border-[#1B0E3B] p-7 transition-transform hover:-translate-y-1 ${
                featured ? "shadow-[0_10px_0_0_#EC4899]" : "shadow-[0_6px_0_0_#1B0E3B]"
              }`}
              style={{ background: palette.soft }}
            >
              {featured && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full border-2 border-[#1B0E3B] bg-[#FBBF24] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B]">
                  <Star className="size-3" /> mais popular
                </span>
              )}
              <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold" style={{ color: palette.color }}>
                {plan.name}
              </h3>
              {plan.description && (
                <p className="mt-1 text-sm text-[#5B4B7A]">{plan.description}</p>
              )}
              <div className="mt-4 flex items-end gap-2">
                <span className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold">{formatPrice(plan)}</span>
                <span className="pb-1 text-sm text-[#5B4B7A]">{planSubtitle(plan)}</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-[#1B0E3B]">
                {plan.features.length === 0 && (
                  <li className="text-[#5B4B7A]">Benefícios serão anunciados em breve.</li>
                )}
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span
                      className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: palette.color }}
                    >
                      <Check className="size-3" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/suporte"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1B0E3B] px-5 py-2.5 text-sm font-bold text-white shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
                style={{ background: palette.color }}
              >
                Quero esse plano
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const RARITY_GLOW: Record<string, string> = {
  legendary: "shadow-[0_10px_30px_-10px_rgba(245,158,11,0.7)] border-[#F59E0B]",
  epic: "shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)] border-[#7C3AED]",
  rare: "shadow-[0_10px_30px_-10px_rgba(56,189,248,0.5)] border-[#38BDF8]",
  common: "shadow-[0_6px_0_0_#1B0E3B] border-[#1B0E3B]",
  seasonal: "shadow-[0_10px_30px_-10px_rgba(236,72,153,0.6)] border-[#EC4899]",
};

const RARITY_PT: Record<string, string> = {
  legendary: "Lendário",
  epic: "Épico",
  rare: "Raro",
  common: "Comum",
  seasonal: "Sazonal",
};

function PremiumShowcase({ items }: { items: PremiumCosmeticDTO[] }) {
  return (
    <section className="mx-auto mt-20 max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-[#FBBF24] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]">
            <Crown className="size-3" /> Vitrine VIP
          </span>
          <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tight md:text-4xl">
            Cosméticos <span className="text-[#FBBF24]">exclusivos</span> pra assinantes.
          </h2>
          <p className="mt-2 max-w-2xl text-[#5B4B7A]">
            Banners, molduras e stickers que só aparecem na sua loja quando você é VIP.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const isBanner = item.type === "banner";
          return (
            <article
              key={item.id}
              className={`group overflow-hidden rounded-2xl border-2 bg-white transition-all hover:-translate-y-1 ${RARITY_GLOW[item.rarity] ?? RARITY_GLOW.common}`}
            >
              <div
                className={`relative ${isBanner ? "aspect-[3/1]" : "aspect-square"} w-full overflow-hidden bg-[#FBF7FF]`}
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    className={`h-full w-full ${item.type === "frame" || item.type === "sticker" ? "object-contain p-3" : "object-cover"} transition-transform duration-500 group-hover:scale-110`}
                  />
                )}
                <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border-2 border-[#1B0E3B] bg-[#FBBF24] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_2px_0_0_#1B0E3B]">
                  <Crown className="size-2.5" /> VIP
                </div>
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-extrabold text-[#1B0E3B]">{item.name}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#5B4B7A]">
                  {RARITY_PT[item.rarity] ?? item.rarity}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
