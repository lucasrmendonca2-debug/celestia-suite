# Zenox

Bot Discord premium + dashboard web para gerenciar moderação, economia, level,
tickets, sorteios, enquetes, sugestões, comunidade e VIP — tudo configurável
sem digitar comandos no Discord.

## Stack

| Camada     | Tecnologia                                                    |
| ---------- | ------------------------------------------------------------- |
| Dashboard  | TanStack Start (React 19 + Vite 7), Tailwind v4, shadcn/ui    |
| Bot        | Node 20+, Discord.js v14, TypeScript (ESM)                    |
| Banco      | Supabase (Postgres + RLS + RPCs atômicas) — **fonte única**   |
| HTTP bot   | `node:http` bridge (porta 3001 + 8080) protegida por segredo  |
| Auth       | Discord OAuth2 (broker Lovable) + sessão criptografada        |

> Este projeto **não usa Prisma, MongoDB nem Mongoose**. Toda persistência
> vive no Supabase. Qualquer menção antiga a `prisma/schema.prisma`,
> `DATABASE_URL` ou `MONGO_URI` é obsoleta e foi removida.

## Arquitetura de banco

Tudo está no Supabase. O dashboard escreve via server functions (RLS como
usuário); o bot lê/escreve via service role e usa RPCs atômicas para
operações sensíveis (economia, daily, loja, level, cosméticos).

Principais grupos de tabelas:

- **Servidor:** `guild_configs`, `guild_logs_config`, `server_audit_logs`
- **Tickets:** `ticket_configs`, `tickets`, `ticket_messages`
- **Economia:** `economy_config`, `user_economy`, `economy_transactions`,
  `shop_items`, `inventories`, `daily_tokens`
- **Moderação:** `moderation_configs`, `mod_cases`, `automod_config`
- **Level:** `level_config`, `level_users`, `level_rewards`
- **Premium:** `premium_*`
- **Comunidade:** `community_config`, `polls`, `suggestions`
- **Social/cosméticos:** `social_*`, `cosmetics`, `user_cosmetics`,
  `badges`, `achievements`
- **Conteúdo:** `embed_templates`, `custom_commands`, `reaction_roles`

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

#### Obrigatórias

| Variável                     | Onde      | Para quê                                          |
| ---------------------------- | --------- | ------------------------------------------------- |
| `DISCORD_CLIENT_ID`          | ambos     | App ID do Discord                                 |
| `DISCORD_CLIENT_SECRET`      | dashboard | OAuth2 do login                                   |
| `DISCORD_REDIRECT_URI`       | dashboard | `APP_URL/api/auth/discord/callback`               |
| `DISCORD_BOT_TOKEN`          | dashboard | Token do bot (REST API do Discord)                |
| `DISCORD_TOKEN`              | bot       | **Mesmo valor** do `DISCORD_BOT_TOKEN`            |
| `SESSION_SECRET`             | dashboard | `openssl rand -hex 32`                            |
| `APP_URL`                    | ambos     | URL pública do dashboard, sem barra final         |
| `SUPABASE_URL`               | ambos     | URL do projeto Supabase                           |
| `SUPABASE_PUBLISHABLE_KEY`   | dashboard | Lê com RLS via server functions                   |
| `SUPABASE_SERVICE_ROLE_KEY`  | bot + dash (server-only) | Bypassa RLS — **nunca no frontend**  |
| `BOT_API_URL`                | dashboard | URL pública do bridge HTTP do bot                 |
| `BOT_API_SECRET`             | ambos     | Mesmo valor nos dois lados; header `x-bot-secret` |
| `BOT_OWNER_ID`               | ambos     | Discord user ID do dono — comandos owner-only     |

#### Opcionais

| Variável                     | Onde      | Default            | Para quê                                              |
| ---------------------------- | --------- | ------------------ | ----------------------------------------------------- |
| `DISCORD_DEV_GUILD_ID`       | bot       | (vazio)            | Registro instantâneo de comandos em servidor de teste |
| `BOT_HTTP_PORT`              | bot       | `3001`             | Porta do bridge (sempre escuta 8080 também)           |
| `BOT_API_ALLOWED_ORIGINS`    | bot       | `APP_URL`          | CSV de origens CORS extras                            |
| `BOT_API_MAX_BODY_BYTES`     | bot       | `32768`            | Limite de body do bridge                              |
| `DEV_LOG_ADMIN_IDS`          | dashboard | (vazio)            | CSV de Discord IDs com acesso à página `/dev-logs`    |
| `BRAND_NAME` / `BRAND_COLOR` | bot       | `Zenox`/`0x7C3AED` | Branding em embeds                                    |
| `NODE_ENV`, `LOG_LEVEL`      | ambos     |                    | Runtime                                               |

