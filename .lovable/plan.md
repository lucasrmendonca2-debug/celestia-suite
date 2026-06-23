## Polish & Feature Pass — Loja, Perfil, Premium, Hall da Fama

Sete melhorias coordenadas no front-end (loja, perfil, premium) + uma rota pública nova. Sem mudanças no bot Discord. Backend ganha 1 tabela (favoritos) + 1 view pública (hall da fama).

### 1. Loja — paginação + busca melhorada
- A loja já tem busca por texto e filtros de raridade/tipo. Adicionar paginação client-side (24 itens/página) com controles `Prev/Next` + indicador `X de Y`.
- Manter o `useMemo` filtrado e fatiar com `slice((page-1)*24, page*24)`; resetar página quando filtros mudam.
- Search atual já filtra por nome/description; adicionar match também por `rarity` traduzido.

### 2. Sistema de Favoritos
- **Nova tabela** `public.user_favorite_cosmetics` (user_id auth.uid, cosmetic_id fk, created_at, PK composto). RLS scoped a `auth.uid()`, GRANTs corretos.
- **Server fns** em `src/lib/profile/favorites.functions.ts`: `toggleFavorite({ cosmeticId })`, `listFavorites()`. Ambos com `requireSupabaseAuth`.
- **UI** na loja: botão coração (lucide `Heart`) no canto do `ItemCard`, com estado `filled/outline`. Aba nova "★ Favoritos" no `TYPE_TABS`. Animação `scale-in` no toggle.
- Atualizar `getShopCatalog` para retornar `favoriteIds: string[]` junto.

### 3. Histórico de compras em `/perfil`
- Já existe `cosmetic_drops` + `user_cosmetics` com `source` + `metadata`. Criar server fn `getPurchaseHistory()` que faz join de `user_cosmetics` × `profile_cosmetics` ordenado por `acquired_at desc`, limit 50.
- Adicionar tab "Histórico" na página `/perfil` (assumindo Tabs já existem; senão adicionar uma section). Lista com ícone, nome, raridade, source ("shop", "drop", "level_reward", "seasonal"), preço pago (do `metadata.price_paid`) e data relativa.

### 4. `/premium` — vitrine visual de cosméticos VIP
- Adicionar seção "Cosméticos exclusivos VIP" abaixo dos benefícios. Carousel/grid com cosméticos onde `rarity = 'legendary'` OU `collection = 'vip'`. Server fn pública `getPremiumShowcase()` retornando até 8 itens.
- Cada card mostra preview da imagem com hover glow âmbar (`shadow-elegant` + animação `hover-scale`). Badge "Exclusivo VIP" sobre item.

### 5. Animação ao equipar cosmético
- Instalar `canvas-confetti` (lib leve, ~5kb gzip, sem dependências de DOM Node).
- Em `/perfil` e `/loja`, no callback de sucesso do equip/purchase, disparar:
  - Confetti curto (1.5s, 60 partículas, cores âmbar `#F59E0B` `#FBBF24` `#EA580C`).
  - Animação CSS `animate-scale-in` + `drop-shadow-[0_0_30px_hsl(45_100%_60%/0.6)]` no card do item por 1.5s.

### 6. Página pública `/hall-da-fama`
- **Rota nova** `src/routes/hall-da-fama.tsx` (pública, SSR-on, com `head()` + OG tags).
- **Server fn pública** `getHallOfFame()` usando o server publishable client. Consulta:
  - Top 10 XP da `level_season_users` na temporada ativa (`level_seasons.active = true`), com usernames de `social_profiles`.
  - Top 10 coins de `user_economy` agregado cross-guild.
  - Top 10 reputação de `reputation_logs` últimos 30 dias.
- **View pública** `public.hall_of_fame_view` ou função `SECURITY DEFINER` (mais simples) retornando os três tops em uma chamada. Policy `GRANT EXECUTE ... TO anon`.
- **Design**: hero com mascote-celebrate, 3 colunas (XP / Coins / Reputação), top 3 destacados com medalhas 🥇🥈🥉, avatares (gravatar fallback), animação `fade-in` em cascata.

### 7. Empty states com mascote Zenox
- Loja vazia (sem filtros encontrando nada): `mascot-paint-escape.png` ou `chibi-climb-2.png` + "Nenhum cosmético com esses filtros. Tenta limpar a busca."
- Loja sem ofertas do dia: mascote loading.
- Perfil sem cosméticos comprados (aba histórico vazia): `mascot-sleeping.png` + "Você ainda não comprou nenhum cosmético. Bora pra loja?".
- Inventário vazio (se existir página): mesma vibe.

### Detalhes técnicos

**Migrations** (1 só):
- `user_favorite_cosmetics` (user_id, cosmetic_id, created_at; PK composto). RLS + grants.
- `hall_of_fame_snapshot()` função SECURITY DEFINER retornando JSON com `top_xp`, `top_coins`, `top_rep`. `GRANT EXECUTE ... TO anon, authenticated`.

**Arquivos novos:**
- `src/lib/profile/favorites.functions.ts`
- `src/lib/profile/purchase-history.functions.ts`
- `src/lib/hall-of-fame.functions.ts`
- `src/lib/animations/confetti.ts` (helper wrapper)
- `src/routes/hall-da-fama.tsx`
- `src/components/profile/PurchaseHistory.tsx`
- `src/components/profile/EmptyMascot.tsx` (reutilizável)
- `src/components/loja/PremiumShowcase.tsx`

**Arquivos editados:**
- `src/routes/_authenticated/loja.tsx` — paginação, favoritos, confetti, empty state
- `src/routes/_authenticated/perfil.tsx` — aba histórico, confetti no equip
- `src/routes/premium.tsx` — seção showcase VIP
- `src/lib/profile/profile.functions.ts` — incluir `favoriteIds` em `getShopCatalog`

**Dependência nova:**
- `canvas-confetti` + `@types/canvas-confetti`

**Ordem de execução:**
1. Migration (tabela favoritos + função hall of fame)
2. Server fns + componentes reutilizáveis
3. Rota nova `/hall-da-fama`
4. Edits na loja (paginação + favoritos + empty + confetti)
5. Edits no perfil (histórico + confetti)
6. Edits no `/premium` (showcase)

Confirma e eu sigo.