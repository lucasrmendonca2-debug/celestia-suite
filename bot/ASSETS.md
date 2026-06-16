# Assets Visuais do Zenox — Guia Completo de Geração

Este documento lista **todos os assets visuais** que precisam ser criados externamente (por IA generativa ou designer) para o Zenox ter cara de produto premium. Cada item traz: **key estável**, onde é usado, formato/tamanho, estilo, prioridade e **prompt base** pronto pra colar numa IA (Midjourney/SDXL/DALL·E/Gemini).

> **Como cadastrar:** no dashboard → **Identidade Visual** (sidebar Admin), escolha o módulo, cole a URL pública da imagem, clique salvar. O bot resolve a URL por `key` automaticamente, com cache de 5 minutos.
>
> **Regra geral:** assets **sem texto** (exceto logos), fundo neutro escuro #0F172A combinando com tema Discord dark, paleta primária **azul #5865F2 + roxo #8B5CF6**, evitar visual infantil. Sempre que possível, exportar em **WebP** (banners/imagens) ou **PNG** (ícones, badges, transparência).

---

## Paleta oficial

| Token        | Hex       | Uso                                |
|--------------|-----------|------------------------------------|
| brand        | `#5865F2` | Identidade primária                |
| brand_glow   | `#8B5CF6` | Acento, gradiente premium          |
| success      | `#22C55E` | Confirmações                       |
| error        | `#EF4444` | Erros                              |
| warn         | `#F59E0B` | Avisos                             |
| info         | `#3B82F6` | Informação                         |
| premium      | `#F5C842` | VIP / Dourado                      |
| economy      | `#FBBF24` | Moeda                              |
| tickets      | `#14B8A6` | Atendimento                        |
| moderation   | `#DC2626` | Punições                           |
| fun          | `#EC4899` | Diversão                           |
| social       | `#A855F7` | Perfil/Level                       |
| logs         | `#64748B` | Cinza eventos                      |

---

## 1. GLOBAL

### `global.logo` — Logo do bot · **Prioridade ALTA**
- **Formato:** PNG transparente · **Tamanho:** 512x512
- **Estilo:** Logo redonda, letra "Z" estilizada com gradiente azul→roxo, glow sutil, sem texto.
- **Prompt:** *"Modern minimalist Discord bot logo, stylized letter Z with blue to purple gradient (#5865F2 to #8B5CF6), subtle neon glow, dark background, premium tech feel, vector style, no text"*

### `global.banner` — Banner principal · **ALTA**
- **PNG/WebP · 1200x400**
- **Estilo:** Banner horizontal futurista, dark, partículas/grid sutil, gradiente azul-roxo.
- **Prompt:** *"Premium horizontal banner for Discord bot landing, dark navy background with subtle grid pattern, blue and purple aurora light streaks, abstract geometric shapes, modern tech feel, no text, ultra HD"*

### `global.thumbnail_default` — Thumbnail padrão · **MÉDIA**
- **PNG · 512x512** — abstrato, mesmo gradiente da brand, sem texto.
- **Prompt:** *"Abstract premium thumbnail, blue purple gradient orb, soft glow, dark background, modern minimal, no text"*

### `global.footer_icon` — Ícone do footer · **BAIXA**
- **PNG · 64x64** — versão micro da logo.

---

## 2. WELCOME

### `welcome.banner` · **ALTA**
- **WebP · 1200x400**
- **Prompt:** *"Welcoming banner for Discord community, warm purple-blue gradient sky, abstract waving hand silhouette and floating stars, festive but elegant, dark base, no text"*

### `welcome.goodbye_banner` · **MÉDIA**
- **WebP · 1200x400**
- **Prompt:** *"Bittersweet goodbye banner, twilight gradient blue to violet, silhouette of figure walking into distance with light particles, melancholic but classy, no text"*

### `welcome.card_background` · **ALTA**
- **PNG · 1200x500**
- **Prompt:** *"Background for member welcome card, dark navy with diagonal blue purple light streaks, subtle bokeh, leaves space empty on left for avatar and right for text, no text"*

---

## 3. TICKETS

### `tickets.panel_banner` · **ALTA**
- **WebP · 1200x400**
- **Prompt:** *"Premium support center banner, dark teal and navy gradient (#0F172A to #14B8A6), abstract headset and chat bubble icons floating, futuristic glassmorphism, soft glow, no text"*

### `tickets.icon_support` · **ALTA**
- **PNG transparente · 256x256**
- **Prompt:** *"Modern flat icon of a headset with chat bubble, teal and cyan gradient, premium minimal style, on solid white background, no text"*

### `tickets.icon_purchase` · **ALTA**
- **PNG · 256x256**
- **Prompt:** *"Modern flat icon of a shopping bag with shine, gold and amber gradient, premium minimal, on solid white background"*

