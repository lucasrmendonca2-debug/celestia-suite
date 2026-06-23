# 🟣 Zenox — Bot Discord multifuncional

Bot Discord profissional, modular e escalável com:

- 🛡️ **Moderação** — `/banir`, `/banirtemp`, `/expulsar`, `/silenciar`, `/silenciartemp`, `/dessilenciar`, `/avisar`, `/avisos`, `/removeraviso`, `/limpar`, `/lentidao`, `/bloquear`, `/desbloquear`, `/apelar`, `/apelacoes`, `/historico`, `/caso`, `/modstats`, `/nick`, `/nota`
- 🎫 **Tickets** — painéis com botão, permissões granulares por cargo, claim, tags, notas, transcripts e logs
- 💎 **VIP/Premium** — códigos de ativação, planos com expiração, multiplicadores de XP/coins, cargos automáticos
- 💰 **Economia** — `/saldo`, `/diario` (com streak), `/trabalhar`, `/crime`, `/roubar`, `/pagar`, `/depositar`, `/sacar`, `/loja`, `/inventario`, `/top`
- 📈 **Level/XP** — XP por mensagem com cooldown anti-spam, `/rank`, `/leveltop`, `/levelreward` (cargos automáticos)
- 💞 **Interação** — `/hug`, `/kiss`, `/slap`, `/pat`, `/bonk`, `/cuddle`, `/poke`, `/ship`, `/casar`, `/divorciar`
- 🎉 **Diversão** — `/8ball`, `/avatar`, `/coinflip`, `/dado`, `/meme`
- 🎊 **Sorteios** — `/giveaway start|end|reroll|list` com botão e sorteio automático
- 🤖 **AutoMod** — anti-link, anti-invite, anti-spam, blacklist de palavras, whitelist por cargo/canal
- 🧠 **Custom Commands** — variáveis `{user}`, `{server}`, `{channel}`, suporte a embed
- 🎨 **Editor de Embeds** — `/embed` com cores/imagens/footer + templates salvos
- ⚙️ **Configuração granular** — feita pelo dashboard web (TanStack Start)

> ⚠️ **Onde isso roda?** O bot é um processo Node.js **persistente** (WebSocket sempre conectado). Hospede em **Railway**, **Fly.io**, **Render** ou VPS — não funciona em runtimes serverless de borda.

---

## 🧱 Stack

- **Node 20+**, **TypeScript** (ESM)
- **discord.js v14**
- **Supabase** (Postgres + RLS + RPCs atômicos) via `@supabase/supabase-js`
- **Zod** para validação de env
- **Pino** para logs estruturados
- **Fastify** para a ponte HTTP com o dashboard (`/daily`, healthcheck, etc.)

## 📂 Estrutura

```
bot/
├─ src/
│  ├─ index.ts                    ← entry point
│  ├─ config/env.ts               ← validação de variáveis
│  ├─ database/
│  │  ├─ supabase.ts              ← cliente service-role (server-only)
│  │  └─ models.ts                ← shims de acesso a tabelas
│  ├─ http/server.ts              ← ponte HTTP com o dashboard
│  ├─ types/                      ← tipos compartilhados
│  └─ bot/
│     ├─ handlers/                ← loaders de commands/events
│     ├─ guards/                  ← permissões + cooldown
│     ├─ events/                  ← ready, interactionCreate, messageCreate...
│     ├─ utils/                   ← embed, logger, cache
│     ├─ commands/
│     │  ├─ moderation/           ← banir, expulsar, silenciar, avisar, casos...
│     │  ├─ tickets/              ← painel, fechar, adicionar
│     │  ├─ premium/              ← códigos, planos
│     │  ├─ economy/              ← saldo, diário, trabalho, crime, roubar, loja
│     │  ├─ level/                ← rank, leveltop, levelreward
│     │  ├─ utility/              ← ping, ajuda, userinfo, serverinfo
│     │  └─ fun/                  ← 8ball, avatar, dado, meme
│     └─ systems/
│        ├─ tickets/              ← lógica de tickets
│        ├─ moderation/           ← punições, casos, apelações, permissões
│        ├─ economy/              ← chamadas das RPCs atômicas
│        ├─ premium/              ← grant/revoke/expiração
│        ├─ logs/                 ← envio + persistência
│        ├─ welcome/              ← boas-vindas/saída
│        └─ scheduler.ts          ← cron para tempbans/tempmutes/premium
```

