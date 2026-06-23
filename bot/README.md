# Zenox — Bot Discord multifuncional

Bot Discord profissional, modular e escalável com moderação, tickets,
economia, level, premium/VIP, sorteios, automod, custom commands e editor
de embeds. Toda configuração vive no dashboard web ([README raiz](../README.md)).

> **Onde isso roda?** O bot é um processo Node.js **persistente**
> (WebSocket sempre conectado). Hospede em **Railway**, **Fly.io**,
> **Render** ou VPS — não funciona em runtimes serverless de borda.

## Stack

- **Node 20+**, **TypeScript** (ESM)
- **discord.js v14**
- **Supabase** (Postgres + RLS + RPCs atômicas) via `@supabase/supabase-js`
  com service role
- Bridge HTTP nativa (`node:http`) protegida por `BOT_API_SECRET` para o
  fluxo de `/daily` no dashboard
- **Zod** para validação de env
- **Pino** para logs estruturados

> Não usa Mongoose, Prisma nem MongoDB. Toda persistência é Supabase.
> Existe um shim antigo em `src/database/models.ts` que está em remoção
> gradual — novas features devem usar o cliente Supabase ou RPCs.

## Estrutura

```
bot/
├─ src/
│  ├─ index.ts                    ← entry point
│  ├─ config/env.ts               ← validação de variáveis (Zod)
│  ├─ database/
│  │  ├─ supabase.ts              ← cliente service-role (server-only)
│  │  └─ models.ts                ← shim em remoção gradual
│  ├─ http/server.ts              ← bridge HTTP com o dashboard
│  ├─ scripts/registerCommands.ts ← `bun run register`
│  └─ bot/
│     ├─ handlers/                ← loaders de commands/events
│     ├─ guards/                  ← permissões + cooldown
│     ├─ events/                  ← ready, interactionCreate, ...
│     ├─ utils/                   ← embed, logger, cache
│     ├─ commands/<categoria>/    ← arquivos `_*.ts` são auxiliares e ignorados
│     └─ systems/
│        ├─ tickets/  moderation/  economy/  premium/
│        ├─ logs/     welcome/     level/    cosmetics/
│        └─ scheduler.ts          ← cron para tempbans/tempmutes/premium
```

## Instalação

### 1. Criar o bot no Discord

1. Acesse o [Developer Portal](https://discord.com/developers/applications).
2. **New Application** → escolha o nome.
3. **Bot → Reset Token** → copie (`DISCORD_TOKEN`).
4. Em **Bot → Privileged Gateway Intents** ative:
   - Server Members Intent
   - Message Content Intent
5. Em **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissões: Ban, Kick, Manage Roles, Manage Channels,
     Manage Messages, Moderate Members, View Audit Log

### 2. Conectar ao Supabase (Lovable Cloud)

O bot usa o mesmo banco do dashboard:

- `SUPABASE_URL` — URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY` — service role (bypassa RLS; só no processo
  do bot, nunca no cliente)

O schema é gerenciado **exclusivamente via migrações do dashboard**
(`supabase/migrations/*.sql`). O bot **não cria nem altera tabelas**.
Operações sensíveis (economia, daily, compras, level) usam RPCs atômicas:
`economy_debit_wallet`, `economy_credit_wallet`, `economy_transfer_wallet`,
`economy_claim_cooldown`, `economy_bank_transfer`, `shop_buy_atomic`,
`daily_claim_atomic`, `cosmetic_purchase_global`, `level_add_xp`.

### 3. Instalar e configurar

```bash
cd bot
cp .env.example .env
# preencha DISCORD_TOKEN, DISCORD_CLIENT_ID, BOT_OWNER_ID,
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BOT_API_SECRET, APP_URL

bun install
```

### 4. Registrar slash commands

```bash
# Dev: defina DISCORD_DEV_GUILD_ID no .env → registro instantâneo
bun run register

# Produção (global): deixe DISCORD_DEV_GUILD_ID vazio → propaga em ~1h
bun run register
```

### 5. Rodar

```bash
bun run dev              # tsx watch
bun run typecheck        # tsc --noEmit
bun run build && bun run start   # produção
```

## Scripts

| Script              | O que faz                                          |
| ------------------- | -------------------------------------------------- |
| `bun run dev`       | Hot-reload (`tsx watch src/index.ts`)              |
| `bun run build`     | Compila para `dist/`                               |
| `bun run start`     | Executa o build (`node dist/index.js`)             |
| `bun run register`  | Registra slash commands (guild se `DISCORD_DEV_GUILD_ID`, senão global) |
| `bun run typecheck` | `tsc --noEmit` para validação estrita              |

## Deploy

### Railway (mais simples)
1. Conecte o repositório (subpasta `bot/`).
2. Variáveis: copie tudo do `.env` (`DISCORD_TOKEN`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `BOT_API_SECRET`, `BOT_OWNER_ID`, `APP_URL`,
   opcionalmente `BOT_API_ALLOWED_ORIGINS`).
3. Build: `bun install && bun run build`
4. Start: `bun run start`
5. Configure `BOT_API_URL` no dashboard apontando para o endpoint público
   do bot (ex.: `https://seu-bot.up.railway.app`).

### Fly.io / Render / VPS
Mesmo fluxo: manter o processo Node vivo e expor a porta HTTP do
`http/server.ts` para o dashboard chamar `/api/daily/*`.

## Segurança

- **Nunca** commite o `.env`.
- `DISCORD_CLIENT_SECRET` só é usado no **dashboard**, nunca no bot.
- `SUPABASE_SERVICE_ROLE_KEY` **só** no processo do bot — nunca no
  browser nem no client bundle do dashboard.
- `BOT_API_SECRET` autentica chamadas dashboard ↔ bot via header
  `x-bot-secret` (comparação `timingSafeEqual`). Defina o mesmo valor
  dos dois lados.
- `BOT_API_ALLOWED_ORIGINS` (CSV) restringe CORS a origens conhecidas;
  default é o `APP_URL`.
- Cooldowns e saldos são persistidos via RPCs atômicas — sobrevivem a
  restart e bloqueiam double-spend.
- Logs sensíveis vão para tabelas (`mod_cases`, `moderation_logs`,
  `economy_transactions`) e canais configuráveis.

## Troubleshooting

- **Comandos não aparecem:** rode `bun run register`. Em dev, garanta
  `DISCORD_DEV_GUILD_ID`.
- **`unauthorized` no bridge:** `BOT_API_SECRET` divergente entre bot e
  dashboard.
- **`origin_not_allowed`:** adicione o domínio do dashboard em
  `BOT_API_ALLOWED_ORIGINS`.
- **`feature premium bloqueada`:** servidor sem plano ativo — configure
  em `Premium`.

## Adicionando um novo comando

Crie `src/bot/commands/<categoria>/<nome>.ts`. Arquivos com prefixo `_`
(ex.: `_factory.ts`) são tratados como auxiliares e ignorados pelo loader.

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

Depois rode `bun run register` no bot **e** `bun run sync-commands` na
raiz (regenera `src/data/commands.json` consumido pelo dashboard).

## Adicionando um novo sistema

1. Crie `src/bot/systems/<nome>/` com a lógica pura (idealmente sem
   dependência direta do Discord).
2. Se precisar persistir, adicione uma migração em
   `supabase/migrations/` no dashboard — o bot **não roda DDL**.
3. Crie comandos em `src/bot/commands/<nome>/`.
4. Se reage a eventos do Discord, adicione handler em `src/bot/events/`.
