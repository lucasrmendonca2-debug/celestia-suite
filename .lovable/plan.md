# Plano — consertar erros e plugar dados reais

Quatro frentes, em ordem de impacto. Posso fazer tudo numa sequência de mensagens; cada bloco abaixo é uma etapa entregável.

## 1. Erro "Missing Supabase environment variable(s)"

**Sintoma:** tela "Algo deu errado" no preview e no publicado ao abrir `/g/<guildId>`. A mensagem cita `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`.

**Causa:** o loader server-side de `g.$guildId.tsx` puxa `requireUser`/`listMyGuilds`/`checkBotInGuild`, que em algum ponto importam o browser client (`src/integrations/supabase/client.ts`). Esse client lança o erro acima quando `import.meta.env.VITE_*` e `process.env.SUPABASE_*` não são alcançados pelo worker (caso típico no build publicado / SSR onde só os bare `SUPABASE_URL` estão garantidos).

**Correção:**
- Garantir que toda leitura server-side use o cliente server (`requireSupabaseAuth` ou um client publishable server-local), nunca o browser client.
- Caçar imports indevidos do `@/integrations/supabase/client` dentro de `*.functions.ts` / `*.server.ts` e trocar.
- Acrescentar fallback no `client.ts` para também aceitar `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` sem prefixo `VITE_` durante SSR, de forma defensiva.

## 2. URL do dashboard por slug

**Hoje:** `/g/722253176283070506` (snowflake do Discord).
**Quero:** `/dashboard/<slug>` derivado do nome do servidor (ex: `meu-servidor-legal`), e o resto do dashboard sob esse slug (`/dashboard/<slug>/moderacao`, `/economia`, etc).

**Como:**
- Criar `slug` derivado de `guild.name` (kebab-case + sufixo curto do guildId pra evitar colisão, ex: `meu-servidor-legal-3070506`).
- Mover/renomear os arquivos `src/routes/_authenticated/g.$guildId.*` para `dashboard.$slug.*`.
- Resolver `slug → guildId` no loader do layout consultando a lista de guilds do usuário; redirecionar para `/servidores` em slug inválido.
- Atualizar todos os `<Link>` (sidebar, topbar, página de servidores) para a nova rota.
- Manter um redirect de `/g/$guildId` → novo formato pra não quebrar links antigos.

## 3. Botão "Entrar" do header

**Hoje:** o `Link` do header só leva para `/entrar`, que exibe outra tela com o botão real. O usuário descreve isso como "não funciona".

**Correção:** transformar o "Entrar" do header (desktop + menu mobile) num `<a>` que dispara o OAuth do Discord direto, igual ao botão da landing (`/api/auth/discord/login?origin=...`). Mantém `/entrar` como página de fallback.

## 4. Dados reais na landing pública

**Páginas:** `/` (home), `/recursos`, `/comandos`, `/premium`, `/status`, `/docs`, `/blog`, `/suporte`.

**Plano:**
- **Home (`/`):** trocar números chumbados (`+12k servidores`, `+90 comandos`, etc.) por dados reais lidos via server function:
  - servidores: `count` de `bot_guild_presence` onde `present = true`.
  - comandos: contar arquivos em `bot/src/bot/commands/**/*.ts` em build time (geramos um JSON), ou hardcode revisado com o número real (~XX comandos).
  - uptime / latência: ler de `bot_guild_presence` (heartbeat mais recente) ou da tabela de presence; se não houver dado, esconder o card em vez de mostrar fake.
- **`/comandos`:** gerar a lista a partir do diretório `bot/src/bot/commands/**` (script Node em build, gera `src/data/commands.json`) e renderizar agrupado por categoria. Some o mesmo número usado na home.
- **`/recursos`:** revisar copy pra refletir só os módulos que existem mesmo no bot (cruzar com `bot/src/bot/systems/` e tabelas do Supabase). Remover funções inexistentes.
- **`/premium`:** ler planos de `premium_plans` (tabela já existe) via server fn pública; mostrar nome, preço, features. Esconder a página/CTA se a tabela vier vazia.
- **`/status`:** trocar mock por dados de `bot_guild_presence` (último heartbeat, guilds online).
- **`/docs`, `/blog`, `/suporte`:** confirmar com você o que deve aparecer — hoje são mocks. Sugiro deixar `/docs` com índice estático real (links pros recursos), `/blog` escondido até ter post real, `/suporte` com link de convite real do servidor de suporte.

## Ordem de execução proposta

1. Etapa 1 (env error) — destrava o dashboard.
2. Etapa 3 (botão Entrar) — fix rápido.
3. Etapa 2 (slug nas URLs) — refactor médio.
4. Etapa 4 (dados reais) — quebrada por página, posso fazer home + comandos + premium + status numa rodada e o resto depois.

## Perguntas que preciso travar antes da etapa 4

- `/blog`: tem posts reais em algum lugar (Notion, Markdown no repo, CMS)? Se não, posso esconder do header até ter conteúdo?
- `/suporte`: qual o link de convite do servidor de suporte oficial?
- Slug: tudo bem usar `nome-do-servidor-<sufixo>` ou prefere outro padrão?

Aprova esse plano? Se sim, começo pela etapa 1.