### `tickets.icon_report` · **MÉDIA**
- **PNG · 256x256**
- **Prompt:** *"Modern flat icon of a shield with exclamation, red gradient, minimal premium, on solid white background"*

### `tickets.icon_partnership` · **MÉDIA**
- **PNG · 256x256**
- **Prompt:** *"Modern flat icon of two interlinked rings or handshake, purple gradient, minimal premium, on solid white background"*

### `tickets.icon_vip` · **ALTA**
- **PNG · 256x256**
- **Prompt:** *"Modern flat icon of a crown with diamond, gold gradient (#F5C842), premium luxury, on solid white background"*

### `tickets.closed_image` · **BAIXA**
- **WebP · 1200x400** — banner "atendimento finalizado", check verde gigante e confetes sutis.

### `tickets.rating_image` · **BAIXA**
- **WebP · 1200x400** — 5 estrelas douradas em arco, fundo azul-roxo.

---

## 4. ECONOMIA

### `economy.banner` · **ALTA**
- **WebP · 1200x400**
- **Prompt:** *"Premium economy system banner, gold coins floating against dark gradient background with subtle particles, treasure vibe but modern minimalist, no text"*

### `economy.currency_icon` · **ALTA**
- **PNG · 256x256**
- **Prompt:** *"Premium minimal coin icon, gold to amber gradient (#FBBF24), letter Z embossed on front, shiny metallic finish, on solid white background, no shadow text"*

### `economy.daily_image` · **MÉDIA**
- **WebP · 1200x400** — calendário+presente, "daily reward" vibe sem texto.

### `economy.work_image` · **MÉDIA**
- **WebP · 1200x400** — ferramentas estilizadas com brilho.

### `economy.crime_image` · **MÉDIA**
- **WebP · 1200x400** — máscara/cofre, vibe noir.

### `economy.shop_image` · **MÉDIA**
- **WebP · 1200x400** — vitrine futurista com itens flutuando.

### `economy.top_image` · **MÉDIA**
- **WebP · 1200x400** — pódio dourado com troféu central.

---

## 5. SOCIAL / LEVEL

### `social.rank_background` · **ALTA**
- **PNG · 1200x500** — fundo para rank card.
- **Prompt:** *"Rank card background for Discord, dark gradient purple to navy, abstract geometric lines on right side, leaves left side empty for avatar, gaming/premium feel, no text"*

### `social.profile_banner` · **ALTA**
- **WebP · 1200x400** — banner default de perfil.

### `social.levelup_banner` · **ALTA**
- **WebP · 1200x400**
- **Prompt:** *"Level up celebration banner, exploding light particles in purple and gold, abstract arrow going up, festive but premium, dark background, no text"*

### `social.frame_common` / `social.frame_vip` · **MÉDIA**
- **PNG transparente · 512x512** — molduras circulares para avatar (common = prata neutra; VIP = dourada com brilho).

### `social.icon_rep` · **MÉDIA** — coração estilizado rosa.
### `social.icon_xp` · **MÉDIA** — gráfico subindo, roxo neon.
### `social.icon_achievement` · **MÉDIA** — troféu dourado minimalista.
- **PNG · 256x256** cada, fundo branco sólido.

---

## 6. PREMIUM

### `premium.banner` · **ALTA**
- **WebP · 1200x400**
- **Prompt:** *"Luxury premium banner, deep purple to gold gradient, floating diamond shapes and light beams, ultra premium feel, glassmorphism, no text"*

### `premium.vip_badge` · **ALTA**
- **PNG transparente · 512x512**
- **Prompt:** *"Premium VIP badge, gold crown with diamond center, gradient gold (#F5C842), shiny metallic, on solid white background, no text"*

### `premium.locked_image` · **MÉDIA**
- **WebP · 1200x400** — cadeado dourado num portal de luz.

### `premium.plan_image` · **BAIXA**
- **WebP · 1200x400** — cartão holográfico flutuando.

---

## 7. DIVERSÃO / INTERAÇÕES (GIFs)

Use **GIFs prontos do Tenor** ou gere com IA de vídeo. Todos `~480x270` ou quadrados 480x480.

| Key | Descrição | Prompt curto |
|-----|-----------|--------------|
| `fun.hug_gif` | Abraço anime | "anime hug gif, cute, warm colors" |
| `fun.kiss_gif` | Beijo anime | "anime kiss gif, soft, romantic" |
| `fun.slap_gif` | Tapa anime | "anime slap gif, comedic" |
| `fun.pat_gif` | Carinho cabeça | "anime head pat gif, cute" |
| `fun.bonk_gif` | Bonk meme | "anime bonk gif, comedic" |
| `fun.cuddle_gif` | Chamego | "anime cuddle gif, cozy" |
| `fun.poke_gif` | Cutucada | "anime poke gif, playful" |

### `fun.ship_image` · **BAIXA**
- WebP · 1200x400 — corações conectando dois avatares (espaço vazio nos lados).

