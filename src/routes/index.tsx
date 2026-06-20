import { createFileRoute, Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import {
  Shield,
  Ticket,
  ScrollText,
  Coins,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Vote,
  Lightbulb,
  ArrowRight,
  Star,
  Heart,
  Zap,
  Gamepad2,
  Users,
  Bot,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { SiteHeader, SiteFooter } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenox — O bot Discord brasileiro para sua comunidade" },
      {
        name: "description",
        content:
          "Moderação, economia, level, tickets, sorteios e muito mais. Um bot completo, gratuito e feito para a galera brasileira.",
      },
      { property: "og:title", content: "Zenox — Bot Discord brasileiro" },
      {
        property: "og:description",
        content:
          "Dashboard web, economia, AutoMod, level e mini games. Adicione em 30 segundos.",
      },
    ],
  }),
  component: Landing,
});

function startDiscordLogin(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  window.location.href = `/api/auth/discord/login?origin=${encodeURIComponent(
    window.location.origin,
  )}`;
}

type Tone = "purple" | "pink" | "sun" | "mint" | "sky" | "coral";

const TONE: Record<
  Tone,
  { bg: string; soft: string; text: string; border: string; ring: string }
> = {
  purple: { bg: "bg-[#7C3AED]", soft: "bg-[#EDE3FF]", text: "text-[#7C3AED]", border: "border-[#7C3AED]", ring: "shadow-[0_6px_0_0_#5B21B6]" },
  pink:   { bg: "bg-[#EC4899]", soft: "bg-[#FFE4F1]", text: "text-[#EC4899]", border: "border-[#EC4899]", ring: "shadow-[0_6px_0_0_#BE185D]" },
  sun:    { bg: "bg-[#FBBF24]", soft: "bg-[#FFF3D1]", text: "text-[#B45309]", border: "border-[#FBBF24]", ring: "shadow-[0_6px_0_0_#B45309]" },
  mint:   { bg: "bg-[#10D9A0]", soft: "bg-[#D6FBEC]", text: "text-[#047857]", border: "border-[#10D9A0]", ring: "shadow-[0_6px_0_0_#047857]" },
  sky:    { bg: "bg-[#38BDF8]", soft: "bg-[#DCF3FF]", text: "text-[#0369A1]", border: "border-[#38BDF8]", ring: "shadow-[0_6px_0_0_#0369A1]" },
  coral:  { bg: "bg-[#FB7185]", soft: "bg-[#FFE0E5]", text: "text-[#BE123C]", border: "border-[#FB7185]", ring: "shadow-[0_6px_0_0_#BE123C]" },
};

const modules: {
  n: string;
  title: string;
  desc: string;
  tone: Tone;
  icon: LucideIcon;
}[] = [
  { n: "01", title: "Moderação inteligente", desc: "AutoMod com filtros, warns, mutes e bans automáticos. Tudo registrado.", tone: "coral", icon: Shield },
  { n: "02", title: "Tickets v2", desc: "Suporte com múltiplos painéis, departamentos e transcrições bonitas.", tone: "sky", icon: Ticket },
  { n: "03", title: "Logs detalhados", desc: "Veja quem editou o quê, entrou, saiu ou mexeu nos cargos.", tone: "purple", icon: ScrollText },
  { n: "04", title: "Economia & loja", desc: "Coins, banco, loja de cargos e itens. Engaja sem cobrar.", tone: "sun", icon: Coins },
  { n: "05", title: "Level & XP", desc: "XP por chat e voz, rank cards bonitos e cargos automáticos por nível.", tone: "pink", icon: TrendingUp },
  { n: "06", title: "Boas-vindas", desc: "Editor visual de embeds e mensagens de boas-vindas em segundos.", tone: "mint", icon: MessageSquare },
  { n: "07", title: "Sorteios", desc: "Crie sorteios com requisitos de cargo, idade da conta e mais.", tone: "purple", icon: Sparkles },
  { n: "08", title: "Enquetes", desc: "Vote com botões ou reações. Resultado em tempo real.", tone: "sky", icon: Vote },
  { n: "09", title: "Sugestões", desc: "Canal de feedback com aprovação, rejeição e comentários.", tone: "coral", icon: Lightbulb },
];

