# 🟣 Zenox — Bot Discord multifuncional

Bot profissional para Discord com **moderação, tickets, VIP, logs, welcome, economia e level**.
Stack moderna, código modular e escalável.

> ⚠️ **Onde isso roda?** O bot é um processo Node.js **persistente** (precisa de WebSocket sempre conectado). Hospede em **Railway**, **Fly.io**, **Render**, **VPS** ou similar — não funciona em ambientes serverless de borda (Cloudflare Workers, Vercel Edge).

---

## 🧱 Stack

- **Node 20+**, **TypeScript** (ESM)
- **discord.js v14**
- **Prisma ORM** + **PostgreSQL** (Supabase recomendado)
- **Zod** para validação de env
- **Pino** para logs estruturados

## 📂 Estrutura

```
bot/
├─ prisma/schema.prisma       ← todas as tabelas
├─ src/
│  ├─ index.ts                ← entry point
│  ├─ config/env.ts           ← validação de variáveis
│  ├─ database/client.ts      ← Prisma singleton
│  ├─ types/                  ← tipos compartilhados
│  └─ bot/
│     ├─ handlers/            ← loaders de commands/events
│     ├─ guards/              ← permissões + cooldown
│     ├─ events/              ← ready, interactionCreate, etc.
│     ├─ utils/               ← embed, logger, cache
│     ├─ commands/
│     │  ├─ moderation/       ← ban, kick, mute, warn, clear, lock...
│     │  ├─ tickets/          ← panel, close, add
│     │  ├─ vip/              ← vip conceder/remover/info
│     │  ├─ utility/          ← ping, help, userinfo, serverinfo
│     │  ├─ config/           ← config logs/welcome/vip
│     │  └─ fun/              ← 8ball, avatar
│     └─ systems/
│        ├─ tickets/          ← lógica de tickets
│        ├─ moderation/       ← punições
│        ├─ vip/              ← grant/revoke/expiração
│        ├─ logs/             ← envio + persistência
│        ├─ welcome/          ← boas-vindas/saída
│        └─ scheduler.ts      ← cron para VIPs/tempbans expirarem
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
   - Permissions: `Administrator` (ou apenas o necessário: Ban, Kick, Manage Roles, Manage Channels, Manage Messages, Moderate Members, View Audit Log)
6. Copie a URL e convide o bot no seu servidor de testes.

### 2. Criar o banco (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com)
2. **Project Settings → Database → Connection string → URI**
3. Use a conexão **Session (porta 5432)** para o bot (Node persistente).

### 3. Instalar dependências

```bash
cd bot
cp .env.example .env
# preencha DISCORD_TOKEN, DISCORD_CLIENT_ID, DATABASE_URL, BOT_OWNER_ID

# instale (use bun, pnpm ou npm)
bun install
# ou: npm install
```

### 4. Subir o schema

```bash
bunx prisma migrate dev --name init
# em produção:
bunx prisma migrate deploy
```

### 5. Registrar slash commands

```bash
# em um servidor de teste (instantâneo) — defina DISCORD_DEV_GUILD_ID no .env
bun run register

# globalmente (pode levar ~1h para aparecer)
# basta deixar DISCORD_DEV_GUILD_ID vazio
```

### 6. Rodar

```bash
bun run dev     # com hot-reload (tsx watch)
# produção:
bun run build && bun run start
```

---

## 🌐 Deploy

### Railway (mais simples)
1. Conecte o repositório
2. Variáveis: copie tudo do `.env`
3. Build: `bun install && bunx prisma generate && bun run build`
4. Start: `bunx prisma migrate deploy && bun run start`

### Fly.io / Render / VPS
Mesmo fluxo: precisa rodar `prisma migrate deploy` no startup e manter o processo vivo.

---

## ✨ Comandos prontos

| Categoria | Comandos |
|---|---|
| 🛡️ Moderação | `/ban`, `/kick`, `/mute`, `/unmute`, `/warn`, `/warns`, `/clear`, `/slowmode`, `/lock`, `/unlock` |
| 🎫 Tickets | `/ticket-panel`, `/close`, `/ticket-add` (+ botões interativos) |
| 💎 VIP | `/vip conceder`, `/vip remover`, `/vip info` |
| ⚙️ Config | `/config logs set`, `/config welcome set\|toggle`, `/config vip role` |
| 🧰 Utilidades | `/ping`, `/help`, `/userinfo`, `/serverinfo` |
| 🎉 Diversão | `/8ball`, `/avatar` |

---

## 🧩 Adicionando um novo comando

Crie um arquivo em `src/bot/commands/<categoria>/<nome>.ts`:

```ts
import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";

const command: SlashCommand = {
  category: "utility",
  cooldown: 5,
  data: new SlashCommandBuilder().setName("oi").setDescription("Saúda você"),
  async execute(interaction) {
    await interaction.reply({ embeds: [brandEmbed({ title: `Olá, ${interaction.user.username}!` })] });
  },
};

export default command;
```

Depois rode `bun run register` para sincronizar com o Discord.

## 🧩 Adicionando um novo sistema

1. Crie `src/bot/systems/<nome>/` com a lógica pura (sem Discord se possível).
2. Adicione tabelas no `prisma/schema.prisma` se precisar persistir.
3. Crie comandos em `src/bot/commands/<nome>/`.
4. Se reage a eventos do Discord, adicione handler em `src/bot/events/`.

---

## 🔐 Segurança

- **Nunca** comite o `.env`.
- O `DISCORD_CLIENT_SECRET` só é usado no **dashboard web**, nunca no frontend.
- O `SUPABASE_SERVICE_ROLE_KEY` (se for usar) **nunca** vai pro browser.
- Cooldowns são persistidos no banco — sobrevivem a restart.
- Logs de ações sensíveis vão pra tabela `LogEntry` e canais configuráveis.

---

## 🛣️ Roadmap (módulos com schema pronto, comandos a implementar)

- 💰 **Economia**: `/daily`, `/work`, `/crime`, `/rob`, `/pay`, `/shop`, `/inventory`, `/rank dinheiro` — tabelas: `EconomyAccount`, `ShopItem`, `InventoryItem`
- 📈 **Level/XP**: XP por mensagem (event `messageCreate`), `/rank`, `/leaderboard` — tabelas: `LevelAccount`, `LevelReward`
- 🎁 **Sorteios**: `/giveaway start|end|reroll` — tabela: `Giveaway`
- 💡 **Sugestões**: `/sugerir` com botões — tabela: `Suggestion`
- 🛡️ **AutoMod**: anti-link, anti-invite, anti-spam, blacklist de palavras (campos já no `GuildConfig`)
- 🎭 **Reaction roles / Auto role** (campo `autoRoleId` já existe)

O banco já está modelado para tudo isso — basta criar os comandos/handlers seguindo o padrão dos existentes.
