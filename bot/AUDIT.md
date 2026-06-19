# Auditoria do Bot — Parte A1 (varredura automática)

## Resultado
- **Bot:** 0 erros TS (eram 39 em 14 arquivos)
- **Site:** 0 erros TS
- **Bugs sistêmicos:** 0 (nenhum reply-after-defer, nenhum unawaited promise, nenhum env perigoso)

## Correções aplicadas neste passe

### Help (bug do "preso na primeira escolha")
- `bot/src/bot/commands/utility/help.ts` — removido `default: true` no StringSelectMenu (impedia re-seleção fluida)
- `bot/src/bot/events/interactionCreate.ts` — trocado `deferUpdate+editReply` por `interaction.update()` atômico (mais robusto em mensagens ephemeral)

### TypeScript (39 erros consertados)
| Arquivo | Bug | Fix |
|---|---|---|
| `commands/config/logs.ts` | `col` possivelmente undefined no upsert | Validação + reply de erro |
| `commands/utility/anuncio.ts` | `m[1]`/`m[2]` undefined; `parse: ["here"]` inválido | Null-check + `parse: ["everyone"]` (Discord cobre @here) |
| `commands/utility/lembrete.ts` | Mesmo `m[1]` undefined | Null-check |
| `events/interactionCreate.ts` | `missionId` undefined após split | Early return |
| `events/inviteCreate.ts` + `inviteDelete.ts` | `invite.guild.partial` não existe em `Guild \| InviteGuild`; `actor: null` ≠ undefined | `instanceof Guild` + `actor: undefined` |
| `events/messageDelete.ts` + `messageUpdate.ts` | `Message<boolean>` vs `Message<true>` | `message.inGuild()` type guard |
| `events/ready.ts` | `.catch()` em `Promise<void>` (não é Promise) | try/catch |
| `systems/polls/poll.service.ts` | `counts[i]` undefined | `?? 0` |
| `systems/premium/premium.codes.ts` | `buf[i]` undefined | `?? 0` |
| `systems/scheduler.ts` | `parse: ["here"]` inválido | `parse: ["everyone"]` |
| `systems/social/level-rewards.service.ts` | `addCoins` não existe (typo) | `addWallet` |
| `systems/social/xp.service.ts` | Import `.ts` proibido | `.js` |

## Próximo (Parte A2)
Pente-fino comando a comando focando em lógica/UX, na ordem:
1. moderation (ban/kick/mute/warn/clear/lockdown)
2. tickets
3. economy
4. level
5. fun + interaction
6. utility + events + config

Depois Parte B (redesign cyber do site).