const stats: { v: string; l: string; tone: Tone }[] = [
  { v: "+90", l: "comandos", tone: "purple" },
  { v: "+12k", l: "servidores", tone: "pink" },
  { v: "99.9%", l: "uptime", tone: "mint" },
  { v: "<80ms", l: "latência", tone: "sky" },
];

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#FBF7FF] font-['Inter'] text-[#1B0E3B] selection:bg-[#7C3AED] selection:text-white">
      {/* Floating shapes */}
      <BgBlobs />

      <SiteHeader />

      {/* HERO */}
      <section className="relative px-4 pb-16 pt-28 md:px-6 md:pt-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#10D9A0]" />
                <span className="relative size-2 rounded-full bg-[#10D9A0]" />
              </span>
              Online · +12.000 servidores
            </div>

            <h1 className="font-['Plus_Jakarta_Sans'] text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
              O bot que sua{" "}
              <span className="relative inline-block">
                <span className="relative z-10">galera</span>
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 -z-0 h-3 w-full -rotate-1 rounded-full bg-[#FBBF24]"
                />
              </span>{" "}
              vai{" "}
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#A855F7] to-[#EC4899] bg-clip-text text-transparent">
                amar usar.
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-[#5B4B7A]">
              Moderação, economia, level, tickets, sorteios, mini-games e um painel web que
              qualquer um consegue mexer. Tudo num bot só — e de graça pra começar.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <PeekButton
                href="/api/auth/discord/login"
                onClick={startDiscordLogin}
                label="Comece agora"
              />
              <Link
                to="/recursos"
                className="group inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-6 py-3.5 text-base font-bold text-[#1B0E3B] shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
              >
                Ver recursos
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2 text-sm text-[#5B4B7A]">
              <div className="flex -space-x-2">
                {["#7C3AED", "#EC4899", "#FBBF24", "#10D9A0"].map((c) => (
                  <span
                    key={c}
                    className="size-7 rounded-full border-2 border-white"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span>
                <strong className="text-[#1B0E3B]">+12.000</strong> servidores ativos esse mês
              </span>
            </div>
          </div>

          {/* Mascot card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-[2.5rem] bg-[#1B0E3B]" />
            <div className="relative aspect-square rounded-[2.5rem] border-2 border-[#1B0E3B] bg-gradient-to-br from-[#F1E9FF] via-[#FFE4F1] to-[#FFF3D1] p-6">
              <Mascot variant="hero" size={420} className="mx-auto size-full animate-[float_5s_ease-in-out_infinite]" />

              <FloatingBadge className="-left-4 top-4 -rotate-6" tone="sun">
                <Gamepad2 className="size-3.5" /> Mini games
              </FloatingBadge>
              <FloatingBadge className="-right-3 top-20 rotate-6" tone="pink">
                <Heart className="size-3.5" /> Comunidade
              </FloatingBadge>
              <FloatingBadge className="-left-6 bottom-16 -rotate-3" tone="mint">
                <Zap className="size-3.5" /> 99.9% uptime
              </FloatingBadge>
              <FloatingBadge className="-right-4 bottom-6 rotate-3" tone="sky">
                <Bot className="size-3.5" /> +90 comandos
              </FloatingBadge>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => {
            const t = TONE[s.tone];
            return (
              <div
                key={s.l}
                className={`rounded-3xl border-2 border-[#1B0E3B] bg-white p-5 ${t.ring}`}
              >
                <div
                  className={`font-['Plus_Jakarta_Sans'] text-3xl font-extrabold ${t.text}`}
                >
                  {s.v}
                </div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-[#5B4B7A]">
                  {s.l}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODULES */}
      <section id="recursos" className="mx-auto max-w-7xl px-4 py-24 md:px-6">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <SectionLabel tone="purple">Recursos</SectionLabel>
            <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight md:text-5xl">
              Tudo o que seu server precisa,{" "}
              <span className="text-[#7C3AED]">num bot só.</span>
            </h2>
            <p className="mt-3 text-[#5B4B7A]">
              Pare de instalar seis bots diferentes. O Zenox cobre moderação, economia, level,
              tickets e muito mais — sem dor de cabeça.
            </p>
          </div>
          <Link
            to="/recursos"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-white px-5 py-2.5 text-sm font-bold text-[#1B0E3B] shadow-[0_4px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
          >
            Ver todos <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const t = TONE[m.tone];
            const Icon = m.icon;
            return (
              <article
                key={m.n}
                className={`group relative rounded-3xl border-2 border-[#1B0E3B] bg-white p-6 ${t.ring} transition-transform hover:-translate-y-1`}
              >
                <div
                  className={`mb-5 inline-flex size-12 items-center justify-center rounded-2xl ${t.soft} ${t.text} border-2 ${t.border}`}
                >
                  <Icon className="size-5" />
                </div>
                <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-xl font-extrabold">
                  {m.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#5B4B7A]">{m.desc}</p>
                <span className="mt-4 inline-block font-mono text-[10px] font-bold uppercase tracking-widest text-[#5B4B7A]/60">
                  #{m.n}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#1B0E3B] px-4 py-24 text-white md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <SectionLabel tone="sun" dark>
              Em 30 segundos
            </SectionLabel>
            <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight md:text-5xl">
              Comece em{" "}
              <span className="bg-gradient-to-r from-[#FBBF24] to-[#FB7185] bg-clip-text text-transparent">
                três passos.
              </span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: "01", title: "Convide o Zenox", desc: "Adicione o bot no seu servidor com um clique." },
              { n: "02", title: "Entre no painel", desc: "Login com Discord e configure tudo num dashboard simples." },
              { n: "03", title: "Curta com a galera", desc: "Ative módulos, crie sorteios e veja sua comunidade bombar." },
            ].map((s, i) => {
              const tones: Tone[] = ["pink", "sun", "mint"];
              const t = TONE[tones[i]];
              return (
                <div
                  key={s.n}
                  className="rounded-3xl border-2 border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
                >
                  <div
                    className={`mb-4 inline-flex size-10 items-center justify-center rounded-xl ${t.bg} font-['Plus_Jakarta_Sans'] text-sm font-extrabold text-[#1B0E3B]`}
                  >
                    {s.n}
                  </div>
                  <h3 className="mb-2 font-['Plus_Jakarta_Sans'] text-lg font-extrabold">
                    {s.title}
                  </h3>
                  <p className="text-sm text-white/70">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PREMIUM TEASER */}
      <section className="px-4 py-24 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 rounded-[2rem] border-2 border-[#1B0E3B] bg-gradient-to-br from-[#FFE4F1] via-[#F1E9FF] to-[#FFF3D1] p-8 shadow-[0_8px_0_0_#1B0E3B] md:grid-cols-[1.2fr_1fr] md:p-12">
            <div className="space-y-5">
              <SectionLabel tone="pink">Zenox+</SectionLabel>
              <h2 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight md:text-5xl">
                Quer turbinar?{" "}
                <span className="text-[#EC4899]">Vira Zenox+.</span>
              </h2>
              <p className="text-[#5B4B7A]">
                Mais slots de sorteios, ranks cards exclusivos, ticket panels ilimitados e fila de
                processamento prioritária. Apoiando o projeto você ajuda a manter o bot gratuito
                pra todo mundo.
              </p>
              <ul className="space-y-2 text-sm font-semibold text-[#1B0E3B]">
                {[
                  "Painéis de ticket ilimitados",
                  "Rank cards com fundo customizado",
                  "Mais slots de sorteios e auto-roles",
                  "Selo Zenox+ no seu servidor",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#10D9A0] text-white">
                      <Check className="size-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/premium"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] bg-[#EC4899] px-6 py-3 text-sm font-bold text-white shadow-[0_5px_0_0_#1B0E3B] transition-transform hover:-translate-y-0.5"
              >
                Conhecer Zenox+ <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="relative">
              <Mascot variant="celebrate" size={300} className="mx-auto animate-[float_4s_ease-in-out_infinite]" />
              <FloatingBadge className="left-2 top-2 -rotate-6" tone="sun">
                <Star className="size-3.5" /> Premium
              </FloatingBadge>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNITY CTA */}
      <section className="px-4 py-24 md:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <CommunityCard
            tone="purple"
            icon={Users}
            title="Comunidade"
            desc="Entra no servidor oficial e bate papo com a galera."
            to="/suporte"
            cta="Entrar no Discord"
          />
          <CommunityCard
            tone="mint"
            icon={Bot}
            title="Status do bot"
            desc="Veja o uptime, latência e incidentes em tempo real."
            to="/status"
            cta="Ver status"
          />
          <CommunityCard
            tone="sky"
            icon={ScrollText}
            title="Documentação"
            desc="Tudo o que você precisa saber pra dominar o Zenox."
            to="/docs"
            cta="Abrir docs"
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 pb-24 pt-8 md:px-6">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] border-2 border-[#1B0E3B] bg-[#1B0E3B] p-1 shadow-[0_10px_0_0_#7C3AED]">
          <div className="relative overflow-hidden rounded-[2.3rem] bg-gradient-to-br from-[#7C3AED] via-[#A855F7] to-[#EC4899] p-10 text-center md:p-16">
            <div className="absolute -left-10 -top-10 size-40 rounded-full bg-[#FBBF24]/30 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-[#38BDF8]/30 blur-3xl" />
            <h2 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight text-white md:text-6xl">
              Pronto pra deixar seu server{" "}
              <span className="italic">lendário?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/80">
              Adiciona o Zenox em 30 segundos e configura tudo no painel.
            </p>
            <div className="mt-8 inline-block">
              <PeekButton
                href="/api/auth/discord/login"
                onClick={startDiscordLogin}
                label="Adicionar ao Discord"
                large
                dark
              />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Local keyframes scoped here */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes peek {
          0%, 100% { transform: translate(-50%, 30%) rotate(-6deg); }
          50% { transform: translate(-50%, 8%) rotate(2deg); }
        }
        .peek-mascot { animation: peek 2.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ---------- Pieces ---------- */

function PeekButton({
  href,
  onClick,
  label,
  large = false,
  dark = false,
}: {
  href: string;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  label: string;
  large?: boolean;
  dark?: boolean;
}) {
  const base = dark
    ? "bg-white text-[#1B0E3B] border-[#1B0E3B] shadow-[0_6px_0_0_#1B0E3B]"
    : "bg-[#7C3AED] text-white border-[#1B0E3B] shadow-[0_6px_0_0_#1B0E3B]";
  const size = large ? "px-8 py-4 text-lg" : "px-6 py-3.5 text-base";
  return (
    <span className="relative inline-block">
      {/* Peeking mascot */}
      <span
        aria-hidden
        className="peek-mascot pointer-events-none absolute left-1/2 top-0 z-0"
        style={{ width: 72, height: 72, marginLeft: -36, marginTop: -10 }}
      >
        <Mascot variant="original" size={72} />
      </span>
      <a
        href={href}
        onClick={onClick}
        className={`relative z-10 inline-flex items-center gap-2 rounded-full border-2 font-extrabold transition-transform hover:-translate-y-0.5 ${base} ${size}`}
      >
        {label}
        <ArrowRight className="size-4" />
      </a>
    </span>
  );
}

function FloatingBadge({
  children,
  className,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone: Tone;
}) {
  const t = TONE[tone];
  return (
    <span
      className={`absolute inline-flex items-center gap-1.5 rounded-full border-2 border-[#1B0E3B] bg-white px-3 py-1.5 text-[11px] font-extrabold ${t.text} shadow-[0_3px_0_0_#1B0E3B] ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

function SectionLabel({
  children,
  tone,
  dark = false,
}: {
  children: React.ReactNode;
  tone: Tone;
  dark?: boolean;
}) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest ${dark ? "border-white/20 bg-white/5 text-white" : `border-[#1B0E3B] bg-white text-[#1B0E3B]`}`}
    >
      <span className={`size-1.5 rounded-full ${t.bg}`} />
      {children}
    </span>
  );
}

function CommunityCard({
  tone,
  icon: Icon,
  title,
  desc,
  to,
  cta,
}: {
  tone: Tone;
  icon: LucideIcon;
  title: string;
  desc: string;
  to: string;
  cta: string;
}) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className={`group relative rounded-3xl border-2 border-[#1B0E3B] bg-white p-6 ${t.ring} transition-transform hover:-translate-y-1`}
    >
      <div
        className={`mb-4 inline-flex size-12 items-center justify-center rounded-2xl ${t.soft} ${t.text} border-2 ${t.border}`}
      >
        <Icon className="size-5" />
      </div>
      <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold">{title}</h3>
      <p className="mt-2 text-sm text-[#5B4B7A]">{desc}</p>
      <span className={`mt-4 inline-flex items-center gap-1 text-sm font-bold ${t.text}`}>
        {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function BgBlobs() {
  return (
    <>
      <div className="pointer-events-none absolute right-[-10%] top-20 -z-10 size-[500px] rounded-full bg-[#EC4899]/20 blur-[120px]" />
      <div className="pointer-events-none absolute left-[-10%] top-[40%] -z-10 size-[500px] rounded-full bg-[#7C3AED]/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[20%] top-[80%] -z-10 size-[400px] rounded-full bg-[#FBBF24]/20 blur-[110px]" />
    </>
  );
}
