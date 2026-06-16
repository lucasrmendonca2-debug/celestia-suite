import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, ChevronDown, Clock, Shield, Terminal } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";

export const Route = createFileRoute("/comandos")({
  head: () => ({
    meta: [
      { title: "Comandos — Zenox" },
      {
        name: "description",
        content:
          "Lista completa dos comandos slash do Zenox com exemplos, cooldown, permissões e preview do embed.",
      },
      { property: "og:title", content: "Comandos — Zenox" },
      {
        property: "og:description",
        content:
          "Pesquise comandos, veja exemplos de uso, cooldowns, permissões e preview do embed de resposta.",
      },
    ],
  }),
  component: CommandsPage,
});

type EmbedPreview = {
  kind?: "success" | "error" | "warn" | "info" | "fun";
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: string;
};

type Cmd = {
  name: string;
  desc: string;
  cooldown?: string;
  perms?: string[];
  examples?: string[];
  embed?: EmbedPreview;
};
type Cat = { key: string; label: string; emoji: string; intro: string; cmds: Cmd[] };

const CATEGORIES: Cat[] = [
  {
    key: "moderation",
    label: "Moderação",
    emoji: "🛡️",
    intro: "Ban, kick, mute, warns, casos e ferramentas anti-raid.",
    cmds: [
      {
        name: "ban",
        desc: "Bane um usuário (permanente ou temporário).",
        cooldown: "3s",
        perms: ["Banir membros", "Capability: can_ban"],
        examples: [
          "/ban usuario:@Fulano motivo:spam repetido",
          "/ban usuario:@Fulano duracao:7d apagar_dias:1",
        ],
        embed: {
          kind: "success",
          title: "Banimento aplicado · Caso #128",
          description: "<@123> foi banido.",
          footer: "Zenox • Moderação",
        },
      },
      {
        name: "kick",
        desc: "Expulsa um usuário do servidor.",
        cooldown: "3s",
        perms: ["Expulsar membros", "Capability: can_kick"],
        examples: ["/kick usuario:@Fulano motivo:flood"],
        embed: { kind: "success", title: "Usuário expulso", description: "<@123> foi expulso." },
      },
      {
        name: "mute",
        desc: "Silencia via timeout ou cargo de mute.",
        cooldown: "3s",
        perms: ["Moderar membros", "Capability: can_mute"],
        examples: ["/mute usuario:@Fulano duracao:10m motivo:caps"],
        embed: { kind: "success", title: "Usuário silenciado · Caso #129", description: "<@123> silenciado." },
      },
      {
        name: "warn",
        desc: "Adverte um usuário com nível de severidade.",
        cooldown: "3s",
        perms: ["Capability: can_warn"],
        examples: [
          "/warn usuario:@Fulano motivo:link suspeito severidade:HIGH",
          "/warn usuario:@Fulano motivo:flood prova:https://...",
        ],
        embed: {
          kind: "warn",
          title: "Advertência registrada · Caso #130",
          description: "<@123> recebeu **MEDIUM** (+2 pontos) — total **4/5**.",
          fields: [{ name: "Motivo", value: "link suspeito" }],
        },
      },
      { name: "tempmute", desc: "Silenciamento temporário com duração.", cooldown: "3s", perms: ["Moderar membros"] },
      { name: "tempban", desc: "Banimento por tempo definido.", cooldown: "3s", perms: ["Banir membros"] },
      { name: "unban", desc: "Remove o banimento de um usuário.", perms: ["Banir membros"] },
      { name: "unmute", desc: "Remove o silenciamento.", perms: ["Moderar membros"] },
      { name: "warns", desc: "Lista as advertências ativas de um usuário.", examples: ["/warns usuario:@Fulano"] },
      { name: "removewarn", desc: "Remove uma advertência específica.", perms: ["Capability: can_warn"] },
      { name: "case", desc: "Mostra detalhes de um caso de moderação.", examples: ["/case numero:128"] },
      { name: "reason", desc: "Edita o motivo de um caso existente.", perms: ["Staff"] },
      { name: "history", desc: "Histórico completo de um usuário.", examples: ["/history usuario:@Fulano"] },
      { name: "modstats", desc: "Estatísticas dos moderadores." },
      { name: "note", desc: "Adiciona uma nota privada sobre um usuário.", perms: ["Staff"] },
      { name: "nickname", desc: "Altera o apelido de um membro.", perms: ["Gerenciar apelidos"] },
      { name: "clear", desc: "Limpa mensagens em massa.", perms: ["Gerenciar mensagens"], examples: ["/clear quantidade:50"] },
      { name: "purge", desc: "Limpeza avançada por filtros.", perms: ["Gerenciar mensagens"] },
      { name: "slowmode", desc: "Define o modo lento de um canal.", perms: ["Gerenciar canais"], examples: ["/slowmode segundos:10"] },
      { name: "lock", desc: "Tranca um canal para @everyone.", perms: ["Gerenciar canais"] },
      { name: "unlock", desc: "Destrava um canal.", perms: ["Gerenciar canais"] },
      { name: "apelar", desc: "Cria uma apelação para uma punição." },
      { name: "apelacoes", desc: "Lista apelações pendentes (staff).", perms: ["Staff"] },
    ],
  },
  {
    key: "tickets",
    label: "Tickets",
    emoji: "🎫",
    intro: "Atendimento com painel, claim, SLA e transcripts.",
    cmds: [
      {
        name: "ticket",
        desc: "Painel completo de tickets: abrir, fechar, claim, transcript.",
        examples: ["/ticket painel", "/ticket fechar motivo:resolvido", "/ticket claim"],
        embed: {
          kind: "info",
          title: "🎫 Suporte Zenox",
          description: "Clique no botão abaixo pra abrir um ticket. Um membro da staff vai te atender em breve.",
          footer: "SLA médio: < 10 min",
        },
      },
    ],
  },
  {
    key: "economy",
    label: "Economia",
    emoji: "💰",
    intro: "Moeda interna, daily, work, loja, ranking e missões.",
    cmds: [
      {
        name: "saldo",
        desc: "Mostra seu saldo na carteira e no banco.",
        cooldown: "3s",
        examples: ["/saldo", "/saldo usuario:@Fulano"],
        embed: {
          kind: "info",
          title: "💰 Carteira de Fulano",
          fields: [
            { name: "Carteira", value: "1.250 🪙", inline: true },
            { name: "Banco", value: "8.700 🪙", inline: true },
            { name: "Total", value: "9.950 🪙", inline: true },
          ],
        },
      },
      {
        name: "daily",
        desc: "Recompensa diária com streak.",
        cooldown: "24h",
        examples: ["/daily"],
        embed: {
          kind: "success",
          title: "✨ Daily coletado!",
          description: "Você recebeu **250 🪙** · streak **7 dias** 🔥",
          footer: "Volta amanhã pra manter o streak.",
        },
      },
      {
        name: "trabalhar",
        desc: "Trabalha em uma profissão aleatória.",
        cooldown: "30min",
        examples: ["/trabalhar"],
        embed: {
          kind: "fun",
          title: "🛠️ Trabalho concluído",
          description: "Você entregou pizzas pela cidade e ganhou **180 🪙**.",
        },
      },
      {
        name: "crime",
        desc: "Tenta o caminho ilegal — alto risco, alto retorno.",
        cooldown: "1h",
        embed: {
          kind: "warn",
          title: "🚓 Crime malsucedido",
          description: "A polícia chegou antes do plano sair do papel. Multa de **320 🪙**.",
        },
      },
      {
        name: "pay",
        desc: "Transfere moedas para outro usuário.",
        cooldown: "5s",
        examples: ["/pay usuario:@Fulano quantia:500"],
        embed: { kind: "success", title: "💸 Transferência concluída", description: "Você enviou **500 🪙** para <@123>." },
      },
      { name: "rob", desc: "Tenta roubar moedas de alguém.", cooldown: "1h" },
      { name: "deposit", desc: "Deposita moedas no banco.", examples: ["/deposit quantia:1000", "/deposit quantia:all"] },
      { name: "withdraw", desc: "Saca moedas do banco.", examples: ["/withdraw quantia:500"] },
      {
        name: "shop",
        desc: "Abre a loja do servidor.",
        examples: ["/shop ver", "/shop comprar item:vip-tag"],
        embed: {
          kind: "info",
          title: "🛒 Loja do servidor",
          description: "Use os botões abaixo pra navegar e comprar.",
          footer: "Itens rotacionam diariamente",
        },
      },
      { name: "inventory", desc: "Mostra seu inventário.", examples: ["/inventory"] },
      { name: "top", desc: "Ranking dos mais ricos do servidor.", examples: ["/top", "/top tipo:banco"] },
      { name: "missoes", desc: "Missões diárias/semanais com recompensas.", examples: ["/missoes listar", "/missoes coletar"] },
      { name: "economia", desc: "Configurações da economia (admin).", perms: ["Gerenciar servidor"] },
    ],
  },
  {
    key: "level",
    label: "Level & Social",
    emoji: "📈",
    intro: "XP, ranking, perfil social, badges, conquistas e reputação.",
    cmds: [
      {
        name: "level",
        desc: "Mostra seu nível, XP e progresso.",
        examples: ["/level", "/level usuario:@Fulano"],
        embed: {
          kind: "info",
          title: "📈 Nível 23 · Fulano",
          description: "XP **12.430 / 14.000** — faltam **1.570 XP** pro próximo nível.",
          fields: [
            { name: "Rank", value: "#7", inline: true },
            { name: "Mensagens", value: "3.482", inline: true },
            { name: "Voz", value: "42h", inline: true },
          ],
        },
      },
      { name: "rank", desc: "Card visual do seu nível.", examples: ["/rank", "/rank usuario:@Fulano"] },
      { name: "leveltop", desc: "Ranking de XP do servidor.", examples: ["/leveltop"] },
      { name: "levelreward", desc: "Configura recompensas por nível (admin).", perms: ["Gerenciar servidor"] },
      { name: "temporada", desc: "Status da temporada atual de level." },
      {
        name: "perfil",
        desc: "Perfil social: bio, badges, banner, reputação.",
        examples: ["/perfil ver usuario:@Fulano", "/perfil editar accent_color:#7c3aed", "/perfil badges b1:early-supporter"],
        embed: {
          kind: "info",
          title: "Fulano · Lendário 🏆",
          description: "_Aprendendo Discord um comando por vez._",
          fields: [
            { name: "Reputação", value: "⭐ 42", inline: true },
            { name: "Views", value: "👁️ 1.2k", inline: true },
            { name: "Badges", value: "🥇 🛡️ 🎉", inline: true },
          ],
        },
      },
      {
        name: "rep",
        desc: "Dá +1 reputação a um usuário.",
        cooldown: "12h",
        examples: ["/rep dar usuario:@Fulano", "/rep top"],
        embed: { kind: "success", title: "⭐ Reputação enviada!", description: "<@123> agora tem **43** rep." },
      },
      { name: "toprep", desc: "Top 10 de reputação do servidor." },
      { name: "badges", desc: "Listar, ver, dar ou remover badges.", examples: ["/badges listar", "/badges minhas", "/badges dar usuario:@Fulano codigo:vip"], perms: ["Staff p/ dar/remover"] },
      { name: "conquistas", desc: "Suas conquistas desbloqueadas." },
    ],
  },
  {
    key: "fun",
    label: "Diversão",
    emoji: "🎉",
    intro: "Memes, dados, 8ball, coinflip e avatar.",
    cmds: [
      { name: "meme", desc: "Manda um meme aleatório.", cooldown: "5s" },
      {
        name: "8ball",
        desc: "Bola 8 mágica: pergunte e descubra.",
        examples: ["/8ball pergunta:vou ser rico?"],
        embed: { kind: "fun", title: "🎱 Bola 8 mágica", description: "**Pergunta:** vou ser rico?\n**Resposta:** As estrelas dizem que sim." },
      },
      { name: "dice", desc: "Rola um dado.", examples: ["/dice lados:20"] },
      {
        name: "coinflip",
        desc: "Cara ou coroa.",
        embed: { kind: "fun", title: "🪙 Cara ou coroa", description: "Caiu **cara**! 🪙" },
      },
      { name: "avatar", desc: "Mostra o avatar de um usuário em alta resolução.", examples: ["/avatar usuario:@Fulano"] },
    ],
  },
  {
    key: "interaction",
    label: "Interação",
    emoji: "💞",
    intro: "Hug, kiss, slap, ship, marry — e GIFs animados.",
    cmds: [
      {
        name: "hug",
        desc: "Abraça alguém.",
        examples: ["/hug usuario:@Fulano"],
        embed: { kind: "fun", title: "🤗 Abraço", description: "Fulano deu um abraço apertado em Beltrano. 🤗" },
      },
      { name: "kiss", desc: "Beija alguém." },
      { name: "slap", desc: "Dá um tapa cinematográfico." },
      { name: "pat", desc: "Faz carinho." },
      { name: "bonk", desc: "Bonk!" },
      { name: "cuddle", desc: "Chamego." },
      { name: "poke", desc: "Cutuca." },
      {
        name: "ship",
        desc: "Mostra a compatibilidade entre dois usuários.",
        examples: ["/ship a:@Fulano b:@Beltrano"],
        embed: { kind: "fun", title: "💞 Shippando", description: "**Fulano + Beltrano** = **87%** ❤️" },
      },
      { name: "marry", desc: "Pede alguém em casamento.", cooldown: "10s" },
      { name: "divorce", desc: "Termina seu casamento atual." },
    ],
  },
  {
    key: "events",
    label: "Eventos",
    emoji: "🎊",
    intro: "Giveaways e enquetes da comunidade.",
    cmds: [
      {
        name: "giveaway",
        desc: "Cria sorteios com requisitos e reroll.",
        perms: ["Gerenciar servidor"],
        examples: ["/giveaway criar premio:Nitro duracao:1d ganhadores:1"],
        embed: {
          kind: "info",
          title: "🎉 GIVEAWAY — Nitro Clássico",
          description: "Reaja com 🎉 pra participar!\n\n**Ganhadores:** 1\n**Termina:** <t:0:R>",
          footer: "Hospedado por Fulano",
        },
      },
      { name: "enquete", desc: "Cria votações com botões e prazo.", examples: ["/enquete criar pergunta:pizza ou hambúrguer?"] },
    ],
  },
  {
    key: "utility",
    label: "Utilidades",
    emoji: "🧰",
    intro: "Ping, info, lembretes, central de ajuda e mais.",
    cmds: [
      {
        name: "help",
        desc: "Central de ajuda interativa do bot.",
        examples: ["/help", "/help comando nome:saldo", "/help buscar termo:ticket"],
      },
      {
        name: "ping",
        desc: "Latência e saúde do bot.",
        cooldown: "3s",
        embed: { kind: "success", title: "🚀 Pong!", description: "API: **42ms** · WebSocket: **38ms**" },
      },
      { name: "botinfo", desc: "Informações técnicas do Zenox." },
      { name: "serverinfo", desc: "Informações do servidor." },
      { name: "userinfo", desc: "Informações de um usuário.", examples: ["/userinfo usuario:@Fulano"] },
      {
        name: "lembrete",
        desc: "Cria um lembrete pessoal.",
        examples: ["/lembrete criar quando:1h mensagem:beber água"],
        embed: { kind: "success", title: "⏰ Lembrete agendado", description: "Vou te lembrar em **1h**." },
      },
      { name: "anuncio", desc: "Envia um anúncio formatado (staff).", perms: ["Staff"] },
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
      { name: "config", desc: "Configurações gerais do bot.", perms: ["Gerenciar servidor"] },
      { name: "automod", desc: "Filtros automáticos: spam, links, palavras.", perms: ["Gerenciar servidor"] },
      { name: "embed", desc: "Editor de embeds personalizados.", perms: ["Gerenciar mensagens"] },
      { name: "logs", desc: "Configura canais de log por categoria.", perms: ["Gerenciar servidor"] },
      { name: "customcommand", desc: "Cria comandos personalizados do servidor.", perms: ["Gerenciar servidor"] },
    ],
  },
  {
    key: "premium",
    label: "Premium",
    emoji: "💎",
    intro: "Benefícios VIP e gestão de assinaturas.",
    cmds: [
      {
        name: "premium",
        desc: "Status, ativação e benefícios premium.",
        examples: ["/premium status", "/premium ativar codigo:XYZ-123", "/premium beneficios"],
        embed: {
          kind: "info",
          title: "💎 Plano Premium",
          description: "Você é **Premium Gold** até <t:0:D>.",
          fields: [
            { name: "Slots de loja", value: "Ilimitados", inline: true },
            { name: "AutoMod IA", value: "Ativo", inline: true },
          ],
        },
      },
      { name: "vip", desc: "Comandos exclusivos para VIPs." },
      { name: "admin-premium", desc: "Gerenciamento de premium (staff).", perms: ["Owner"] },
    ],
  },
];