> `SUPABASE_SERVICE_ROLE_KEY` no dashboard só é importado dentro de handlers
> de server functions (`await import("@/lib/supabase-admin.server")`).
> Nunca em `import.meta.env`, nunca em componentes, nunca no client bundle.

### 2. Rodar o dashboard

```bash
bun install
bun run dev          # http://localhost:8080
bun run typecheck    # validação TS estrita
bun run lint
bun run build        # produção
```

Login pelo Discord usa o broker do Lovable — basta clicar em "Entrar".

### 3. Rodar o bot

```bash
cd bot
bun install
bun run dev          # tsx watch
bun run typecheck
bun run build && bun run start
```

### 4. Registrar slash commands

```bash
cd bot
# Dev: defina DISCORD_DEV_GUILD_ID no .env → registro instantâneo na guild
bun run register

# Produção (global): deixe DISCORD_DEV_GUILD_ID vazio → propaga em ~1h
bun run register
```

### 5. Sincronizar catálogo do dashboard

Sempre que adicionar/remover/renomear um comando, regenere o JSON consumido
pelo site:

```bash
bun run sync-commands   # na raiz; também roda automaticamente em pre-dev/pre-build
```

## Como testar os módulos principais

| Módulo    | No dashboard                                                  | No Discord                                  |
| --------- | ------------------------------------------------------------- | ------------------------------------------- |
| Tickets   | `Tickets`, criar categoria e publicar painel                  | Clicar no botão do painel cria um ticket    |
| Welcome   | `Welcome`, escolher canal + mensagem                          | Entrar/sair com outra conta                 |
| Logs      | `Logs`, configurar canal por categoria + toggles              | Criar/deletar canal, editar/apagar msg, etc |
| Economia  | `Economia`, configurar moeda + recompensas                    | `/saldo`, `/diario`, `/trabalhar`, `/loja`  |
| Daily web | Comando `/diario` no Discord gera link; abrir e clicar Resgatar | Volta no Discord com saldo atualizado     |
| Sugestões | `Comunidade → Sugestões`, definir canal                       | `/sugestao enviar texto:...`                |

## Deploy

- **Dashboard:** publique pelo botão `Publish` do Lovable.
- **Bot:** processo persistente (Railway, Fly, Render, VPS). Use as mesmas
  variáveis de `bot/.env` no provider e mantenha o `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` do mesmo projeto do dashboard.
- Exponha a porta HTTP do bot publicamente e configure `BOT_API_URL` no
  dashboard apontando para ela. Garanta que `BOT_API_SECRET` é idêntico
  dos dois lados.

### Checklist final

**Local**
- [ ] `.env` e `bot/.env` preenchidos a partir dos `.env.example`
- [ ] `bun install` rodado na raiz e em `bot/`
- [ ] Migrações Supabase aplicadas (Lovable Cloud aplica automático)
- [ ] `bun run typecheck` passa nos dois projetos
- [ ] `bun run sync-commands` rodado após mexer em comandos
- [ ] `bun run dev` (raiz) e `cd bot && bun run dev` funcionando

**Produção**
- [ ] Mesmo `BOT_API_SECRET` no dashboard e no bot
- [ ] `BOT_API_URL` (dashboard) aponta para o bridge público do bot
- [ ] `DISCORD_REDIRECT_URI` corresponde exatamente ao registrado no
      Discord Developer Portal
- [ ] `SESSION_SECRET` único e ≥ 32 bytes
- [ ] `SUPABASE_SERVICE_ROLE_KEY` definido só em ambientes server-side
- [ ] Slash commands registrados (`bun run register` no bot)
- [ ] Bot rodando em runtime persistente (não-serverless)

## Solução de problemas

- **Bot conecta mas comandos não aparecem:** rode `bun run register` no `bot/`.
- **`Unsupported provider` no login:** Google ainda não foi configurado —
  ative no painel de Auth Providers.
- **Logs não chegam ao canal:** o bot precisa de `Ver canal`,
  `Enviar mensagens` e `Embed links` no canal configurado.
- **`/daily` web mostra "bot offline":** confira `BOT_API_URL`,
  `BOT_API_SECRET` e que a porta do bridge está acessível pela internet.
- **`origin_not_allowed` ao chamar o bridge:** adicione o domínio do
  dashboard em `BOT_API_ALLOWED_ORIGINS` (CSV) no `bot/.env`.
- **Bot diz "feature premium bloqueada":** o servidor não tem plano ativo —
  configure em `Premium`.
