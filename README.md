# Zenox

Bot Discord premium + dashboard web para gerenciar moderação, economia, level,
tickets, sorteios, enquetes, sugestões, comunidade e VIP — tudo configurável
sem digitar comandos.

## Stack

| Camada     | Tecnologia                                                     |
| ---------- | -------------------------------------------------------------- |
| Dashboard  | TanStack Start (React 19 + Vite 7), Tailwind v4, shadcn/ui     |
| Bot        | Node 20+, Discord.js v14, TypeScript                           |
| Banco      | Supabase (Postgres + RLS) — **fonte única** para configs       |
| Banco aux. | MongoDB (Mongoose) — apenas dados operacionais do bot (legado) |
| Auth       | Discord OAuth2 (broker Lovable) + sessão criptografada         |

> Este projeto **não usa Prisma**. Qualquer referência antiga a
> `prisma/schema.prisma`, `prisma migrate` ou `DATABASE_URL` está obsoleta.

## Arquitetura de banco

Estamos migrando para **Supabase como banco único**. Hoje:

- **Supabase (já unificado):** `guild_configs`, `guild_logs_config`,
  `ticket_configs`/`tickets`/`ticket_messages`, `economy_config`/`user_economy`,
  `moderation_configs`/`mod_cases`, `automod_config`, `level_config`/`level_users`,
  `premium_*`, `community_config`/`polls`/`suggestions`, `social_*`,
  `server_audit_logs`, `embed_templates`, `custom_commands`, `reaction_roles`,
  `achievements`/`badges`.
- **MongoDB (legado, ainda em uso pelo bot):** `GuildConfig` (alguns campos —
  duplicado com `guild_configs`), `VipMembership`, `Punishment`, `Giveaway`,
  `Reminder`, `Announcement`, `LogEntry`. Será migrado em fases.

Regra: **se o dashboard escreve, o bot lê do Supabase**. Mongo é só estado
operacional do bot.

## Setup

### Pré-requisitos

- Node 20+ e [bun](https://bun.sh) (ou npm/pnpm)
- Projeto Supabase (criado automaticamente pelo Lovable Cloud)
- Aplicação Discord em <https://discord.com/developers/applications>
  com bot habilitado e Privileged Intents ativadas
  (`Server Members`, `Message Content`)

### 1. Variáveis de ambiente

Copie os exemplos:

```bash
cp .env.example .env          # dashboard
cp bot/.env.example bot/.env  # bot
```

Preencha (veja os comentários nos arquivos). Pontos-chave:

| Variável                     | Onde      | Para quê                                          |
| ---------------------------- | --------- | ------------------------------------------------- |
| `DISCORD_CLIENT_ID`          | ambos     | App ID do Discord                                 |
| `DISCORD_CLIENT_SECRET`      | dashboard | OAuth2 do login                                   |
| `DISCORD_REDIRECT_URI`       | dashboard | `APP_URL/api/auth/discord/callback`               |
| `DISCORD_BOT_TOKEN`          | dashboard | Token do bot (REST API do Discord)                |
| `DISCORD_TOKEN`              | bot       | **Mesmo valor** do `DISCORD_BOT_TOKEN`            |
| `SESSION_SECRET`             | dashboard | `openssl rand -hex 32`                            |
| `SUPABASE_URL`               | ambos     | URL do projeto                                    |
| `SUPABASE_PUBLISHABLE_KEY`   | dashboard | Server functions (lê com RLS como usuário)        |
| `SUPABASE_SERVICE_ROLE_KEY`  | bot       | Bot bypassa RLS — **NUNCA no frontend**           |
| `MONGO_URI`                  | bot       | Mongo (legado, ainda obrigatório)                 |

> `SUPABASE_SERVICE_ROLE_KEY` no dashboard só aparece em código server-side
> (server functions / `*.server.ts`). Nunca em `import.meta.env` nem componentes.

### 2. Rodar o dashboard

```bash
bun install
bun run dev   # http://localhost:8080
```

Login pelo Discord usa o broker do Lovable — basta clicar em "Entrar".

### 3. Rodar o bot

```bash
cd bot
bun install
bun run dev
```

### 4. Registrar slash commands

```bash
cd bot
bun run register             # registra globalmente (até 1h p/ propagar)
# ou, em dev, com DISCORD_DEV_GUILD_ID setado:
bun run register:dev         # registro instantâneo na guild
```

## Como testar os módulos principais

| Módulo    | No dashboard                                                            | No Discord                                  |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| Tickets   | `Dashboard → Tickets`, criar categoria e publicar painel                 | Clicar no botão do painel cria um ticket    |
| Welcome   | `Dashboard → Welcome`, escolher canal + mensagem                         | Entrar/sair do servidor com outra conta     |
| Logs      | `Dashboard → Logs`, configurar canal por categoria + toggles            | Criar/deletar canal, editar/apagar msg, etc |
| Economia  | `Dashboard → Economia`, configurar moeda + recompensas                  | `/saldo`, `/daily`, `/work`, `/shop`        |
| Sugestões | `Dashboard → Comunidade → Sugestões`, definir canal                     | `/sugestao enviar texto:...`                |

## Deploy

- **Dashboard:** publique pelo botão `Publish` do Lovable.
- **Bot:** rode como processo persistente (Railway, Fly, VPS). Use as mesmas
  variáveis de `bot/.env` no provider, e mantenha o `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY` do mesmo projeto que o dashboard.

## Solução de problemas

- **Bot conecta mas comandos não aparecem:** rode `bun run register` no `bot/`.
- **`Unsupported provider` no login:** Google ainda não foi configurado —
  abra o backend e ative Google em Auth Providers.
- **Logs não chegam ao canal:** o bot precisa de `Ver canal`, `Enviar
  mensagens` e `Embed links` no canal configurado. As toggles estão em
  `Dashboard → Logs`.
- **Bot diz "feature premium bloqueada":** o servidor não tem plano ativo.
  Configure em `Dashboard → Premium`.
