/**
 * Mensagens centrais do Zenox.
 *
 * Toda string visível ao usuário final deve sair daqui (ou usar um helper daqui)
 * para manter a personalidade do bot consistente: brasileiro, amigável,
 * levemente carismático, profissional, sem clichês genéricos.
 *
 * Regra de ouro: nunca escreva "Comando executado com sucesso" no código.
 * Use `Msg.saved()`, `Msg.done(...)` ou crie uma variação aqui.
 */

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

export const Msg = {
  /* ---------- Sucesso ---------- */
  saved: () =>
    pick([
      "Prontinho! Configuração salva e já está valendo neste servidor. ✨",
      "Feito. As mudanças já estão ativas por aqui. 💜",
      "Salvei tudo certinho. Pode testar quando quiser.",
      "Show! Anotei tudo e já apliquei no servidor.",
      "Configuração no ponto. Já pode usar.",
    ]),
  done: (what: string) =>
    pick([
      `Pronto — ${what}.`,
      `Feito! ${what.charAt(0).toUpperCase() + what.slice(1)}.`,
      `Mandei ver: ${what}. ✨`,
      `Resolvido: ${what}.`,
    ]),
  applied: () =>
    pick([
      "Aplicado. ✅",
      "Tá valendo desde já.",
      "No ar! 🚀",
    ]),

  /* ---------- Erro ---------- */
  oops: () =>
    pick([
      "Ops, não consegui fazer isso. Verifique minhas permissões e tente de novo.",
      "Algo travou no caminho. Tenta de novo daqui a pouco?",
      "Não rolou dessa vez. Pode ser permissão ou um problema momentâneo.",
      "Eita, deu ruim. Dá uma conferida nos meus cargos e tenta de novo.",
    ]),
  missingPerm: (perm: string) =>
    `Você precisa da permissão **${perm}** pra usar isso por aqui.`,
  botMissingPerm: (perm: string) =>
    `Me falta a permissão **${perm}** pra executar essa ação. Ajusta meus cargos e tenta de novo? 🙏`,
  guildOnly: () => "Esse comando só funciona dentro de um servidor.",
  ownerOnly: () => "Só o dono do bot pode usar esse comando.",
  notFound: (what: string) =>
    pick([
      `Não achei ${what} por aqui.`,
      `${what.charAt(0).toUpperCase() + what.slice(1)} não rolou de localizar.`,
      `Hmm, ${what} parece não existir.`,
    ]),
  cooldown: (seconds: number) =>
    pick([
      `Calma aí! Aguarda **${seconds}s** antes de usar de novo. ⏳`,
      `Ufa, devagar com a alegria. Volta em **${seconds}s**.`,
      `Esse comando tá esquentando. Tenta de novo em **${seconds}s**.`,
    ]),

  /* ---------- Confirmações ---------- */
  confirmTitle: () => "Tem certeza?",
  cancelled: () =>
    pick([
      "Beleza, cancelei. Nada foi alterado.",
      "Cancelado. Tá tudo do jeito que estava.",
      "Sem problema, deixei como estava.",
    ]),

  /* ---------- Estados ---------- */
  empty: (what: string) =>
    pick([
      `Ainda não tem ${what} por aqui. Bora começar?`,
      `Nadinha de ${what} ainda. Que tal criar o primeiro?`,
      `Por enquanto, zero ${what}. Cê pode mudar isso. ✨`,
    ]),
  loading: () =>
    pick([
      "Só um instante…",
      "Trabalhando nisso…",
      "Calma, já te respondo… ⏳",
    ]),
  tip: (text: string) => `💡 **Dica:** ${text}`,

  /* ---------- Branding / institucional ---------- */
  premiumLocked: () =>
    "Esse recurso é exclusivo do **Zenox Premium** 💎. Ative no painel para liberar.",
  vipLocked: () =>
    "Esse comando é exclusivo para usuários **VIP** 💎. Use `/vip beneficios` pra saber como ativar.",
  moduleDisabled: (module: string) =>
    `O módulo **${module}** está desativado neste servidor. Um admin pode ligar em \`/config\`.`,
} as const;

function timeBucket(): "madrugada" | "manha" | "tarde" | "noite" {
  // Hora de Brasília (UTC-3) sem libs.
  const h = (new Date().getUTCHours() - 3 + 24) % 24;
  if (h < 5) return "madrugada";
  if (h < 12) return "manha";
  if (h < 18) return "tarde";
  return "noite";
}

export const Tone = {
  /** Saudações usadas em welcome/replies casuais — sazonais. */
  greet: (name: string) => {
    const bucket = timeBucket();
    const map: Record<ReturnType<typeof timeBucket>, string[]> = {
      madrugada: [`Ainda acordado, **${name}**? 🌙`, `Boa madrugada, **${name}**! ☕`],
      manha: [`Bom dia, **${name}**! ☀️`, `E aí, **${name}**, bora começar o dia! ✨`],
      tarde: [`Boa tarde, **${name}**! 👋`, `Opa, **${name}**! 💜`],
      noite: [`Boa noite, **${name}**! 🌙`, `Salve, **${name}**! ✨`],
    };
    return pick(map[bucket]);
  },
  /** Saudação genérica (sem nome) sazonal. */
  timeGreeting: () => {
    const bucket = timeBucket();
    const map: Record<ReturnType<typeof timeBucket>, string> = {
      madrugada: "Boa madrugada! 🌙",
      manha: "Bom dia! ☀️",
      tarde: "Boa tarde! 👋",
      noite: "Boa noite! 🌙",
    };
    return map[bucket];
  },
  /** Frases curtas usadas como tagline em embeds. */
  tagline: () =>
    pick([
      "Feito com 💜 para sua comunidade.",
      "Comunidade saudável, servidor feliz.",
      "Pra deixar seu Discord ainda melhor.",
      "Brasileiro, da gente pra gente. 🇧🇷",
    ]),
  /** Comemorações curtas para conquistas/level up. */
  celebrate: () =>
    pick([
      "Bora! 🎉",
      "Tá voando! 🚀",
      "Foi top! ✨",
      "Mandou bem! 👏",
      "Que orgulho! 💜",
    ]),
  /** Incentivos sutis pra ações leves (faltou só X xp etc). */
  encourage: () =>
    pick([
      "Tá quase lá!",
      "Continua assim!",
      "Falta pouquinho. 💪",
      "Mais um empurrãozinho!",
    ]),
} as const;
