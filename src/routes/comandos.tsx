import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Terminal } from "lucide-react";
import { PublicPage } from "@/components/site/PublicPage";
import commandsJson from "@/data/commands.json";

export const Route = createFileRoute("/comandos")({
  head: () => ({
    meta: [
      { title: "Comandos — Zenox" },
      {
        name: "description",
        content:
          "Lista completa e atualizada de todos os comandos slash do Zenox, agrupados por categoria.",
      },
      { property: "og:title", content: "Comandos — Zenox" },
      {
        property: "og:description",
        content: "Pesquise entre todos os comandos slash do Zenox por nome ou categoria.",
      },
    ],
  }),
  component: CommandsPage,
});

type RawCmd = { name: string; description: string; category: string };
const ALL: RawCmd[] = commandsJson as RawCmd[];

const CATEGORY_META: Record<string, { label: string; emoji: string; tone: string; soft: string; text: string }> = {
  moderation:  { label: "Moderação",      emoji: "🛡️", tone: "#FB7185", soft: "#FFE0E5", text: "#BE123C" },
  config:      { label: "Configuração",   emoji: "⚙️", tone: "#7C3AED", soft: "#EDE3FF", text: "#5B21B6" },
  economy:     { label: "Economia",       emoji: "🪙", tone: "#FBBF24", soft: "#FFF3D1", text: "#B45309" },
  level:       { label: "Level & XP",     emoji: "⭐", tone: "#EC4899", soft: "#FFE4F1", text: "#BE185D" },
  fun:         { label: "Diversão",       emoji: "🎉", tone: "#10D9A0", soft: "#D6FBEC", text: "#047857" },
  interaction: { label: "Interação",      emoji: "🤝", tone: "#38BDF8", soft: "#DCF3FF", text: "#0369A1" },
  utility:     { label: "Utilidades",     emoji: "🧰", tone: "#7C3AED", soft: "#EDE3FF", text: "#5B21B6" },
  tickets:     { label: "Tickets",        emoji: "🎫", tone: "#38BDF8", soft: "#DCF3FF", text: "#0369A1" },
  premium:     { label: "Premium",        emoji: "💎", tone: "#EC4899", soft: "#FFE4F1", text: "#BE185D" },
  events:      { label: "Eventos",        emoji: "📅", tone: "#10D9A0", soft: "#D6FBEC", text: "#047857" },
};

function meta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat, emoji: "•", tone: "#1B0E3B", soft: "#F4ECFF", text: "#1B0E3B" };
}

function CommandsPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set(ALL.map((c) => c.category));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ALL.filter((c) => {
      if (active !== "all" && c.category !== active) return false;
      if (!term) return true;
      return c.name.includes(term) || c.description.toLowerCase().includes(term);
    });
  }, [q, active]);

  const grouped = useMemo(() => {
    const map = new Map<string, RawCmd[]>();
    for (const c of filtered) {
      if (!map.has(c.category)) map.set(c.category, []);
      map.get(c.category)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <PublicPage
      eyebrow="Comandos"
      title="Todos os"
      highlight={`${ALL.length} comandos slash.`}
      description="Lista gerada direto do código-fonte do bot. Pesquise pelo nome ou filtre por categoria."
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-5 shadow-[0_6px_0_0_#1B0E3B]">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-[#1B0E3B] bg-[#FBF7FF] px-4 py-3">
            <Search className="size-5 text-[#5B4B7A]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar comando..."
              className="w-full bg-transparent text-base font-medium text-[#1B0E3B] outline-none placeholder:text-[#5B4B7A]/60"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <CategoryChip label="Todos" emoji="✨" active={active === "all"} onClick={() => setActive("all")} count={ALL.length} />
            {categories.map((cat) => {
              const m = meta(cat);
              const count = ALL.filter((c) => c.category === cat).length;
              return (
                <CategoryChip
                  key={cat}
                  label={m.label}
                  emoji={m.emoji}
                  active={active === cat}
                  onClick={() => setActive(cat)}
                  count={count}
                />
              );
            })}
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-[2rem] border-2 border-dashed border-[#1B0E3B] bg-white p-10 text-center text-[#5B4B7A]">
            Nenhum comando encontrado para "{q}".
          </div>
        ) : (
          grouped.map(([cat, cmds]) => {
            const m = meta(cat);
            return (
              <section key={cat} className="rounded-[2rem] border-2 border-[#1B0E3B] bg-white p-6 shadow-[0_6px_0_0_#1B0E3B]">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="inline-flex size-10 items-center justify-center rounded-2xl border-2 border-[#1B0E3B] text-lg"
                    style={{ background: m.soft }}
                  >
                    {m.emoji}
                  </span>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold" style={{ color: m.text }}>
                    {m.label}
                  </h2>
                  <span className="ml-auto text-xs font-bold uppercase tracking-widest text-[#5B4B7A]">
                    {cmds.length} comando{cmds.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="grid gap-3 md:grid-cols-2">
                  {cmds.map((c) => (
                    <li
                      key={`${c.category}-${c.name}`}
                      className="rounded-2xl border-2 border-[#1B0E3B]/15 bg-[#FBF7FF] p-4 transition-colors hover:border-[#1B0E3B]/50"
                    >
                      <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#1B0E3B]">
                        <Terminal className="size-4 text-[#7C3AED]" />/{c.name}
                      </div>
                      {c.description && (
                        <p className="mt-1 text-sm text-[#5B4B7A]">{c.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </PublicPage>
  );
}

function CategoryChip({
  label,
  emoji,
  active,
  onClick,
  count,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border-2 border-[#1B0E3B] px-3 py-1.5 text-sm font-bold transition-transform hover:-translate-y-0.5 ${
        active ? "bg-[#1B0E3B] text-white shadow-[0_3px_0_0_#7C3AED]" : "bg-white text-[#1B0E3B] shadow-[0_3px_0_0_#1B0E3B]"
      }`}
    >
      <span>{emoji}</span>
      {label}
      <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/20" : "bg-[#FBF7FF]"}`}>{count}</span>
    </button>
  );
}
