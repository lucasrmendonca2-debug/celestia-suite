## Escopo proposto

O projeto tem 22 páginas no dashboard + páginas públicas. Refazer "tudo do zero" é grande — proponho fazer em fases, validando cada uma antes de continuar.

### Fase 1 — Reestruturação de rotas (URLs bonitas)
Renomear arquivos para URLs mais limpas:

```
ANTES                                         DEPOIS
/dashboard/$guildId                       →   /g/$guildId
/dashboard/$guildId/moderation            →   /g/$guildId/moderacao
/dashboard/$guildId/automod               →   /g/$guildId/automod
/dashboard/$guildId/autorole              →   /g/$guildId/cargo-automatico
/dashboard/$guildId/welcome               →   /g/$guildId/boas-vindas
/dashboard/$guildId/leveling              →   /g/$guildId/niveis
/dashboard/$guildId/economy               →   /g/$guildId/economia
/dashboard/$guildId/tickets               →   /g/$guildId/tickets
/dashboard/$guildId/logs                  →   /g/$guildId/logs
/dashboard/$guildId/embeds                →   /g/$guildId/embeds
/dashboard/$guildId/community             →   /g/$guildId/comunidade
/dashboard/$guildId/social                →   /g/$guildId/social
/dashboard/$guildId/seasons               →   /g/$guildId/temporadas
/dashboard/$guildId/achievements          →   /g/$guildId/conquistas
/dashboard/$guildId/badges                →   /g/$guildId/badges
/dashboard/$guildId/reaction-roles        →   /g/$guildId/cargos-reacao
/dashboard/$guildId/commands              →   /g/$guildId/comandos
/dashboard/$guildId/assets                →   /g/$guildId/assets
/dashboard/$guildId/premium               →   /g/$guildId/premium
/dashboard/$guildId/permissoes            →   /g/$guildId/permissoes
/dashboard                                →   /servidores
/admin/premium                            →   /admin/premium (mantém)
/login                                    →   /entrar
/comandos                                 →   /comandos (mantém)
```

Atualizo todos os `<Link>`, redirects e o sidebar.

### Fase 2 — Layout/shell do dashboard novo
Reescrevo do zero:
- `src/components/dashboard/DashboardShell.tsx` — sidebar Aurora + topbar com mascote
- `src/components/dashboard/GuildSidebar.tsx` — navegação agrupada (Moderação / Engajamento / Economia / Avançado)
- Loading state com mascote pixel girando
- Error boundary com mascote triste + botão "tentar de novo"
- 404 com mascote do mapa

### Fase 3 — Páginas do dashboard
Reescrever as 22 páginas é muito trabalho. Proponho:
- **Reescrever do zero**: index (overview), moderação, boas-vindas, níveis, economia, tickets — as 6 mais usadas
- **Apenas re-skin** (manter lógica, trocar visual pra Aurora): as outras 16

### Fase 4 — Polimento
- Mascote onipresente (peek button, hover easter eggs)
- Animações aurora nas transições
- SEO em todas as rotas públicas

---

## Confirmações antes de começar

1. **URLs em português** (`/servidores`, `/moderacao`) ou manter em inglês (`/servers`, `/moderation`)?
2. **Manter redirects** das URLs antigas (`/dashboard/...` → `/g/...`) pra não quebrar links já compartilhados?
3. **Fase 3**: ok com 6 reescritas + 16 re-skins, ou quer todas reescritas do zero (vai consumir bem mais)?
4. Começo já pela **Fase 1** ou prefere ajustar o plano?