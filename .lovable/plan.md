# Sistema Premium / VIP

Escopo enorme. Vou dividir em 3 passes para entregar de forma sólida e testável (cada pass é um “continuar pass N”).

> Observação técnica: o projeto usa **Mongoose** (não Prisma) no bot e **Supabase** no dashboard. Vou seguir o stack atual: modelos Mongoose para o bot + tabelas Supabase espelhadas para o dashboard, mantendo o padrão já existente nos outros módulos (social, tickets, economia).

---

## Pass 1 — Fundação (Prioridade 1)

**Banco (Mongoose + migration Supabase):**
- `PremiumPlan`, `PremiumSubscription`, `PremiumBenefit`, `PremiumActivationCode`, `PremiumActivation`, `PremiumGuildConfig`, `PremiumAuditLog`, `PremiumFeatureUsage`.
- Tabelas Supabase espelho + RLS + GRANTs.

**Core service (`bot/src/bot/systems/premium/`):**
- `premium.service.ts` — CRUD assinaturas, ativação por código, grant/revoke manual.
- `premium.codes.ts` — geração segura (`PREMIUM-XXXX-XXXX`), validação (ativo, não expirado, usos restantes).
- `premium.features.ts` — `isUserVip`, `isGuildPremium`, `hasPremiumFeature`, `getUserVipMultiplier`, `getGuildLimit`.
- `premium.expiration.ts` — scheduler periódico → marca EXPIRED, remove cargos, loga, audita.
- `premium.roles.ts` — add/remove cargo VIP com validação de hierarquia.
- `premium.audit.ts` + `premium.logs.ts`.
- `premium.validation.ts` (zod) + `premium.limits.ts`.

**Slash commands:**
- `/vip status|ativar|beneficios|presente`
- `/premium servidor|beneficios|resgatar|painel`
- `/admin-premium add-user|remove-user|add-guild|remove-guild|criar-codigo|listar|expirar` (somente `OWNER_ID`).

**Dashboard mínimo:**
- Server functions `src/lib/guild/premium.functions.ts`.
- Rota `_authenticated/dashboard.$guildId.premium.tsx` com aba **Status** + **Códigos** (resgatar).

---

## Pass 2 — Integrações & Dashboard completo (Prioridade 2)

**Integrações nos módulos existentes:**
- Economia: multiplicador em `daily/work/crime`, loja VIP flag.
- Level/Social: multiplicador de XP em `xp.service.ts`, banner/cor/moldura no `rank-card.service.ts`, badge VIP no `/perfil`.
- Tickets: categoria/flag prioridade, limites, badge no embed.
- Cargo VIP aplicado on-grant e on-expire.

**Dashboard Premium (guild) — abas:**
- Status, Benefícios, Planos, Códigos, Usuários VIP, Servidor Premium, Limites, Logs, Aparência.

---

## Pass 3 — Painel global do dono + limites (Prioridade 3)

**Painel `/admin/premium` (apenas `OWNER_ID`):**
- Abas: Visão geral, Planos (CRUD), Assinaturas (CRUD/extender/suspender), Códigos (CRUD), Usuários, Servidores, Logs, Auditoria.
- Métricas: VIPs ativos, servidores premium ativos, expirando em breve, códigos usados/ativos, receita estimada.

**Limites por plano aplicados nos módulos:**
- Tickets categorias, loja itens, badges, conquistas, level rewards, automações.
- Mensagem padrão de upgrade quando limite atingido.

**Aparência premium** (cor/badge/banner/rodapé) + preparação para Stripe/MP (apenas interfaces, sem dados sensíveis).

---

## Premissas
- `OWNER_ID` lido de `process.env.OWNER_ID` (já usado no bot). Se não existir, adiciono em `bot/src/config/env.ts`.
- Nenhum dado de pagamento será armazenado.
- Sem alterar `client.ts`, `types.ts` (regenerado), `.env`.

Confirma que posso começar pelo **Pass 1**? Se sim, responda “continuar pass 1”.