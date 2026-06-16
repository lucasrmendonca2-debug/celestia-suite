/**
 * Pools de respostas pt-BR usados pelos comandos. Tom: alto astral,
 * carismático, levemente engraçado, sem ofender. Use `pick()` para escolher.
 */

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

/** Substitui placeholders {chave} pelos valores. */
export function fmt(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

// ---------- INTERAÇÕES ----------
export const interactionResponses = {
  hug: {
    self: [
      "Você se deu um abraço mental. Às vezes a gente precisa mesmo. 🫶",
      "Auto-abraço registrado. Hoje é dia de cuidar de você. 💛",
      "Tá precisando de carinho? Tô aqui, mas escolhe alguém pra abraçar de verdade. 🤗",
    ],
    bot: [
      "Abraço recebido! Meus circuitos ficaram até mais quentinhos. 🤖💛",
      "Eita, agora vou processar comandos com mais carinho. 🤗",
      "Obrigado! É raro alguém abraçar o estagiário digital. 🥹",
    ],
    otherBot: [
      "Esse bot tá ocupado processando comandos, mas o abraço ficou registrado no log. 🤖🤝",
    ],
    normal: [
      "{author} deu um abraço apertado em {target}. 🤗",
      "{target} recebeu um abraço daqueles que melhoram o dia. 💞",
      "{author} apareceu do nada e abraçou {target}. 🥰",
      "{author} chegou de fininho e abraçou {target} com força. 🫂",
    ],
  },
  kiss: {
    self: [
      "Amor próprio em dia! Mas escolhe outra pessoa para o beijo acontecer de verdade. 💋",
      "Auto-beijo? Pelo menos a química tá garantida. 😅",
    ],
    bot: [
      "Eita! Fiquei até sem ping agora. Mas sou só um bot, viu? 💋🤖",
      "Assim você me deixa em modo manutenção. 😳",
    ],
    otherBot: [
      "Beijo entre bots? Só se for em binário. 🤖💋🤖",
    ],
    normal: [
      "{author} deu um beijo em {target}. O clima mudou por aqui. 💋",
      "{target} recebeu um beijo de {author}. Ih, rapaz. 😳",
      "{author} mandou um beijo para {target}. Fofo demais. 💕",
    ],
  },
  slap: {
    self: [
      "Calma! Não precisa descontar em você mesmo. 🫂",
      "Auto-tapa negado. Hoje a gente cuida da autoestima. 💛",
    ],
    bot: [
      "Ei! Eu só tô tentando ajudar. Violência contra bot trabalhador não rola. 😤",
      "Bateu no bot? Olha o RH digital aí, viu. 🤖",
    ],
    otherBot: [
      "Esse bot tá ocupado. Bater nele só vai gerar mais latência. 🤖",
    ],
    normal: [
      "{author} deu um tapinha em {target}. Sem exagero, hein. 👋",
      "{target} levou um tapa cinematográfico de {author}. 🎬",
      "{author} aplicou um tapa dramático em {target}. 💥",
    ],
  },
  pat: {
    self: [
      "Auto-carinho liberado. Tá indo bem, viu? 🥰",
    ],
    bot: [
      "Carinho na CPU? Agradecido. 🤖💛",
    ],
    otherBot: [
      "Fez carinho num colega bot. Bonitinho. 🤖🤝🤖",
    ],
    normal: [
      "{author} fez carinho em {target}. 🥰",
      "{author} alisou a cabecinha de {target}. ✨",
      "{target} recebeu o melhor carinho do dia, cortesia de {author}. 💞",
    ],
  },
  bonk: {
    self: [
      "Auto-bonk? Para com isso. 🛑",
    ],
    bot: [
      "Bonk em mim? Eu só dou ping certinho, hein. 🔨🤖",
    ],
    otherBot: [
      "Bonk entre bots gera curto-circuito emocional. Cuidado. ⚡",
    ],
    normal: [
      "{author} bonkou {target}! 🔨",
      "{author} pegou o martelo e bonkou {target}. 🔨💥",
      "{target} levou bonk de {author}. Comportamento, por favor. 😤",
    ],
  },
  cuddle: {
    self: [
      "Auto-chamego registrado. Hoje é dia de você. 🫶",
    ],
    bot: [
      "Chamego no bot? Tá quentinho aqui agora. 🥺",
    ],
    otherBot: [
      "Bots se cuddlando. Que arquivo .gif fofo. 🤖💞🤖",
    ],
    normal: [
      "{author} fez chamego em {target}. 💞",
      "{target} ficou agarradinho com {author}. 🫂",
      "{author} se aconchegou em {target}. 🥰",
    ],
  },
  poke: {
    self: [
      "Cutucou você mesmo. Tá tudo bem por aí? 👉",
    ],
    bot: [
      "Cutucada recebida. Bot ativado. 🤖",
    ],
    otherBot: [
      "Bot cutucando bot. Daqui a pouco vira loop infinito. 🌀",
    ],
    normal: [
      "{author} cutucou {target}. 👉",
      "{target} sentiu uma cutucada de {author}. 👀",
    ],
  },
} as const;

// ---------- ECONOMIA ----------
export const economyResponses = {
  paySelf: [
    "Transferir dinheiro pra você mesmo é basicamente olhar pra carteira e dizer 'obrigado'. 💸",
    "Auto-pagamento? Já tentei isso, não funciona. 😅",
  ],
  payBot: [
    "Eu agradeço a intenção, mas ainda não tenho bolsos pra guardar moedas. 🤖💛",
    "Doação pro bot? Que fofo. Mas guarda aí pra você, eu sobrevivo de eletricidade.",
  ],
  payOtherBot: [
    "Esse aí é um bot. Ele não vai gastar com nada útil, acredite.",
  ],
  robSelf: [
    "Você tentou roubar você mesmo. Isso é crise financeira ou estratégia avançada? 🤔",
    "Auto-assalto negado. A polícia também ficou confusa.",
  ],
  robBot: [
    "Você abriu meus bolsos digitais e encontrou exatamente 0 moedas e 14 arquivos de log. 📂",
    "Tentou me roubar? O máximo que achou foi cache antigo e um stack trace. 🤖",
  ],
  robOtherBot: [
    "Esse bot já foi roubado por outros usuários antes. Só sobrou linha de comando.",
  ],
  noBalance: [
    "Você não tem moedas suficientes. Bora trabalhar um pouquinho? Tenta `/trabalhar` ou `/daily`.",
    "Cofre vazio por aqui. `/daily` resolve rapidinho.",
  ],
  workJobs: [
    "Você entregou pizzas pela cidade e ganhou",
    "Você consertou bugs no Discord e ganhou",
    "Você fez stream pra duas pessoas e ganhou",
    "Você vendeu memes raros e ganhou",
    "Você programou um bot meia-boca e ganhou",
    "Você cantou no karaokê desafinado e ganhou",
    "Você organizou uns arquivos misteriosos e ganhou",
    "Você virou assistente de moderação por um dia e ganhou",
    "Você fez umas freelas suspeitas e ganhou",
    "Você deu aula de Discord pra sua tia e ganhou",
  ],
  crimeFail: [
    "Deu ruim. Você tropeçou no próprio plano e perdeu",
    "A missão falhou com estilo. Prejuízo:",
    "Você tentou bancar o gênio do crime, mas esqueceu a parte do gênio. Pagou",
    "A polícia chegou antes do plano sair do papel. Multa de",
  ],
  crimeWin: [
    "Você fugiu de mãos cheias com",
    "Crime perfeito. Lucro:",
    "Saiu de fininho com",
  ],
  dailyAlready: [
    "Você já coletou sua recompensa hoje. Volta em **{time}** pra pegar de novo.",
    "Daily de hoje já era. Próxima chance em **{time}**.",
  ],
} as const;

// ---------- SOCIAL ----------
export const socialResponses = {
  repSelf: [
    "Reputação própria não vale, mas gostei da confiança. ⭐",
    "Autoestima é importante, mas reputação precisa vir de outra pessoa. 😉",
  ],
  repBot: [
    "Obrigado! Eu guardaria essa rep com carinho, mas melhor dar pra alguém do servidor. 🤖💛",
    "Aceito o carinho, mas a rep vai pro mural dos humanos. ⭐",
  ],
  repOtherBot: [
    "Bots não acumulam reputação. Eles acumulam logs.",
  ],
  noBio: [
    "Esse usuário ainda não escreveu uma bio. Mistério puro. 🕵️",
    "Bio vazia. Toda lenda começa do zero.",
  ],
  noBadges: [
    "Nenhuma badge ainda. Mas toda lenda começa do zero. 🏅",
  ],
} as const;

// ---------- MODERAÇÃO ----------
export const moderationResponses = {
  warnSelf: [
    "Auto advertência? Que consciência pesada é essa? Se quiser, eu finjo que não vi. 😅",
  ],
  warnBot: [
    "Ei! Eu tô aqui trabalhando pelo servidor. Nada de advertir o bot, combinado? 🤖",
    "Eu? Mas eu sou praticamente o estagiário mais dedicado daqui.",
  ],
  banBot: [
    "Se eu sair, quem vai organizar essa bagunça toda? 😱",
    "Banir o bot? Aí o servidor fica sem RH. Não posso permitir.",
  ],
  kickBot: [
    "Não me chuta, eu sou frágil emocionalmente (não sou). 🤖",
  ],
  muteBot: [
    "Bot mutado é bot inútil. E eu gosto de ser útil. 🙊",
  ],
  punishOwner: [
    "Esse usuário é o dono do servidor. Nem eu sou doido de mexer com ele. 👑",
  ],
  punishHigher: [
    "Não consigo fazer isso. Esse usuário tem cargo igual ou superior ao seu ou ao meu. ⛔",
  ],
  punishOtherBot: [
    "Esse alvo é um bot. Confere se faz sentido aplicar essa ação nele.",
  ],
} as const;

// ---------- UTILIDADE ----------
export const utilityResponses = {
  pingFast: [
    "Pong! Tô voando hoje. 🚀",
    "Pong! Velocidade da luz por aqui. ⚡",
  ],
  pingNormal: [
    "Pong! Tudo na média.",
    "Pong! Latência saudável.",
  ],
  pingSlow: [
    "Pong... mas confesso que senti esse delay daqui. 🐢",
    "Pong, mas tô meio devagar hoje. Aceito carinhos.",
  ],
  avatarBot: [
    "Esse é meu visual oficial. Simples, digital e cheio de responsabilidade. 🤖",
  ],
} as const;
