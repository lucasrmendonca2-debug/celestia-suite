## Objetivo
Melhorar o dashboard de forma substancial, corrigir bugs (especialmente Permissões), enriquecer Boas-vindas/Autorole/Cargos por reação, Economia e Moderação, manter o estilo Paint em todo dashboard com o mascote Zenox espalhado em poses contextuais, e adicionar uma aba interna `/dev-logs` (admin) capturando todos os erros para eu ler.

Como o escopo é gigante, vou entregar em **fases** dentro deste mesmo plano. Cada fase é independente e testável — você pode pausar a qualquer momento.

---

### Fase 1 — Infra de logs internos + correções rápidas
1. **Tabela `app_error_logs`** (migration) com RLS:
   - colunas: `id`, `created_at`, `level` (error/warn/info), `source` (client/server/serverfn), `message`, `stack`, `route`, `user_id`, `user_tag`, `guild_id`, `metadata` jsonb, `user_agent`.
   - SELECT só pra admin (via `has_role` se já existir, senão lista whitelist em `app_admins`).
   - INSERT liberado pra `authenticated` (rate-limit por trigger simples).
2. **Server fn `logAppError`** + helper `reportError(err, ctx)` no client.
3. **Hook global no `__root.tsx`**: window.onerror, unhandledrejection, e patch no `console.error` que envia pro backend (debounced, dedup por message+stack).
4. **Wrapper em todos os server fns críticos** (try/catch → logAppError → rethrow).
5. **Rota `/dev-logs`** (dentro de `_authenticated/`) — visível só pra admin:
   - tabela paginada, filtros (level, source, rota, intervalo, busca), expand pra ver stack/metadata, botão "marcar resolvido", botão "limpar antigos".
6. **Correção da aba Permissões** — investigar bug atual (provavelmente roles não persistindo / áreas não validando), fixar.

### Fase 2 — Overview turbinada
- Cards: membros online/total, msgs/24h, comandos usados/24h, tickets abertos, casos de mod abertos, economia circulante.
- Gráfico de atividade (linhas) últimos 7/30 dias.
- Atalhos rápidos pros módulos mais usados.
- "Saúde do servidor": módulos ativos, alertas (ex: log channel não configurado).
- Mascote Zenox em pose "analista" no canto.

### Fase 3 — Boas-vindas / Autorole / Cargos por reação
- **Boas-vindas**: editor com preview ao vivo, variáveis ({user}, {server}, {memberCount}), suporte a embed + imagem custom + mensagem privada opcional, agendamento (delay), múltiplos templates com A/B.
- **Autorole**: cargos diferentes para humanos/bots, delay, cargo "verificado" condicional, restauração de cargos ao retornar.
- **Cargos por reação**: builder visual de painel, modo único/múltiplo/toggle, limites por usuário, expira, integração com botões (não só reações).

### Fase 4 — Economia
- Editor de loja com imagens, estoque, requisitos (nível/cargo), itens consumíveis vs permanentes.
- Sistema de missões (diárias/semanais) editável.
- Multiplicadores por cargo, canal, horário.
- Rotação automática de loja (já existe tabela) — UI completa.
- Daily com streaks configuráveis e bônus por marco.

### Fase 5 — Moderação avançada
- Automod: regras por gatilho (spam, caps, links, convites, palavras, menções, anexos) com thresholds + ações em escada (avisar→mutar→kick→ban).
- Histórico filtrável + edição/revogação de casos.
- Appeals: UI pra revisar.
- Permissões granulares por comando de mod.

### Fase 6 — Mascote Zenox contextual
- Gerar ~8 poses no estilo Paint da home (não iguais): "analista" (overview), "policial" (mod), "carteiro" (boas-vindas), "comerciante" (economia), "detetive" (logs), "festeiro" (daily), "engenheiro" (configs), "fantasma triste" (404/erro).
- Componente `<ZenoxHere variant="..." />` que escolhe pose conforme a página.

---

### Detalhes técnicos
- Logs: tabela em Lovable Cloud, RLS `has_role('admin')` pra SELECT.
- Captura client: patch único em `__root.tsx`, batching de 1s.
- Captura server: middleware global `errorMiddleware` já existe em `src/start.ts` — adicionar `logAppError` lá antes de rethrow.
- Permissões: ler `dashboard_permissions` + testar fluxo atual antes de mexer.
- Imagens do mascote: `imagegen` premium, paleta `#7C3AED #F472B6 #FBBF24 #34D399`, contorno preto grosso, mesmo traço da home.

### Pergunta antes de começar
Posso começar pela **Fase 1 (logs + fix Permissões)** agora? Ela destrava as outras porque qualquer bug nas próximas fases já cai no `/dev-logs` e eu leio direto. Confirma "vai" que eu emendo.