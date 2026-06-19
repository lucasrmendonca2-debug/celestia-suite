# Plano — Pente-fino completo + Redesign Cyber

Help bug já consertado neste turno (causa: `default: true` no select + `deferUpdate+editReply` ephemeral → trocado por `interaction.update()` atômico).

## Parte A — Auditoria do bot (5–6 turnos)

### A1. Varredura automática (1 turno)
- Rodar `tsc --noEmit` no `bot/` e capturar TODOS erros TS.
- Rodar `rg` em padrões problemáticos conhecidos:
  - `interaction.reply` sem `ephemeral` em respostas de erro
  - `deferReply` sem `editReply` correspondente
  - `await interaction.reply` depois de `deferReply` (bug clássico)
  - `findOne/findMany` sem `await`
  - `process.env.X!` sem fallback
  - `client.commands.get(...)` sem check de null
- Gerar relatório em `bot/AUDIT.md`.

### A2. Categoria por categoria (4–5 turnos, ~2 categorias/turno)
Ordem por criticidade:
1. **moderation** (ban, kick, mute, warn, clear, lockdown) — perms, hierarquia de cargos, casos no DB
2. **tickets** (open, close, claim, transcript) — race conditions, perms de canal
3. **economy** (saldo, daily, work, shop, transfer, rank) — overflow, transações atômicas
4. **level** (rank, leaderboard, setxp, rewards) — cálculo de XP, cargo por nível
5. **fun + interaction** (memes, dados, hug, ship) — APIs externas (rate limit, timeout)
6. **utility + events + config** (ping, help, giveaway, automod, welcome) — edge cases

Para cada comando: typecheck → testar lógica → padronizar embeds (cor, footer, emoji) → garantir cooldown/perms → tratar erro de API externa → fallback de mensagem.

### A3. Sistemas compartilhados (1 turno)
- `embed.ts` — padronizar `brandEmbed` com nova identidade cyber (cores hex `#00F5FF`, `#FF006E`, `#8338EC`)
- `messages.ts` — tom Lorritta (carinhoso, divertido, brasileiro)
- `registry/command.registry.ts` — garantir que metadata bate com comandos reais
- `interactionCreate.ts` — guard global de erro (já tem, revisar)

## Parte B — Redesign cyber/futurista do site (4–5 turnos)

### B1. Design tokens + fontes (1 turno)
- Atualizar `src/styles.css` com paleta cyber:
  - `--background: oklch(0.08 0.02 270)` (preto azulado)
  - `--primary: oklch(0.78 0.22 200)` (cyan #00F5FF)
  - `--accent: oklch(0.65 0.30 350)` (rosa #FF006E)
  - `--secondary: oklch(0.55 0.28 290)` (roxo #8338EC)
  - Gradientes neon, glows, shadow-glow
- Fontes: Orbitron (display) + Inter (body) via `<link>` no `__root.tsx`

### B2. Componentes animados (1 turno)
Instalar `motion` (Framer Motion) + componentes MagicUI:
- `Particles` (fundo)
- `BorderBeam` (cards)
- `ShimmerButton` (CTAs)
- `MeteorShower` (hero)
- `AuroraText` (títulos)
- Scanlines CSS custom (efeito CRT)

### B3. Redesign do dashboard (2 turnos)
- `_authenticated.tsx` — sidebar com glow neon, transições suaves
- `dashboard.index.tsx` — hero com partículas, cards de servidores com `BorderBeam`
- `dashboard.$guildId.*.tsx` — refazer tabs com underline animado, micro-interações em hover
- Loading states com skeleton glowy
- Toasts neon

### B4. Login + landing (1 turno)
- `/login` — fundo animado, botão Discord com shimmer
- `/` (landing) — hero impactante, features em bento grid neon

## Parte C — Validação final (1 turno)
- `tsc --noEmit` no projeto + bot (zero erros)
- Smoke test do dashboard via Playwright (login → escolher servidor → trocar tab)
- Conferir publish

## Detalhes técnicos

```text
Turnos estimados: 11-13
├─ A1 varredura       → 1
├─ A2 categorias      → 4-5
├─ A3 sistemas        → 1
├─ B1 tokens          → 1
├─ B2 componentes     → 1
├─ B3 dashboard       → 2
├─ B4 login/landing   → 1
└─ C validação        → 1
```

**Stack adicional**: `motion` (já pode ter), `@fontsource/orbitron`, `@fontsource/inter`, instalação manual de MagicUI components (copiar fonte direto, não tem CLI universal).

**Risco**: Custo de créditos alto. Posso pausar entre Parte A e Parte B se quiser revisar antes de continuar.

## Próximo passo
Se aprovar, começo pela **Parte A1** (varredura automática + relatório). Você revisa o `AUDIT.md` e eu prossigo com as correções.
