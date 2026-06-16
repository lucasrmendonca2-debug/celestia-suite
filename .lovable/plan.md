# Fase Visual Premium — Embeds, Identidade & Assets

Objetivo: deixar o bot com cara de produto premium sem criar sistemas grandes novos. Centralizar embeds, padronizar tema, permitir assets configuráveis por key, e entregar a lista completa de assets para gerar com IA.

## Escopo

Foco em **aparência e padronização**. Não vou refatorar lógica de negócio dos comandos — só trocar a forma como eles montam embeds, botões e menus.

---

## Passo 1 — Identidade visual & tema central

**Novo arquivo:** `bot/src/bot/systems/ui/embed.theme.ts`

Define a paleta única do bot:

```text
brand        #5865F2  (primário, identidade Zenox)
brand_glow   #8B5CF6  (acento secundário)
success      #22C55E
error        #EF4444
warn         #F59E0B
info         #3B82F6
premium      #F5C842  (dourado VIP)
economy      #FBBF24
tickets      #14B8A6
moderation   #DC2626
fun          #EC4899
social       #A855F7
logs         #64748B
```

Cada módulo tem: cor, emoji-padrão, footer-padrão, thumbnail-padrão (resolvida por asset key).

## Passo 2 — EmbedFactory central

**Novo:** `bot/src/bot/systems/ui/embed.factory.ts`

API:

```ts
ui.success({ title, description, fields?, footer?, thumbnail?, image? })
ui.error(...)
ui.warn(...)
ui.info(...)
ui.moderation({ action, target, moderator, reason, caseId, duration?, ... })
ui.ticket({ kind: 'panel'|'created'|'closed'|'rated', ... })
ui.economy({ kind: 'balance'|'daily'|'work'|'shop'|'item'|'top', ... })
ui.social({ kind: 'profile'|'rank'|'levelup'|'rep'|'badges'|'top', ... })
ui.premium({ kind: 'status'|'activate'|'locked'|'benefits', ... })
ui.fun({ kind: 'interaction'|'meme'|'8ball'|..., gifKey? })
ui.log({ kind, ... })
ui.admin(...)
```

Todos retornam `EmbedBuilder` com cor, footer, timestamp e thumbnail aplicados conforme o tipo. Aceita `actions?` para devolver `ActionRowBuilder` prontos junto.

**Novo:** `bot/src/bot/systems/ui/buttons.factory.ts` e `menus.factory.ts` com presets:
`btn.save()`, `btn.cancel()`, `btn.openTicket()`, `btn.closeTicket()`, `btn.viewHistory(userId)`, `btn.revertCase(caseId)`, `menu.ticketCategories(cats)`, etc. Tudo em PT-BR natural.

Mantém `brandEmbed()` legado como wrapper fino que chama o factory para não quebrar nada.

## Passo 3 — Sistema de assets por key

**Migração SQL:** nova tabela `bot_assets`

```sql
CREATE TABLE public.bot_assets (
  id uuid primary key default gen_random_uuid(),
  guild_id text,           -- null = global default
  key text not null,       -- 'global.logo', 'tickets.panel_banner', ...
  name text not null,
  type text not null,      -- IMAGE|GIF|ICON|BANNER|THUMBNAIL|BADGE|EMOJI|BACKGROUND
  module text not null,    -- GLOBAL|WELCOME|TICKETS|MODERATION|...
  url text not null,
  active boolean default true,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (guild_id, key)
);
```

+ GRANTs corretos (authenticated + service_role), RLS por has_role/guild manager, índice por (guild_id,key).

**Novo:** `bot/src/bot/systems/ui/embed.assets.ts`
- `getAsset(guildId, key)` com cache em memória (TTL 5min) + fallback p/ row global + fallback hardcoded.
- `ASSET_KEYS` constante com todas as keys conhecidas.
- Nunca lança: URL inválida → retorna `undefined` e o embed segue sem imagem.

## Passo 4 — Migrar comandos para o factory

Substituir `brandEmbed({ kind:'error', title:'...' })` espalhado pelos handlers por chamadas `ui.error/success/...`. Cobertura prioritária:

- Moderação: warn, ban, kick, mute, unmute, clear, lock, unlock, history, case → `ui.moderation` com botões `Ver histórico` / `Reverter` (quando aplicável).
- Tickets: painel, criado, fechado, reaberto, avaliação → `ui.ticket` com banner via `tickets.panel_banner`.
- Economia: balance, daily, work, crime, pay, shop, inventory, top → `ui.economy` com ícone `economy.currency_icon`.
- Social/Level: perfil, rank, leveltop, rep, badges, conquistas, level-up → `ui.social`.
- Premium: vip, premium, ativação, recurso bloqueado → `ui.premium` com selo `premium.vip_badge`.
- Diversão/interações: usa `ui.fun` com `fun.<action>_gif` (fallback p/ lista hardcoded atual).
- Logs: `ui.log` com cor cinza e ícone por tipo de evento.

Textos PT-BR reescritos no padrão "natural, curto, alto astral".

## Passo 5 — Dashboard: Identidade Visual

**Nova rota:** `dashboard.$guildId.assets.tsx` (sidebar → "Identidade Visual" na seção Admin).

UI:
- Tabs por módulo (Global, Welcome, Tickets, Economia, Social, Premium, Diversão, Logs, Dashboard).
- Card por key com: preview (img), nome, key (botão copiar), URL editável, switch ativo, botão "usar padrão", remover.
- Validação básica de URL (http(s), max 5MB sugerido) — validação leve, sem download obrigatório.
- Botão "Restaurar padrões do módulo".

**Server fns:** `src/lib/guild/assets.functions.ts` (list/upsert/delete, com `assertCanAccessArea('assets')` + `writeAudit`).

Adicionar `'assets'` à lista `DASHBOARD_AREAS`.

## Passo 6 — Previews de embeds no dashboard

Componente reutilizável `<DiscordEmbedPreview embed={…} />` (já existe parcial em /comandos — extrair p/ `src/components/dashboard/preview/DiscordEmbed.tsx`) e usar nas páginas: welcome, tickets, logs, moderation, economy, leveling, premium.

## Passo 7 — Entregável final: `ASSETS.md`

Arquivo `bot/ASSETS.md` com a lista completa e organizada. Cada asset tem: **nome • key • onde é usado • formato • tamanho • estilo • estático/GIF • prioridade • prompt base para IA**.

Seções: Global, Welcome, Tickets, Economia, Social/Level, Premium, Diversão, Moderação/Logs, Dashboard, Emojis, Badges. Cobre a lista mínima detalhada no pedido.

---

## Detalhes técnicos

- **Cores**: definidas em `embed.theme.ts` (single source). `bot/src/bot/utils/embed.ts` passa a importar daí.
- **Cache de assets**: `Map<string, {url, expiresAt}>` simples no processo do bot; invalidado quando a edge function de upsert fizer publish (futuro). Por ora TTL 5min é suficiente.
- **Fallbacks**: cada `ASSET_KEYS.x` tem `default: string|null`. Se row e default forem null, embed renderiza sem aquela imagem.
- **Compat**: `brandEmbed` mantido como shim — não quebra nenhum dos ~80 call sites enquanto migração rola.
- **Sem novas deps**.
- **Migração de dados**: nenhuma; tabela nova, vazia, opt-in por guild.

## Fora de escopo (deixar para próxima fase)

- Upload direto de arquivo no dashboard (por ora só URL).
- Geração das imagens em si (você gera via IA usando o ASSETS.md).
- Temas por servidor (paleta customizada). 
- Sistema de cache distribuído.

---

## Ordem de execução

1. `embed.theme.ts` + `embed.factory.ts` + `buttons/menus.factory.ts`
2. Migração `bot_assets` + `embed.assets.ts` + server fns
3. Refator dos comandos por módulo (moderação → tickets → economia → social → premium → fun → logs)
4. Rota dashboard `/assets` + componente de preview compartilhado
5. `bot/ASSETS.md` com prompts de IA

Posso seguir?