---

## 🚀 Instalação

### 1. Criar o bot no Discord

1. Acesse o [Developer Portal](https://discord.com/developers/applications)
2. **New Application** → dê o nome (ex: *Zenox*)
3. **Bot** → **Reset Token** → copie o token (é o `DISCORD_TOKEN`)
4. Ative em **Bot → Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Em **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissions: as necessárias (Ban, Kick, Manage Roles, Manage Channels, Manage Messages, Moderate Members, View Audit Log)

### 2. Conectar ao Supabase (Lovable Cloud)

O bot usa o mesmo banco do dashboard. Você precisa:

- `SUPABASE_URL` — URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY` — service role (bypassa RLS; só no servidor do bot, nunca no cliente)

O schema é gerenciado **exclusivamente via migrações do dashboard** (`supabase/migrations/*.sql`). O bot **não** cria nem altera tabelas. Operações sensíveis (economia, daily, compras na loja) usam RPCs atômicas (`economy_debit_wallet`, `economy_credit_wallet`, `economy_transfer_wallet`, `economy_claim_cooldown`, `shop_buy_atomic`, `daily_claim_atomic`, `cosmetic_purchase_global`, `level_add_xp`) para evitar race conditions.

### 3. Instalar dependências

```bash
cd bot
cp .env.example .env
# preencha DISCORD_TOKEN, DISCORD_CLIENT_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BOT_OWNER_ID

bun install
# ou: npm install / pnpm install
```

### 4. Registrar slash commands

```bash
# em um servidor de teste (instantâneo) — defina DISCORD_DEV_GUILD_ID no .env
bun run register

# globalmente (pode levar ~1h) — deixe DISCORD_DEV_GUILD_ID vazio
```

### 5. Rodar

```bash
bun run dev               # com hot-reload (tsx watch)
bun run build && bun run start   # produção
```

---

## 🌐 Deploy

### Railway (mais simples)
1. Conecte o repositório
2. Variáveis: copie tudo do `.env` (DISCORD_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BOT_API_SECRET, BOT_OWNER_ID, etc.)
3. Build: `bun install && bun run build`
4. Start: `bun run start`
5. Configure o `BOT_API_URL` no dashboard apontando para o endpoint HTTP público do bot (ex.: `https://seu-bot.up.railway.app`)

### Fly.io / Render / VPS
Mesmo fluxo: manter o processo Node vivo e expor a porta HTTP do `http/server.ts` para o dashboard chamar `/daily`.

---

## 🔐 Segurança

- **Nunca** comite o `.env`.
- `DISCORD_CLIENT_SECRET` só é usado no **dashboard web**, nunca no bot.
- `SUPABASE_SERVICE_ROLE_KEY` **só** no processo do bot — nunca no browser, nunca no client bundle do dashboard.
- `BOT_API_SECRET` autentica chamadas entre dashboard ↔ bot. Defina o mesmo valor dos dois lados.
- Cooldowns e saldos são persistidos via RPCs atômicas — sobrevivem a restart e bloqueiam double-spend.
- Logs sensíveis vão para tabelas (`mod_cases`, `moderation_logs`, `economy_transactions`) e canais configuráveis.

---

## 🧩 Adicionando um novo comando

Crie um arquivo em `src/bot/commands/<categoria>/<nome>.ts`:

```ts
import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "utility",
  cooldown: 5,
  data: new SlashCommandBuilder().setName("oi").setDescription("Saúda você"),
  async execute(interaction) {
    await interaction.reply({
      embeds: [brandEmbed({ title: `Olá, ${interaction.user.username}!` })],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
```

Depois rode `bun run register` no bot **e** `bun run sync-commands` na raiz do projeto (regenera `src/data/commands.json` consumido pelo dashboard).

## 🧩 Adicionando um novo sistema

1. Crie `src/bot/systems/<nome>/` com a lógica pura (sem dependência direta do Discord, se possível).
2. Se precisar persistir, adicione uma migração em `supabase/migrations/` no dashboard — o bot **não** roda DDL.
3. Crie comandos em `src/bot/commands/<nome>/`.
4. Se reage a eventos do Discord, adicione handler em `src/bot/events/`.
