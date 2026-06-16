import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";

export const Route = createFileRoute("/comandos")({
  head: () => ({
    meta: [
      { title: "Comandos — Zenox" },
      {
        name: "description",
        content:
          "Lista completa dos comandos slash do Zenox: moderação, economia, level, tickets, diversão, interação e mais.",
      },
      { property: "og:title", content: "Comandos — Zenox" },
      {
        property: "og:description",
        content:
          "Pesquise por categoria ou nome e veja todos os comandos do Zenox em um só lugar.",
      },
    ],
  }),
  component: CommandsPage,
});

type Cmd = { name: string; desc: string };
type Cat = { key: string; label: string; emoji: string; intro: string; cmds: Cmd[] };

const CATEGORIES: Cat[] = [
  {
    key: "moderation",
    label: "Moderação",
    emoji: "🛡️",
    intro: "Ban, kick, mute, warns, casos e ferramentas anti-raid.",
    cmds: [
      { name: "ban", desc: "Bane um usuário (permanente ou temporário)." },
      { name: "kick", desc: "Expulsa um usuário do servidor." },
      { name: "mute", desc: "Silencia via timeout ou cargo de mute." },
      { name: "tempmute", desc: "Silenciamento temporário com duração." },
      { name: "tempban", desc: "Banimento por tempo definido." },
      { name: "unban", desc: "Remove o banimento de um usuário." },
      { name: "unmute", desc: "Remove o silenciamento." },
      { name: "warn", desc: "Adverte um usuário com nível de severidade." },
      { name: "warns", desc: "Lista as advertências ativas de um usuário." },
      { name: "removewarn", desc: "Remove uma advertência específica." },
      { name: "case", desc: "Mostra detalhes de um caso de moderação." },
      { name: "reason", desc: "Edita o motivo de um caso existente." },
      { name: "history", desc: "Histórico completo de um usuário." },
      { name: "modstats", desc: "Estatísticas dos moderadores." },
      { name: "note", desc: "Adiciona uma nota privada sobre um usuário." },
      { name: "nickname", desc: "Altera o apelido de um membro." },
      { name: "clear", desc: "Limpa mensagens em massa." },
      { name: "purge", desc: "Limpeza avançada por filtros." },
      { name: "slowmode", desc: "Define o modo lento de um canal." },
      { name: "lock", desc: "Tranca um canal para @everyone." },
      { name: "unlock", desc: "Destrava um canal." },
      { name: "apelar", desc: "Cria uma apelação para uma punição." },
      { name: "apelacoes", desc: "Lista apelações pendentes (staff)." },
    ],
  },
  {
    key: "tickets",
    label: "Tickets",
    emoji: "🎫",
    intro: "Atendimento com painel, claim, SLA e transcripts.",
    cmds: [{ name: "ticket", desc: "Painel completo de tickets (abrir, fechar, claim, transcript)." }],
  },
  {
    key: "economy",
    label: "Economia",
    emoji: "💰",
    intro: "Moeda interna, daily, work, loja, ranking e missões.",
    cmds: [
      { name: "saldo", desc: "Mostra seu saldo na carteira e no banco." },
      { name: "daily", desc: "Recompensa diária com streak." },
      { name: "trabalhar", desc: "Trabalha em uma profissão aleatória." },
      { name: "crime", desc: "Tenta o caminho ilegal — alto risco, alto retorno." },
      { name: "pay", desc: "Transfere moedas para outro usuário." },
      { name: "rob", desc: "Tenta roubar moedas de alguém." },
      { name: "deposit", desc: "Deposita moedas no banco." },
      { name: "withdraw", desc: "Saca moedas do banco." },
      { name: "shop", desc: "Abre a loja do servidor." },
      { name: "inventory", desc: "Mostra seu inventário." },
      { name: "top", desc: "Ranking dos mais ricos do servidor." },
      { name: "missoes", desc: "Missões diárias/semanais com recompensas." },
      { name: "economia", desc: "Configurações da economia (admin)." },
    ],
  },
  {
    key: "level",
    label: "Level & Social",
    emoji: "📈",
    intro: "XP, ranking, perfil social, badges, conquistas e reputação.",
    cmds: [
      { name: "level", desc: "Mostra seu nível, XP e progresso." },
      { name: "rank", desc: "Card visual do seu nível." },
      { name: "leveltop", desc: "Ranking de XP do servidor." },
      { name: "levelreward", desc: "Configura recompensas por nível (admin)." },
      { name: "temporada", desc: "Status da temporada atual de level." },
      { name: "perfil", desc: "Perfil social: bio, badges, banner, reputação." },
      { name: "rep", desc: "Dá +1 reputação a um usuário (cooldown 12h)." },
      { name: "toprep", desc: "Top 10 de reputação do servidor." },
      { name: "badges", desc: "Listar, ver, dar ou remover badges." },
      { name: "conquistas", desc: "Suas conquistas desbloqueadas." },
    ],
  },
  {
    key: "fun",
    label: "Diversão",
    emoji: "🎉",
    intro: "Memes, dados, 8ball, coinflip e avatar.",
    cmds: [
      { name: "meme", desc: "Manda um meme aleatório." },
      { name: "8ball", desc: "Bola 8 mágica: pergunte e descubra." },
      { name: "dice", desc: "Rola um dado." },
      { name: "coinflip", desc: "Cara ou coroa." },
      { name: "avatar", desc: "Mostra o avatar de um usuário em alta resolução." },
    ],
  },
  {
    key: "interaction",
    label: "Interação",
    emoji: "💞",
    intro: "Hug, kiss, slap, ship, marry — e GIFs animados.",
    cmds: [
      { name: "hug", desc: "Abraça alguém." },
      { name: "kiss", desc: "Beija alguém." },
      { name: "slap", desc: "Dá um tapa cinematográfico." },
      { name: "pat", desc: "Faz carinho." },
      { name: "bonk", desc: "Bonk!" },
      { name: "cuddle", desc: "Chamego." },
      { name: "poke", desc: "Cutuca." },
      { name: "ship", desc: "Mostra a compatibilidade entre dois usuários." },
      { name: "marry", desc: "Pede alguém em casamento." },
      { name: "divorce", desc: "Termina seu casamento atual." },
    ],
  },
  {
    key: "events",
    label: "Eventos",
    emoji: "🎊",
    intro: "Giveaways e enquetes da comunidade.",
    cmds: [
      { name: "giveaway", desc: "Cria sorteios com requisitos e reroll." },
      { name: "enquete", desc: "Cria votações com botões e prazo." },
    ],
  },
  {
    key: "utility",
    label: "Utilidades",
    emoji: "🧰",
    intro: "Ping, info, lembretes, central de ajuda e mais.",
    cmds: [
      { name: "help", desc: "Central de ajuda interativa do bot." },
      { name: "ping", desc: "Latência e saúde do bot." },
      { name: "botinfo", desc: "Informações técnicas do Zenox." },
      { name: "serverinfo", desc: "Informações do servidor." },
      { name: "userinfo", desc: "Informações de um usuário." },
      { name: "lembrete", desc: "Cria um lembrete pessoal." },
      { name: "anuncio", desc: "Envia um anúncio formatado (staff)." },
      { name: "central", desc: "Painel central do servidor." },
      { name: "sugestao", desc: "Envia uma sugestão para o canal configurado." },
    ],
  },
  {
    key: "config",
    label: "Configuração",
    emoji: "⚙️",
    intro: "AutoMod, embeds, logs e custom commands.",
    cmds: [
      { name: "config", desc: "Configurações gerais do bot." },
      { name: "automod", desc: "Filtros automáticos: spam, links, palavras." },
      { name: "embed", desc: "Editor de embeds personalizados." },
      { name: "logs", desc: "Configura canais de log por categoria." },
      { name: "customcommand", desc: "Cria comandos personalizados do servidor." },
    ],
  },
  {
    key: "premium",
    label: "Premium",
    emoji: "💎",
    intro: "Benefícios VIP e gestão de assinaturas.",
    cmds: [
      { name: "premium", desc: "Status, ativação e benefícios premium." },
      { name: "vip", desc: "Comandos exclusivos para VIPs." },
      { name: "admin-premium", desc: "Gerenciamento de premium (staff)." },
    ],
  },
];

function CommandsPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return CATEGORIES.map((c) => ({
      ...c,
      cmds: c.cmds.filter(
        (cmd) =>
          (active === "all" || active === c.key) &&
          (term === "" ||
            cmd.name.toLowerCase().includes(term) ||
            cmd.desc.toLowerCase().includes(term)),
      ),
    })).filter((c) => c.cmds.length > 0);
  }, [q, active]);

  const total = CATEGORIES.reduce((acc, c) => acc + c.cmds.length, 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_55%_60%_at_50%_0%,theme(colors.primary/0.10),transparent_70%)]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/40">
              <span className="font-mono text-[13px] font-bold tracking-tighter text-primary">Z</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Zenox</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-4">
            <Link to="/" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Início
            </Link>
            <Link to="/dashboard" className="hidden text-muted-foreground hover:text-foreground sm:inline">
              Dashboard
            </Link>
            <ThemeToggle />
            <a
              href="/api/auth/discord/login"
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition hover:bg-foreground/85"
            >
              Entrar
              <ArrowUpRight className="size-3.5" />
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="mt-16 sm:mt-20">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="mr-2 inline-block size-1.5 translate-y-[-2px] rounded-full bg-primary align-middle" />
            comandos · {total} slash
          </p>
          <h1 className="max-w-3xl text-[36px] font-semibold leading-[1.05] tracking-tight sm:text-[52px]">
            Tudo que o Zenox sabe fazer,
            <br />
            <span className="italic text-primary">em um só lugar.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Pesquise por nome, filtre por categoria ou só dê uma navegada.
            Todos os comandos têm versão completa via <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">/help</code> dentro do Discord.
          </p>

          {/* Search */}
          <div className="mt-8 flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2.5 focus-within:border-primary/60">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar comando… ex: ban, daily, perfil"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                limpar
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <CategoryChip active={active === "all"} onClick={() => setActive("all")}>
              Todos
            </CategoryChip>
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c.key}
                active={active === c.key}
                onClick={() => setActive(c.key)}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </CategoryChip>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mt-14 space-y-14">
          {filtered.length === 0 && (
            <p className="rounded-lg border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
              Nenhum comando encontrado para “{q}”. Tenta outro termo.
            </p>
          )}
          {filtered.map((cat) => (
            <div key={cat.key}>
              <div className="mb-6 flex items-end justify-between gap-6 border-b border-border pb-3">
                <div>
                  <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {cat.emoji} {cat.label} — {cat.cmds.length}
                  </p>
                  <h2 className="text-xl font-semibold tracking-tight">{cat.intro}</h2>
                </div>
              </div>
              <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
                {cat.cmds.map((cmd) => (
                  <div
                    key={cmd.name}
                    className="group flex flex-col gap-1 bg-card/60 p-4 transition hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm font-semibold text-primary">
                        /{cmd.name}
                      </code>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{cmd.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Zenox. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground">Início</Link>
            <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
