
## Objetivo

Conectar o sistema de cosméticos ao restante do bot (level-up, daily, level rewards, /top, /rank, /perfil), aplicar dificuldade adaptativa nas missões, e mover **toda** a loja para o site (com dashboards separados para usuário e guild). O Discord deixa de ter strings de compra — apenas comandos de uso (`/perfil`, `/perfil equipar`).

---

## 1. Drops automáticos de cosméticos

### 1.1 Helper único `tryDropCommonCosmetic(userId, source, baseChance)`
Já existe em `bot/src/bot/systems/cosmetics/cosmetics.service.ts`. Vamos:
- Gravar o drop em `cosmetic_drops` (source: `level_up` | `daily` | `level_reward`)
- Retornar `{ cosmetic, dropped: boolean }` para o caller anunciar

### 1.2 Level-up (já existe parcial)
Em `xp.service.ts`, manter a chamada mas **registrar** em `cosmetic_drops` e enviar embed `ui.celebration` no canal de level-up com o item.

### 1.3 `/daily` (`bot/src/bot/commands/economy/daily.ts`)
Após creditar moedas, chance de **2%** de dropar cosmético comum. Se dropar, adicionar campo no embed: `🎁 Bônus raro: <nome do item>`.

### 1.4 Level rewards (`level-rewards.service.ts`)
Adicionar tipo `cosmetic` em `level_rewards.reward_type` (já existe coluna `reward_value` — guardar o `cosmetic_id`). Quando atingir o nível, inserir em `user_cosmetics` e logar em `cosmetic_drops` com source `level_reward`. UI no dashboard `/dashboard/$slug/niveis` ganha um seletor de cosmético.

---

## 2. Missões adaptativas (`user_mission_profile`)

Modificar `generate_daily_missions` para ler o perfil do usuário e ajustar `target` por usuário, **não por guild**. Como hoje a função gera missões por guild, criar uma nova função SQL:

```text
fn: assign_user_daily_missions(_guild_id, _user_id)
  - lê user_mission_profile.difficulty_tier (easy/normal/hard)
  - lê histórico de completions
  - clona missões da guild para user_missions com target ajustado:
      easy   → target * 0.6
      normal → target * 1.0
      hard   → target * 1.5  e reward * 1.4
  - atualiza user_mission_profile.last_assigned_at
```

Chamada quando o usuário usa `/missoes` pela primeira vez no dia.

---

## 3. `/top` e `/rank` mostrando cosméticos

- `/top`: adicionar coluna visual com badge da raridade do **frame** equipado ao lado do nome (emoji: ⚪🔵🟣🟡).
- `/rank` (em `social/rank`): incluir thumbnail = sticker principal do loadout, e linha "🎨 Estilo: <banner name>".
- Buscar via JOIN `user_profile_loadout` + `profile_cosmetics`.

---

## 4. `/perfil` mais bonito

No embed atual (`bot/src/bot/commands/fun/perfil.ts`):
- Manter imagem PNG (via wsrv) como hoje
- Adicionar campos: **Banner equipado**, **Frame**, **Stickers** (até 3, com nomes + raridade)
- Reordenar para que o card seja o destaque visual

---

## 5. **Loja só no site** + dashboards separados

### 5.1 Remover do Discord
- Remover subcomando `/perfil loja` e botões `cosmetic:buy:*` do `interactionCreate.ts`
- `/perfil` agora mostra link clicável: **🛒 Personalize seu perfil → https://zenoxbot.lovable.app/loja**
- `/perfil equipar` continua existindo (com autocomplete dos itens já possuídos)

### 5.2 Dashboard de USUÁRIO (`/loja` — já existe)
Aprimorar a rota atual `src/routes/_authenticated/loja.tsx`:
- 2 colunas: **Catálogo** (com tabs Banners/Frames/Stickers/Efeitos/Ofertas/Temporada) à esquerda, **Preview do meu card** ao vivo à direita
- Botão "Comprar" usa server fn `purchaseCosmetic`
- Botão "Equipar / Desequipar" atualiza loadout e re-renderiza preview
- Mostrar moedas agregadas do usuário (soma de `user_economy` de todas as guilds)

### 5.3 NOVO dashboard de GUILD: `/dashboard/$slug/loja`
Para admins do servidor, gerenciar a loja **daquela guild**:
- Ver/desativar cosméticos da rotação atual
- Forçar nova rotação (`rotate_daily_cosmetics(true)`)
- Configurar **multiplicador de preço** e **multiplicador de recompensa** (já existem em `economy_tuning_state`)
- Ver estatísticas: vendas dos últimos 7d, top compradores, item mais vendido
- Criar **cosmético exclusivo da guild** (insert em `profile_cosmetics` com flag `guild_exclusive_id`)

Requer nova coluna `guild_exclusive_id text null` em `profile_cosmetics` (migration).

---

## Estrutura técnica

### Migrations
1. `profile_cosmetics.guild_exclusive_id text null` + index
2. `level_rewards`: garantir suporte a `reward_type = 'cosmetic'` (validation trigger)
3. SQL fn `assign_user_daily_missions(_guild_id, _user_id)`
4. SQL fn `log_cosmetic_drop(_user_id, _cosmetic_id, _source)` (insert em `cosmetic_drops` + `user_cosmetics`)

### Server functions (TanStack)
- `src/lib/cosmetics/cosmetics.functions.ts`: `listShopForGuild`, `purchaseCosmetic`, `equipCosmetic`, `getLoadout`, `getUserCosmetics` (já existem várias — consolidar)
- `src/lib/cosmetics/guild-shop.functions.ts`: `getGuildShopStats`, `forceRotation`, `setPriceMultiplier`, `createGuildExclusiveCosmetic`, `toggleCosmeticActive` — todas com `requireSupabaseAuth` + check de `has_role('admin' guild)`

### Rotas
- `src/routes/_authenticated/loja.tsx` (refactor)
- `src/routes/_authenticated/dashboard.$slug.loja.tsx` (novo)
- Adicionar item "Loja" no sidebar do dashboard de guild

### Bot
- `cosmetics.service.ts`: helper `tryDropCommonCosmetic` chamando RPC `log_cosmetic_drop`
- `daily.ts`: integrar drop
- `top.ts` e `rank.ts`: JOIN com loadout
- `perfil.ts`: remover subcomando `loja`, melhorar embed, remover handler de botões
- `interactionCreate.ts`: remover handler `cosmetic:buy:*` (manter equipar)
- `missoes.ts`: chamar `assign_user_daily_missions` na primeira interação do dia

---

## Ordem de execução

1. Migrations (4 acima)
2. Server fns novas (guild-shop)
3. Refactor `/loja` (user dashboard com preview ao vivo)
4. Novo `/dashboard/$slug/loja` (guild dashboard)
5. Bot: drops em level-up/daily/level-reward
6. Bot: /top, /rank, /perfil com cosméticos
7. Bot: remover loja do Discord, missões adaptativas

---

## Riscos / decisões

- **Compras só no site**: usuários sem conta no dashboard não compram. OK pois o login com Discord OAuth já existe.
- **Multiplicadores de guild**: aplicam apenas quando a compra é feita "para usar nessa guild"? → Decisão: multiplicador da guild **onde o usuário gastou mais nos últimos 30 dias** (guild "principal"). Simples e justo.
- **Cosméticos exclusivos de guild**: visíveis no `/loja` global apenas se o usuário está naquela guild (check via `bot_guild_presence` + membership — usaremos somente `bot_guild_presence` para v1, refinar depois).
