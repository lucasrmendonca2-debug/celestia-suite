
# Reestruturação completa do Zenox

Tema: **Aurora Pastel Mágico** — fundo noturno `#1a1a2e`, lavanda `#a78bfa`, ciano `#67e8f9`, rosa `#fbcfe8`. Mascote (raposa mágica do bot) aparece em quase todas as telas.

## 1. Sistema visual global (`src/styles.css`)

Substituir tokens atuais por paleta Aurora:
- `--background: oklch(0.18 0.04 280)` (noite arroxeada)
- `--primary: oklch(0.75 0.16 295)` (lavanda)
- `--accent: oklch(0.85 0.12 200)` (ciano)
- `--secondary: oklch(0.88 0.06 350)` (rosa)
- Gradientes: `--gradient-aurora`, `--gradient-magic`
- Sombras com glow lavanda/ciano: `--shadow-glow`, `--shadow-magic`
- Fontes: **Outfit** (display) + **Figtree** (body), instaladas via `@fontsource`
- Animações novas: `float`, `sparkle`, `aurora-shift`, `wiggle`, `glow-pulse`

## 2. Mascote (5 variações geradas)

Gerar com `imagegen` em estilo coeso (raposa mágica pastel, olhos brilhantes):
1. `mascot-hero.png` — acenando, pose principal landing
2. `mascot-loading.png` — girando varinha
3. `mascot-error.png` — confuso/triste com placa "ops"
4. `mascot-404.png` — perdido com mapa
5. `mascot-sleeping.png` — dormindo (easter egg)
6. `mascot-celebrate.png` — com troféu/confete

## 3. Landing page (`src/routes/index.tsx`)

- Hero com mascote flutuando (`animate-float`), aurora gradiente animada de fundo, partículas mágicas, título com `bg-clip-text` gradiente
- Seção features em bento grid com cards glassmorphism + glow no hover
- Seção "como funciona" com mascote em cada passo
- CTA final com mascote celebrando
- Footer divertido

## 4. Dashboard (área logada)

- Sidebar redesenhada: mascote pequeno no topo, glow nos itens ativos, gradiente aurora sutil
- Cards com glassmorphism (`backdrop-blur`, borda gradiente)
- Loading states usam `mascot-loading` girando
- Header com saudação dinâmica ("Boa noite, fulano ✨")

## 5. Páginas de erro/loading

- `src/lib/error-page.ts` (página HTML estática SSR): redesenhar com mascote confuso, gradiente aurora, animações CSS inline, botão "voltar" estilizado
- Componente `<MagicLoader />` reutilizável com mascote girando
- 404 route com mascote perdido

## 6. Easter eggs (bônus leve)

- Konami code → mascote dormindo aparece no canto
- Clicar 5x no logo → confete + som
- Console.log com ASCII art do mascote

## 7. Correção de navegação

Manter o fix do `supabase-admin.server.ts` (já feito). Adicionar `errorComponent` consistente nas rotas `_authenticated/*` que ainda usam o erro genérico.

## Detalhes técnicos

- `bun add @fontsource-variable/outfit @fontsource-variable/figtree`
- Imports em `src/main.tsx` (ou equivalente) e família no `@theme`
- Mascote subido via `lovable-assets` (binários grandes) ou direto em `src/assets/` se pequeno
- Todas as cores via tokens semânticos — zero `text-white`/`bg-black` hardcoded
- Manter funcionalidade existente intacta (apenas camada visual + assets)

## Fora de escopo

- Mudança de lógica de negócio / queries
- Novas features do bot
- Refatoração das server functions