const KIND_STYLES: Record<NonNullable<EmbedPreview["kind"]>, string> = {
  success: "border-l-emerald-500",
  error: "border-l-red-500",
  warn: "border-l-amber-500",
  info: "border-l-primary",
  fun: "border-l-fuchsia-500",
};

function CommandsPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);

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
            <Link to="/" className="hidden text-muted-foreground hover:text-foreground sm:inline">Início</Link>
            <Link to="/dashboard" className="hidden text-muted-foreground hover:text-foreground sm:inline">Dashboard</Link>
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
            Cada comando mostra exemplos, cooldown, permissões e um preview do embed de resposta.
            Clique pra expandir.
          </p>

          <div className="mt-8 flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2.5 focus-within:border-primary/60">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar comando… ex: ban, daily, perfil"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {q && (
              <button onClick={() => setQ("")} className="text-xs text-muted-foreground hover:text-foreground">
                limpar
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip active={active === "all"} onClick={() => setActive("all")}>Todos</Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.key} active={active === c.key} onClick={() => setActive(c.key)}>
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </Chip>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mt-14 space-y-12">
          {filtered.length === 0 && (
            <p className="rounded-lg border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
              Nenhum comando encontrado para “{q}”. Tenta outro termo.
            </p>
          )}
          {filtered.map((cat) => (
            <div key={cat.key}>
              <div className="mb-5 border-b border-border pb-3">
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {cat.emoji} {cat.label} — {cat.cmds.length}
                </p>
                <h2 className="text-xl font-semibold tracking-tight">{cat.intro}</h2>
              </div>
              <div className="space-y-2">
                {cat.cmds.map((cmd) => {
                  const id = `${cat.key}:${cmd.name}`;
                  const isOpen = open === id;
                  return (
                    <CommandRow
                      key={id}
                      cmd={cmd}
                      open={isOpen}
                      onToggle={() => setOpen(isOpen ? null : id)}
                    />
                  );
                })}
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

function Chip({
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

function CommandRow({ cmd, open, onToggle }: { cmd: Cmd; open: boolean; onToggle: () => void }) {
  const hasDetails = !!(cmd.examples?.length || cmd.embed || cmd.perms?.length);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card/40">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-sm font-semibold text-primary">/{cmd.name}</code>
            {cmd.cooldown && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Clock className="size-3" /> {cmd.cooldown}
              </span>
            )}
            {cmd.perms?.slice(0, 1).map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                <Shield className="size-3" /> {p}
              </span>
            ))}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{cmd.desc}</p>
        </div>
        {hasDetails && (
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && hasDetails && (
        <div className="grid gap-4 border-t border-border px-4 py-4 sm:grid-cols-2">
          <div className="space-y-4">
            {cmd.perms?.length ? (
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Permissões
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cmd.perms.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-foreground"
                    >
                      <Shield className="size-3 text-muted-foreground" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {cmd.examples?.length ? (
              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Exemplos
                </p>
                <div className="space-y-1.5">
                  {cmd.examples.map((ex) => (
                    <div
                      key={ex}
                      className="flex items-start gap-2 rounded-md border border-border bg-background/60 px-2.5 py-1.5"
                    >
                      <Terminal className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <code className="break-all font-mono text-xs text-foreground">{ex}</code>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Preview do embed
            </p>
            {cmd.embed ? <EmbedCard embed={cmd.embed} /> : (
              <p className="rounded-md border border-dashed border-border bg-background/40 p-3 text-xs text-muted-foreground">
                Esse comando não responde com embed (mensagem simples ou painel interativo).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmbedCard({ embed }: { embed: EmbedPreview }) {
  const border = KIND_STYLES[embed.kind ?? "info"];
  return (
    <div className={`rounded-md border border-border border-l-4 bg-background/80 p-3 ${border}`}>
      <p className="text-sm font-semibold text-foreground">{embed.title}</p>
      {embed.description && (
        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
          {embed.description}
        </p>
      )}
      {embed.fields?.length ? (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {embed.fields.map((f) => (
            <div key={f.name} className={f.inline === false ? "col-span-3" : ""}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground">{f.name}</p>
              <p className="text-xs text-muted-foreground">{f.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {embed.footer && (
        <p className="mt-2 border-t border-border pt-1.5 text-[10px] text-muted-foreground">
          {embed.footer}
        </p>
      )}
    </div>
  );
}
