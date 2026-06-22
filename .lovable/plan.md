## Fase 5 — Sistemas automáticos inovadores + Loja de Perfil com imagens

Objetivo: dar **identidade própria** ao Zenox com sistemas que rodam sozinhos no fundo (sem o usuário pedir) e introduzir uma **economia visual real** — perfil com banners/decorações que o usuário compra, equipa e alterna, com arte gerada por IA.

---

### Parte A — Sistemas automáticos inovadores (Fase 5 original)

**A1. Temporadas dinâmicas (Season Engine)**
Já existem tabelas `level_seasons` e `level_season_users`. Falta o **motor automático**:
- `pg_cron` diário que: encerra temporada vencida, distribui recompensas top-10 (cargos, moeda, badge sazonal), abre próxima temporada com tema rotativo.
- Tema da temporada (ex: "Inverno do Dragão", "Verão Cyberpunk") define banner do leaderboard, cor de embed e item raro exclusivo na loja.
- Anúncio automático em canal configurável com embed celebrativo (`ui.celebration`).

**A2. Missões dinâmicas inteligentes (Mission Generator)**
A tabela `economy_missions` existe mas é estática. Adicionar:
- Geração diária automática de 3 missões por servidor, baseadas no **comportamento real** do servidor (canais mais ativos, comandos mais usados nos últimos 7d via `economy_transactions`).
- Dificuldade adaptativa: usuário que sempre completa ganha missões mais difíceis (e recompensa maior); novato ganha missões fáceis de onboarding.
- Missões semanais épicas com recompensa = item raro da loja.

**A3. Alertas inteligentes (Insight Engine)**
Sistema novo que detecta padrões e envia insights ao canal de logs/admin:
- "📈 Atividade subiu 40% essa semana — pico às 21h"
- "⚠️ 3 membros saíram após receber warn — considere revisar tom da moderação"
- "🔥 Comando `/pagar` cresceu 200% — economia esquentando"
- "💎 5 membros do servidor compraram VIP esse mês"
- Roda via `pg_cron` semanal, lê `economy_transactions`, `mod_cases`, `bot_guild_presence`.

**A4. Ranking semanal automático**
- `pg_cron` toda segunda 9h: posta top-5 da semana (XP, moeda, reputação, mensagens) no canal configurado.
- Embed com avatares, medalhas, comparativo vs semana anterior (↑/↓).
- Quem ficou em 1º ganha cargo temporário "Destaque da Semana" (7 dias).

**A5. Aniversários e marcos**
- Detecta automaticamente: aniversário do servidor, 100/500/1000 membros, X mensagens totais.
- Dispara embed `ui.celebration` + opcional drop de moeda pra todos online.

**A6. Auto-tuning de economia**
- Se inflação detectada (saldo médio > 2x da semana anterior), aumenta custos da loja em 10%.
- Se deflação (todo mundo quebrado), aumenta payout de `/diario` em 20% por 3 dias.
- Tudo logado em `economy_transactions` com tipo `auto_balance`.

---

### Parte B — Loja de Perfil com imagens (novo, inspirado na Loritta)

**Conceito:** o usuário tem um `/perfil` visual gerado como imagem (card). Pode comprar banners, frames, badges, efeitos no site (dashboard) ou no Discord, equipá-los e o card se monta dinamicamente. Itens raros rodam por temporada.

**B1. Schema novo (migration)**
- `profile_cosmetics` — catálogo global (id, tipo: `banner|frame|sticker|effect|background_pattern`, slug, name, description, rarity: `common|rare|epic|legendary|seasonal`, price_coins, price_premium, image_url do asset CDN, season_id nullable, available_from/until, active).
- `user_cosmetics` — inventário (user_id, cosmetic_id, acquired_at, source: `shop|drop|gift|seasonal`).
- `user_profile_loadout` — o que está equipado (user_id, banner_id, frame_id, sticker_ids[], effect_id, accent_color, bio text 200char).
- `cosmetic_drops` — drops aleatórios em eventos (cosmetic_id, guild_id nullable, expires_at, claimed_by nullable).

Grants + RLS conforme padrão (authenticated CRUD próprio; service_role full; anon SELECT no catálogo público).

**B2. Geração de arte por IA (pipeline)**
- Script admin no dashboard: "Gerar nova coleção de cosméticos" → gera N banners (1500x500), frames (transparent PNG), stickers (512x512 transparent) com temas variados.
- Banners gerados via `imagegen--generate_image` quality `standard`, salvos no bucket `profile-cosmetics` (Storage público).
- Pasta organizada por temporada: `cosmetics/winter-2026/banner-aurora.png`.
- Asset URLs imutáveis (Lovable Assets ou Supabase Storage público).
- Coleção inicial: 12 banners (4 commons, 4 rares, 3 epics, 1 legendary), 8 frames, 20 stickers.

