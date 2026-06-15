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
    ]),
  done: (what: string) =>
    pick([
      `Pronto — ${what}.`,
      `Feito! ${what.charAt(0).toUpperCase() + what.slice(1)}.`,
      `Mandei ver: ${what}. ✨`,
    ]),

  /* ---------- Erro ---------- */
  oops: () =>
    pick([
      "Ops, não consegui fazer isso. Verifique minhas permissões e tente de novo.",
      "Algo travou no caminho. Tenta de novo daqui a pouco?",
      "Não rolou dessa vez. Pode ser permissão ou um problema momentâneo.",
    ]),
  missingPerm: (perm: string) =>
    `Você precisa da permissão **${perm}** pra usar isso por aqui.`,
  botMissingPerm: (perm: string) =>
    `Me falta a permissão **${perm}** pra executar essa ação. Ajusta meus cargos e tenta de novo? 🙏`,
  guildOnly: () => "Esse comando só funciona dentro de um servidor.",
  ownerOnly: () => "Só o dono do bot pode usar esse comando.",
  notFound: (what: string) => `Não achei ${what} por aqui.`,
  cooldown: (seconds: number) =>
    `Calma aí! Aguarda **${seconds}s** antes de usar de novo. ⏳`,

  /* ---------- Confirmações ---------- */
  confirmTitle: () => "Tem certeza?",
  cancelled: () => "Beleza, cancelei. Nada foi alterado.",

  /* ---------- Estados ---------- */
  empty: (what: string) => `Ainda não tem ${what} por aqui. Bora começar?`,
  loading: () => "Só um instante…",

  /* ---------- Branding / institucional ---------- */
  premiumLocked: () =>
    "Esse recurso é exclusivo do **Zenox Premium** 💎. Ative no painel para liberar.",
  moduleDisabled: (module: string) =>
    `O módulo **${module}** está desativado neste servidor. Um admin pode ligar em \`/config\`.`,
} as const;

export const Tone = {
  /** Saudações usadas em welcome/replies casuais. */
  greet: (name: string) =>
    pick([
      `E aí, **${name}**! 👋`,
      `Opa, **${name}**! 💜`,
      `Olá, **${name}**! ✨`,
    ]),
  /** Frases curtas usadas como tagline em embeds. */
  tagline: () =>
    pick([
      "Feito com 💜 para sua comunidade.",
      "Comunidade saudável, servidor feliz.",
      "Pra deixar seu Discord ainda melhor.",
    ]),
} as const;
