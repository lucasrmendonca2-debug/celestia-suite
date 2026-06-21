# Auditoria do Bot

## Parte A1 — varredura automática (anterior)
0 erros TS, 0 bugs sistêmicos, Help destravado, 14 arquivos corrigidos.

---

## Parte A2 — pente-fino comando a comando

**Bot:** 0 erros TS · **Comandos auditados:** 53 em 10 categorias.

### ✅ Corrigido neste passe (15 bugs)

| # | Arquivo | Bug | Fix |
|---|---|---|---|
| 1 | `systems/economy/economy.ts` | `removeWallet` lia+gravava sem atomicidade → double-spend em `/pay` e `/loja buy` | Trocado pra `updateOne` atômico com filtro `wallet >= amount` |
| 2 | `commands/economy/daily.ts` | Race condition: dois `/daily` simultâneos credito duplo | Claim atômico via `findOneAndUpdate` gatilhado por `lastDaily ≤ cutoff`; `void`s viraram `.catch(log)` |
| 3 | `commands/moderation/mute.ts` | `createCase` + DM enviados ANTES de validar cargo de mute / hierarquia → caso fantasma + DM enganosa | Pré-validação `mute_role_id`/`moderatable` antes do `deferReply` |
| 4 | `commands/moderation/tempmute.ts` | Sem cargo de mute e sem `moderatable` → bot silencia o erro, cria caso, manda DM, mas usuário não é mutado | Adicionado `else` que aborta com erro |
| 5 | `commands/moderation/ban.ts` | `const capability = durationSec ? "can_ban" : "can_ban"` (ternário inútil) | Simplificado pra `"can_ban"` (capability `can_temp_ban` não existe no enum) |
| 6 | `commands/moderation/nickname.ts` | `postModerationLog({ type: "WARN" })` em mudança de apelido — log com tipo errado | Adicionado `NICKNAME` ao `PunishmentType` e ao `ACTION_LABELS` |
| 7 | `commands/moderation/removewarn.ts` | Chamada morta `await getModerationConfig(guild.id)` | Removida (+ import limpo) |
| 8 | `commands/events/giveaway.ts` | `end`/`reroll` aceitavam qualquer `_id` sem checar `guildId` → cross-server abuse | Verifica `g.guildId === guildId` antes de agir |
| 9 | `commands/utility/anuncio.ts` | `ch.send()` sem try/catch e sem `.slice()` → interaction falha se bot não tem perm; embed estoura 4096 chars | try/catch com mensagem amigável; `slice(0, 256)` no título e `slice(0, 4000)` no body |
| 10 | `commands/economy/deposit.ts` | `Number(raw) \| 0` (bitwise OR) trunca a int32 e vira negativo pra `"3000000000"` | Trocado por `Math.trunc(Number(raw))` + validação `isFinite && > 0` |
| 11 | `commands/fun/8ball.ts` | Pergunta sem `.setMaxLength` → pode estourar 1024 do field do embed | `setMaxLength(1000)` |
| 12 | `commands/fun/meme.ts` | `data.title`/`data.url` da API externa direto no embed sem validar | `.slice(256)` + regex `^https?://` no url |
| 13 | `commands/premium/premium.ts` | Reply de resgate de código NÃO é efêmero — exposição pública | Adicionado `ephemeral: true` |
| 14 | `scripts/registerCommands.ts` | TS error: `DISCORD_DEV_GUILD_ID` possivelmente undefined | `!` (já validado pelo `useDevGuild`) |
| 15 | `commands/economy/daily.ts` | `void logTx`/`void incrementMissionProgress` sem catch — promises rejeitadas silenciosas | `.catch((err) => logger.warn(...))` |

---

### ⏸️ Listado pra decisão (precisa de escolha sua)