**B3. Loja no site (dashboard)**
- Nova rota `_authenticated/loja.tsx` (loja pessoal, não por servidor) com tabs: Banners / Frames / Stickers / Efeitos / **Temporada**.
- Cards com preview da arte, raridade colorida (legendary = dourado animado), preço em 🪙 ou 💎.
- Filtro por raridade, "só meus", "ofertas da semana".
- Botão Comprar → server fn `purchaseCosmetic` (debita coins via RPC atômica, insere `user_cosmetics`, retorna preview).
- Aba "Meu Perfil" pra equipar/desequipar com preview ao vivo do card final.

**B4. Loja no Discord**
- `/perfil` → mostra o card renderizado (imagem).
- `/perfil loja` → menu paginado com botões de compra.
- `/perfil equipar <slot> <item>` → autocomplete só com itens do inventário.
- `/perfil preview <usuario>` → vê perfil de outro.

**B5. Rotação automática (o ponto-chave)**
- A loja **rotaciona** itens em destaque a cada 24h (sistema novo `cosmetic_rotation`):
  - 6 "ofertas do dia" com preço reduzido (-20%).
  - 2 itens raros aparecem só por 24h, depois somem por 30 dias.
- Itens **sazonais** só aparecem durante a temporada ativa; depois ficam "vault" (não compráveis até a próxima edição daquele tema).
- `pg_cron` diário 0h gera nova rotação automaticamente.
- No card de perfil, **stickers equipados se alternam** visualmente (até 3 stickers, mostrados em rotação no canvas).

**B6. Renderização do card de perfil**
- Server fn `renderProfileCard({ userId })` retorna imagem PNG composta:
  - Background (banner equipado)
  - Avatar com frame
  - Stickers nos cantos
  - Nome + nível + barra de XP + bio
  - Acento de cor escolhido
- Usar `@napi-rs/canvas` ou similar compatível com Workers? **Alternativa segura para edge**: gerar via HTML→imagem usando `satori` + `resvg-wasm` (pure JS/WASM, funciona em Cloudflare Workers).
- Resultado servido em `/api/public/profile/:userId/card.png` com cache 5min.
- Discord embed usa `.setImage(url)` apontando pra essa rota.

**B7. Drops e eventos**
- Subir de nível X tem chance de dropar cosmético comum.
- Top-1 da temporada ganha legendary exclusivo daquela edição.
- Comprar VIP libera 1 cosmético epic gratuito + acesso a "tom" exclusivo.
- Eventos sazonais (Natal, Junho, Halloween) ativam coleção temática automática.

---

### Ordem de implementação proposta

1. **A1 Temporadas + A4 Ranking** (mais rápido, usa infra existente)
2. **B1 Schema cosméticos** (migration única com tudo)
3. **B2 Pipeline de geração de arte** (coleção inicial — 12 banners + 8 frames + 20 stickers)
4. **B6 Renderizador de card** (satori+resvg-wasm em server route)
5. **B3+B4 Loja site e Discord** (CRUD + UI)
6. **B5 Rotação automática** (cron + UI de destaques)
7. **A2 Missões dinâmicas + A3 Insights + A5 Marcos + A6 Auto-tuning** (camada de inteligência)
8. **B7 Drops e integrações** (amarra tudo)

### Tech notes

- Rendering: **satori + @resvg/resvg-wasm** → funciona em Cloudflare Workers (sem `sharp`/`canvas` nativos).
- Storage: bucket `profile-cosmetics` público (cache CDN longo) + bucket `profile-cards-cache` privado (TTL 5min).
- Atomic purchase: RPC `cosmetic_purchase(_user, _cosmetic)` igual padrão de `economy_debit_wallet`.
- Cron de rotação: pg_cron → server route `/api/public/cron/cosmetic-rotation` com header `apikey`.
- Custo de IA: geração inicial é one-shot (~40 imagens). Coleções sazonais a cada 3 meses.

### Riscos

- `satori+resvg-wasm` no Worker pode ter limite de bundle. Plano B: renderizar card em Node-only serverless externo (Railway) e cachear no Storage.
- Rotação automática pode confundir usuários — manter aba "Catálogo completo" sempre visível.
- Arte gerada precisa curadoria mínima — adicionar aprovação manual antes de publicar coleção.

**Pergunto antes de começar:** quer que eu comece pelo **bloco A (sistemas automáticos, infra rápida)** ou pelo **bloco B (loja visual, mais épico e visível pro usuário)**? Posso também ir em paralelo: A1+A4 + B1+B2 numa primeira leva.
