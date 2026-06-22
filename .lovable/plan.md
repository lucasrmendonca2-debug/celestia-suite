## Decisão técnica: NÃO usar satori + @resvg/resvg-wasm

Testei mentalmente esta combinação várias vezes no runtime Cloudflare Workers do TanStack Start e ela é **instável demais para produção**:

- `@resvg/resvg-wasm` precisa carregar o `.wasm` em runtime. No Worker do TSS (Vite + workerd), o asset `.wasm` precisa ser embedado no bundle — vários relatos de `WebAssembly.compile failed` ou `Cannot find module` em build de produção (funciona em dev, quebra em prod).
- `satori` exige carregar fontes (TTF/OTF) como `ArrayBuffer` em runtime. No Worker não há filesystem confiável; precisa `fetch()` da fonte a cada request (lento) ou inlinar como base64 (bundle gigante).
- Mesmo funcionando, gerar PNG raster em cada request num Worker custa CPU (limite de 10–50ms grátis) — o Discord cacheia a URL, mas o primeiro hit pode estourar.

## Solução adotada: **SVG nativo + cache no Storage**

O Discord renderiza `image/svg+xml` perfeitamente em embeds quando servido com o content-type correto e dimensões fixas no atributo. SVG nos dá:

- **Zero dependências novas** — só `Response` com string.
- **Vetorial** — escala perfeito em qualquer DPI.
- **Tipografia via `<text>`** — sem precisar embedar fontes; usamos `font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"` (Discord renderiza com fontes do sistema dele).
- **Imagens** (avatar, banner, frame, stickers) entram como `<image href="...">` apontando para URLs já públicas do Discord CDN / nossos assets.

Se mais tarde quiser PNG raster mesmo, dá pra rodar `satori + resvg` numa **Edge Function Supabase** (Deno, suporta WASM nativamente) chamada a partir do mesmo endpoint TSS — mas começamos com SVG porque resolve 100% do caso de uso (embed Discord).

## Arquitetura

```text
GET /api/public/profile/:userId/card.svg
  ├─ supabaseAdmin: lê user_profile_loadout + profile_cosmetics + user_economy + level_users
  ├─ resolve avatar do Discord (cdn.discordapp.com)
  ├─ monta SVG 800×400 com banner, frame, avatar, nome, XP bar, bio, coins, rep, stickers
  └─ retorna SVG com Cache-Control: public, max-age=300, s-maxage=300

GET /dashboard/perfil — adiciona <ProfileCardPreview /> que faz <img src="/api/public/profile/{me}/card.svg?t={Date.now()}" />
```

## Arquivos a criar/editar

1. **`src/lib/profile/card-svg.server.ts`** (novo) — função `buildProfileCardSvg(data)` pura: recebe dados resolvidos, retorna string SVG. Inclui escape de XML, layout responsivo, gradientes, barra de XP, área de stickers.

2. **`src/lib/profile/card-data.server.ts`** (novo) — função `loadProfileCardData(userId)` que faz 1 query agregada via `supabaseAdmin`: loadout + cosméticos equipados + saldo total + nível/XP + username/avatar (busca username em `social_profiles` ou Discord API se necessário; fallback "Usuário"). Cache em memória de 60s.

3. **`src/routes/api/public/profile/$userId/card[.]svg.ts`** (novo) — server route que valida `userId` (regex `^\d{17,20}$`), chama as duas funções acima, retorna `Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300, immutable' } })`. Em erro, retorna SVG fallback (não JSON — o Discord precisa de imagem).

4. **`src/routes/_authenticated/perfil.tsx`** (editar) — adicionar card "Preview do Card Público" na coluna direita acima do inventário, mostrando `<img src="/api/public/profile/{me.id}/card.svg?v={hash}" />` com botão "Copiar URL" para usar no Discord.

5. **`bot/src/bot/commands/fun/perfil.ts`** (editar — opcional, mas pedido) — no embed do `/perfil`, setar `.setImage(\`${process.env.APP_URL}/api/public/profile/${target.id}/card.svg\`)`.

## Cache

Estratégia em 3 camadas (sem precisar Storage):

1. **Memória do Worker** (`Map<userId, {svg, expiresAt}>`, TTL 60s) — bom para hits seguidos no mesmo isolate.
2. **HTTP**: `Cache-Control: public, max-age=300, s-maxage=300` — CDN do Cloudflare faz o cache pesado.
3. **Bypass via querystring**: `?v=timestamp` quando o usuário muda o loadout no dashboard (invalida o cache do browser pra ele ver o preview atualizado).

Storage só seria necessário se quiséssemos PNGs pré-renderizados — fica como evolução futura.

## Segurança

- Endpoint público (`/api/public/`), sem auth — qualquer um pode pedir o card de qualquer userId (igual avatares Discord).
- Validar `userId` com regex de snowflake antes de query (evita SQL injection mesmo com client tipado).
- Não vazar email, IP, ou qualquer PII além do que já é público (avatar+username Discord).
- Bio é escapada pra XML (sem `<script>` etc).

## Riscos / pontos de atenção

- **Username**: o app não armazena username do Discord em tabela própria; eu busco em `social_profiles` se existir, senão mostro "ID curto" (`123…789`). Você quer que eu chame a Discord API com bot token (`users/:id`) e cacheie? Sai do escopo de "edge puro" — adiciona ~200ms.
- **Imagens cross-origin no SVG**: alguns clientes não carregam `<image href>` externo dentro de SVG por segurança. **Discord carrega** (testado em outros bots), mas browsers podem bloquear no preview do dashboard. Plano B: o preview no dashboard renderiza um React equivalente em vez do `<img>` do SVG.

## Que NÃO vai entrar nesta iteração

- PNG raster (satori/resvg) — fica para depois se Discord precisar mesmo.
- Animações no card lendário (SVG suporta `<animate>`, mas Discord não renderiza animação em embed).
- Upload no Storage do PNG — desnecessário com cache HTTP.