### `fun.marriage_image` · **BAIXA**
- WebP · 1200x400 — alianças douradas sobrepostas, pétalas.

---

## 8. MODERAÇÃO / LOGS

### `moderation.icon_ban` · **MÉDIA**
- PNG · 256x256 — martelo de juiz vermelho.
- **Prompt:** *"Flat icon of a gavel hammer, red gradient (#DC2626), minimal premium, solid white background"*

### `moderation.icon_mute` · **MÉDIA** — microfone cortado, vermelho.
### `moderation.icon_warn` · **MÉDIA** — triângulo de alerta amarelo.
### `moderation.icon_shield` · **ALTA** — escudo azul com check.

### `moderation.automod_banner` · **MÉDIA**
- **WebP · 1200x400**
- **Prompt:** *"Automod system banner, dark red gradient with shield and AI circuit pattern, security premium feel, no text"*

### `logs.icon_message_deleted` · **BAIXA**
- PNG · 256x256 — balão de fala com X, cinza.

---

## 9. DASHBOARD (front-end web)

> Esses **não** entram em `bot_assets` (são usados na UI do dashboard). Coloque em `src/assets/`.

### `dashboard.logo_horizontal` · **ALTA**
- SVG ou PNG · 800x200 — logo + wordmark "Zenox" horizontal.

### `dashboard.logo_compact` · **ALTA**
- SVG · 96x96 — só ícone.

### `dashboard.login_background` · **MÉDIA**
- WebP · 1920x1080 — aurora azul-roxa, partículas, dark.

### `dashboard.empty_state` · **MÉDIA**
- SVG/WebP · 800x600 — ilustração minimalista "nada por aqui".

### `dashboard.premium_lock` · **MÉDIA**
- SVG · 800x600 — cofre dourado com brilho.

### `dashboard.error_illustration` · **BAIXA**
- SVG · 800x600 — robô triste.

### `dashboard.setup_complete` · **BAIXA**
- SVG · 800x600 — check gigante com confetes.

---

## 10. EMOJIS CUSTOMIZADOS

Upload no servidor de suporte do bot. **128x128 PNG**, sem fundo.

| Nome      | Prompt |
|-----------|--------|
| `zenoxok` | Check verde com glow, premium |
| `zenoxno` | X vermelho com glow |
| `zenoxwarn` | Triângulo amarelo neon |
| `zenoxload` | Loading spinner azul (apng se possível) |
| `zenoxcoin` | Moeda Z dourada |
| `zenoxxp` | Estrela roxa neon |
| `zenoxvip` | Coroa dourada mini |
| `zenoxticket` | Ticket roxo teal |
| `zenoxstaff` | Ferramenta cruzada azul |
| `zenoxshop` | Sacola dourada |
| `zenoxrank` | Medalha dourada |
| `zenoxachievement` | Troféu roxo |

---

## 11. BADGES (para perfil/conquistas)

PNG transparente **512x512**, estilo medalha/selo.

| Key             | Estilo |
|-----------------|--------|
| badge.founder   | Coroa real com gemas, dourado intenso |
| badge.staff     | Escudo azul com estrela |
| badge.vip       | Diamante roxo com brilho |
| badge.top_level | Medalha verde XP |
| badge.top_economy | Medalha dourada moeda |
| badge.beta_tester | Erlenmeyer com líquido azul |
| badge.supporter | Coração rosa com glow |
| badge.bug_hunter | Lupa com bug verde |
| badge.event     | Confete colorido |
| badge.legendary | Chama arco-íris premium |

**Prompt base:** *"Premium circular badge medal, [tema], shiny metallic finish, glow ring around, gaming achievement style, transparent background, ultra detailed"*

---

## Prioridades de produção

**Sprint 1 (must-have para o bot virar premium):**
- `global.logo`, `global.banner`
- `tickets.panel_banner` + os 5 `tickets.icon_*`
- `economy.currency_icon`, `economy.banner`
- `social.rank_background`, `social.levelup_banner`
- `premium.vip_badge`, `premium.banner`
- `moderation.icon_shield`
- `dashboard.logo_horizontal`, `dashboard.logo_compact`

**Sprint 2 (polimento):**
- Restantes ícones e banners
- GIFs de interação
- Badges principais

**Sprint 3 (variações):**
- Emojis customizados
- Backgrounds extras de rank
- Ilustrações empty state

---

## Como o código usa

```ts
// no bot
import { ui } from "@/bot/systems/ui/embed.factory.js";
import { getAsset } from "@/bot/systems/ui/embed.assets.js";

const banner = await getAsset(interaction.guildId, "tickets.panel_banner");
await interaction.reply({
  embeds: [ui.ticket({ kind: "panel", guildId: interaction.guildId, image: banner })],
});
```

Se a URL não estiver cadastrada, o embed renderiza sem a imagem — **nada quebra**.