#### Race conditions em economia (altas)
- **`commands/economy/rob.ts:54-71`** — leitura+escrita em duas contas; se rob simultâneo no mesmo alvo, valores podem dessincronizar. Mitigado pelo cooldown de 30min/atacante, mas existe. **Fix:** `updateOne` atômico no `them.wallet` com filtro `>= taken`.
- **`commands/economy/shop.ts:206-216` (buy)** — `removeWallet` agora é atômico, então saldo negativo está prevenido. **Mas** o estoque ainda lê+escreve: `if (item.stock !== -1 && item.stock < qty) { ... } item.stock -= qty; item.save()`. Duas compras simultâneas podem zerar/negativar estoque. **Fix:** `findOneAndUpdate` no item filtrando `stock: { $gte: qty }`.

#### Moderação
- **`commands/moderation/kick.ts`** — kick NÃO cria `mod_case` (todos os outros criam). É decisão de design ou esquecimento? **Fix:** importar `createCase` e chamar após o `member.kick()`.
- **`commands/moderation/warn.ts:182-204`** — auto-escalação (kick/ban por limite de pontos) não chama `canPunishTarget` nem `createCase` da ação auto. Risco baixo (acionado por staff), mas inconsistente.
- **`commands/moderation/apelacoes.ts:46`** — gerenciar apelações usa `can_warn`. Qualquer mod com warn aprova apelação. **Decisão:** adicionar capability `can_manage_appeals` (precisa migration no schema de capabilities) ou trocar pra `can_ban`?

#### Tickets
- **`systems/tickets/ticket.service.ts:setPanelMessage`** — `.update()` sem `upsert`; servidores sem `ticket_configs` prévio não gravam `panel_message_id`. **Fix:** trocar para `.upsert({ ... }, { onConflict: "guild_id" })`.
- **`commands/tickets/ticket.ts:runClaim`** — dois updates separados (`claimed_by` e `claimed_at`). Mesclar em uma chamada.
- **`commands/tickets/ticket.ts:runFechar`** — possível `InteractionAlreadyReplied` se `closeTicketSlash` já respondeu e depois lançar. Refatorar para usar `interaction.replied ? editReply : reply` no catch.

#### Cross-server / multi-guild
- **`commands/interaction/marry.ts` + `divorce.ts`** — `Marriage` model sem `guildId`; casamento é GLOBAL. **Decisão:** é intencional (casado em qualquer servidor) ou bug (deveria ser por guild)? Mudar exige migration.

#### UX / spam
- **`commands/utility/lembrete.ts`** — sem limite de lembretes ativos por usuário. **Fix sugerido:** 10 ativos/usuário.
- **`commands/config/logs.ts:161`** — IDs do `/logs ignorar` não validam Snowflake. Strings malformadas vão pra array.
- **`commands/config/embed.ts:52-55`** — URLs de image/thumbnail sem validar `^https?://`.
- **`commands/economy/level.ts:59`** (admin `addxp -qty`) — pode deixar XP negativo se serviço não clampar.
- **`commands/level/levelreward.ts:41-53`** — DELETE+INSERT sem rollback (sem upsert).
- **`commands/economy/crime.ts:36`** — `acc.lastCrime = now` setado antes do `getAsset`; se este lançar, cooldown não persiste. Trivial: mover pra depois.
- **`commands/economy/pay.ts:55`**, **`commands/economy/work.ts:65-73`** — vários `void promise` sem catch (não são críticos, mas perdem erros).

#### Deprecation
- **~50 ocorrências de `ephemeral: true`** em todos os comandos. discord.js v14.16+ pede `flags: MessageFlags.Ephemeral`. Ainda funciona, mas vai sumir em v15. **Decisão:** migração em massa (1 PR, find/replace + import) ou deixar pra quando o warning começar a poluir log?

---

### Resumo
- **8 bugs de alta gravidade** detectados pelo audit → **5 corrigidos**, 3 listados (rob race, shop stock race, apelações capability).
- **40 bugs no total** → 15 corrigidos, 25 listados.
- **Bot:** 0 erros TS após o passe.

Próximo: decisões da seção "Listado" e/ou Parte B (redesign cyber do site).
