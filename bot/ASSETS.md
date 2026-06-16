# Assets Visuais do Zenox — Guia Completo

> **Regra de ouro:** o **mascote Zenox é a marca**. Ele aparece em quase todo asset (banners, ilustrações, splashes). Ícones e badges são objetos isolados, mas seguem a mesma DNA: ilustração chibi cartoon ousada, contorno preto grosso, **paleta âmbar/laranja quente sobre fundo preto**, sombreamento dramático, atitude descolada (smirk, óculos baixando, polegar pra cima).
>
> A meta é ter algo **mais marcante que a Loritta** — não genérico, não corporativo, não "tech minimalista". Sempre que possível, o mascote olha pro jogador com a atitude característica: óculos escuros sendo abaixados com o polegar, sorriso confiante, energia de streamer/gamer.

---

## Identidade do mascote Zenox

Referência canônica: `src/assets/zenox-mascot.png` — chibi cartoon do garoto com cabelo preto-marrom volumoso e desgrenhado, pele bronzeada quente (laranja-âmbar), óculos de sol pretos retangulares sendo abaixados com o polegar, olho direito grande e expressivo (íris marrom-âmbar), sorriso aberto mostrando atitude, hoodie preto, fundo preto sólido. Estilo: ilustração cartoon polida, contorno preto, sombras pintadas com pincel digital, look de avatar Discord premium / Twitch / mascote de game.

**Sempre incluir em qualquer prompt onde ele aparece, como PRIMEIRA frase:**

> *"Zenox mascot: chibi cartoon boy, messy voluminous dark brown-black hair with subtle warm highlights, warm tan-orange skin tones, large expressive brown eyes with bright catchlights, thick black rectangular sunglasses being pulled down with his thumb to reveal one eye, confident open smirk showing attitude, black hoodie, bold black outlines, painterly shading with strong warm orange-amber light, polished cartoon illustration style for premium Discord / Twitch / gaming mascot — match the established Zenox character design exactly."*

Cole esse bloco como **primeira frase** de qualquer prompt envolvendo o personagem. Depois descreva a cena/pose/cenário. O fundo padrão é preto sólido (`#0A0A0A`) com luz quente em volta do personagem.

---

## Paleta oficial

A paleta nova é **âmbar quente sobre preto**, refletindo o avatar. Azul/roxo permanecem como acentos de UI (botões, links), mas a "cara" do bot é laranja sobre preto.

| Token        | Hex       | Uso                                |
|--------------|-----------|------------------------------------|
| brand        | `#F59E0B` | Âmbar Zenox — cor principal        |
| brand_warm   | `#EA580C` | Laranja queimado — sombras quentes |
| brand_glow   | `#FBBF24` | Glow âmbar claro — destaques       |
| ink          | `#0A0A0A` | Preto fundo                        |
| ink_soft     | `#1C1917` | Preto secundário                   |
| accent_blue  | `#3B82F6` | Acento (links de dashboard)        |
| success      | `#22C55E` | Confirmações                       |
| error        | `#EF4444` | Erros                              |
| warn         | `#F59E0B` | Avisos (mesmo do brand)            |
| premium      | `#F5C842` | VIP / Dourado                      |
| economy      | `#FBBF24` | Moeda                              |
| tickets      | `#F97316` | Atendimento (laranja vivo)         |
| moderation   | `#DC2626` | Punições                           |
| fun          | `#EC4899` | Diversão                           |
| social       | `#A855F7` | Perfil/Level                       |
| logs         | `#64748B` | Cinza eventos                      |

Fundo padrão dos banners: preto sólido `#0A0A0A` com luz radial âmbar `#EA580C` saindo de trás do personagem (efeito spotlight/rim light quente). Partículas opcionais: faíscas laranjas, motion blur curto.

---

## 1. GLOBAL

### `global.logo` — Logo redonda · **ALTA**
- **PNG · 512x512** — exatamente o avatar canônico atual. Não regerar; reusar `zenox-mascot.png`.

### `global.banner` — Banner principal · **ALTA**
- **WebP · 1200x400**
- **Prompt:** *"[BLOCO MASCOTE] — full body chibi dynamic pose, leaning forward with one hand pulling sunglasses down, free hand making a finger-gun gesture, motion lines, deep black background with a radial warm orange-amber glow spotlighting him from behind, floating Discord-style UI panels and chat bubbles in soft amber, no text, ultra polished cartoon keyvisual."*

### `global.thumbnail_default` — **MÉDIA**
- **PNG · 512x512** — busto do mascote em ¾, fundo preto com glow âmbar, mesma vibe do avatar.

### `global.footer_icon` — **BAIXA**
- **PNG · 64x64** — só os óculos pretos com um pequeno brilho âmbar, fundo transparente.

---

## 2. WELCOME

### `welcome.banner` · **ALTA**
- **WebP · 1200x400**
- *"[BLOCO MASCOTE] — character on the right, leaning casually against the frame, sunglasses pulled down with the thumb, free hand giving a friendly wave, warm amber confetti scattered around, black background with orange radial glow, leaves the left third empty for username text, polished cartoon style, no text."*

### `welcome.goodbye_banner` · **MÉDIA**
- *"[BLOCO MASCOTE] — chibi version waving goodbye over his shoulder, sunglasses on, slight melancholic smirk, black background with faint dim amber light, falling sparks, leaves left side empty, no text."*

### `welcome.card_background` · **ALTA**
- **PNG · 1200x500**
- *"Background for member welcome card: pure black canvas with a wide horizontal warm amber radial gradient, subtle orange particle bokeh, faint silhouette of the Zenox mascot peeking from the right corner with sunglasses lifted, leaves the left side empty for avatar and center for text, no text."*

---

## 3. TICKETS

### `tickets.panel_banner` · **ALTA**
- *"[BLOCO MASCOTE] — character sitting at a sleek black support desk wearing his sunglasses, leaning on his elbow with a relaxed confident smirk, glowing amber chat bubbles and ticket icons floating around, deep black background with warm orange spotlight from above, polished cartoon support-center scene, no text."*

### `tickets.icon_support` · **ALTA**
- **PNG transparente · 256x256** — bolha de chat preta com contorno âmbar grosso e um pequeno headset preto sobreposto, mesmo traço cartoon do mascote.

### `tickets.icon_purchase` · **ALTA**
- Sacola de compras preta com fita âmbar e moedas laranjas saindo, contorno preto grosso, fundo transparente.

### `tickets.icon_report` · **MÉDIA**
- Escudo preto com exclamação âmbar/vermelha neon, mesmo estilo cel-shaded.

### `tickets.icon_partnership` · **MÉDIA**
- Dois apertos de mão estilizados em laranja e preto, com brilho âmbar entre eles.

### `tickets.icon_vip` · **ALTA**
- Coroa dourada com óculos escuros (referência ao mascote), glow âmbar intenso, fundo transparente.

### `tickets.closed_image` · **BAIXA**
- *"[BLOCO MASCOTE] — chibi giving a confident thumbs-up with sunglasses on, big amber check mark glowing behind him, black background, sticker style, no text."*

### `tickets.rating_image` · **BAIXA**
- *"[BLOCO MASCOTE] — chibi holding 5 glowing amber stars in his hand, sunglasses lifted slightly, excited grin, black background, no text."*

---

## 4. ECONOMIA

### `economy.banner` · **ALTA**
- *"[BLOCO MASCOTE] — character casually tossing a glowing amber coin in the air with a mischievous smirk, sunglasses on, free hand in hoodie pocket, more coins floating around with warm motion trails, black background with deep orange glow, polished cartoon scene, no text."*

### `economy.currency_icon` · **ALTA**
- *"Premium glowing coin with a stylized letter Z embossed on front, amber-to-orange gradient (#FBBF24 to #EA580C), thick black outline, painterly highlight, cartoon game item icon style, 3/4 angle, sparkles, transparent background, no text other than the Z."*

### `economy.daily_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, opening a black gift box wrapped with an amber ribbon, coins exploding out in slow motion, eyes wide with a happy smirk, sunglasses pushed up on his head, black background, no text."*

### `economy.work_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, sunglasses on, sleeves of hoodie rolled up, holding a glowing amber wrench casually over his shoulder, smug confident look, black background, no text."*

### `economy.crime_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, sunglasses pulled down with thumb, finger over lips in a 'shhh' gesture, sneaky grin, tiny coin bag in the other hand, noir spotlight on black background, comedic cartoon style, no text."*

### `economy.shop_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, behind a black counter with floating amber-glowing items (potions, badges, frames) above it, arms spread in welcoming gesture, sunglasses on, black background with warm light, no text."*

### `economy.top_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi standing on a glowing amber 1st-place podium, holding a glowing trophy above his head with one hand, sunglasses lifted, victorious smirk, confetti raining in warm orange tones, black background, no text."*

---

## 5. SOCIAL / LEVEL

### `social.rank_background` · **ALTA**
- **PNG · 1200x500**
- *"Rank card background: pure black canvas with diagonal warm amber-to-orange energy streaks on the right side, faint glowing XP bar pattern, very small chibi Zenox mascot silhouette peeking from the bottom-right corner with sunglasses on and a thumbs up, left side empty for avatar, center empty for username and stats, no text."*

### `social.profile_banner` · **ALTA**
- *"[BLOCO MASCOTE] chibi on the right edge, holding a holographic profile card glowing amber, sunglasses lifted to inspect it, curious confident expression, abstract black-to-orange gradient with sparks, leaves most of the banner empty for profile info, no text."*

### `social.levelup_banner` · **ALTA**
- *"[BLOCO MASCOTE] — full body, fist raised in triumph, mouth open in a victory shout, sunglasses askew, amber and gold light beams exploding behind him on a black background, XP particles, cartoon power-up scene, no text."*

### `social.frame_common` / `social.frame_vip` · **MÉDIA**
- PNG transparente 512x512. Comum = anel preto fosco com glow âmbar sutil. VIP = anel dourado com pequenos óculos escuros entalhados (assinatura do mascote) e brilho âmbar intenso.

### `social.icon_rep` · coração preto com glow âmbar/rosa neon, contorno grosso.
### `social.icon_xp` · cristal âmbar facetado irradiando luz quente.
### `social.icon_achievement` · troféu preto com gema âmbar, mesma família de design.

---

## 6. PREMIUM

### `premium.banner` · **ALTA**
- *"[BLOCO MASCOTE] — character wearing a luxurious black and gold VIP outfit (gold-trimmed hoodie, golden crown floating above his head, gold-rimmed sunglasses), confident smirk, standing in front of a glowing portal of warm golden light and amber diamonds, deep black to gold gradient background, ultra premium cartoon scene, no text."*

### `premium.vip_badge` · **ALTA**
- *"Premium VIP badge: golden crown with miniature stylized black sunglasses at the center (Zenox signature), warm amber gem detailing, intense gold glow, cartoon game premium tier icon, transparent background, no text."*

### `premium.locked_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, sunglasses pulled down, pointing at a glowing golden lock with a smug 'unlock me' face, black background with gold light, no text."*

### `premium.plan_image` · **BAIXA**
- *"Holographic VIP membership card floating, black and gold with amber accents, stylized Z and small sunglasses graphic, cartoon game UI style, no readable text."*

---

## 7. DIVERSÃO / INTERAÇÕES

Para os GIFs, **prefira gerar com IA de vídeo curtos (1–2s, loop)** usando o mascote. Fallback: GIFs Tenor já configurados no código.

| Key | Cena com o mascote |
|-----|--------------------|
| `fun.hug_gif` | Zenox abraçando alguém apertado, óculos torcidos pra fora |
| `fun.kiss_gif` | Zenox mandando beijinho com a mão, piscando, coração âmbar |
| `fun.slap_gif` | Zenox dando um tapa cômico exagerado, estrela de impacto laranja |
| `fun.pat_gif` | Zenox fazendo carinho na cabeça de alguém com expressão doce |
| `fun.bonk_gif` | Zenox com martelo de brinquedo gigante âmbar, "bonk!" cartoon |
| `fun.cuddle_gif` | Zenox enrolado em um cobertor preto, olhos fechados, sorriso fofo |
| `fun.poke_gif` | Zenox cutucando com o dedo, sorriso travesso, sunglasses lifted |

### `fun.ship_image` · *"[BLOCO MASCOTE] chibi, segurando uma fita âmbar com dois corações nas pontas, smirk travesso, espaço vazio dos lados para 2 avatares, fundo preto, no text."*

### `fun.marriage_image` · *"[BLOCO MASCOTE] chibi vestido de padrinho com gravata âmbar, segurando duas alianças douradas em uma almofadinha preta, pétalas laranjas caindo, fundo preto, no text."*

---

## 8. MODERAÇÃO / LOGS

### `moderation.icon_ban` — martelo de juiz vermelho com contorno preto grosso e glow âmbar.
### `moderation.icon_mute` — microfone preto cortado com X vermelho neon.
### `moderation.icon_warn` — triângulo âmbar com exclamação preta, glow quente.
### `moderation.icon_shield` · **ALTA** — escudo preto com pequenos óculos escuros estilizados dentro (assinatura), brilho âmbar.

### `moderation.automod_banner` · **MÉDIA**
- *"[BLOCO MASCOTE] — character in 'guardian mode', wearing a black tactical hoodie, arms crossed, serious focused expression with sunglasses fully on, large translucent amber shield with glowing circuit patterns hovering in front of him, deep red-to-black gradient background, no text."*

### `logs.icon_message_deleted` — balão de fala preto com X âmbar.

---

## 9. DASHBOARD (web)

> Não entram em `bot_assets`. Coloque em `src/assets/`.

- **`dashboard.logo_horizontal`** · SVG/PNG 800x200 — cabeça do mascote à esquerda + wordmark "Zenox" em letras pretas grossas com sublinhado âmbar à direita.
- **`dashboard.logo_compact`** · SVG 96x96 — só a cabeça do mascote (reusar `zenox-mascot.png`).
- **`dashboard.login_background`** · WebP 1920x1080 — *"[BLOCO MASCOTE] em ¾ no canto direito, olhando pro usuário com sunglasses puxados, ambiente preto com aurora âmbar/laranja, partículas, leaves left two-thirds clear for login form."*
- **`dashboard.empty_state`** · SVG/WebP 800x600 — *"[BLOCO MASCOTE] chibi sentado em uma caixa preta vazia, sunglasses puxados, cabeça apoiada na mão, expressão entediada-fofa, fundo preto, no text."*
- **`dashboard.premium_lock`** · *"[BLOCO MASCOTE] chibi segurando uma chave dourada gigante, apontando para um cadeado dourado brilhante, smirk animado, sunglasses on, fundo preto."*
- **`dashboard.error_illustration`** · *"[BLOCO MASCOTE] chibi com cabelo bagunçado, sunglasses tortos, segurando peças de um circuito quebrado, expressão envergonhada, faíscas pequenas, fundo preto, no text."*
- **`dashboard.setup_complete`** · *"[BLOCO MASCOTE] chibi pulando com dois braços para cima, check verde gigante atrás, sunglasses, confetes âmbar, fundo preto, no text."*

---

## 10. EMOJIS CUSTOMIZADOS

PNG 128x128 sem fundo. Sempre que possível, derive da cara do mascote.

| Nome | Estilo |
|------|--------|
| `zenoxok` | Cabecinha do Zenox piscando com polegar pra cima |
| `zenoxno` | Cabecinha do Zenox sacudindo "não", X vermelho ao lado |
| `zenoxwarn` | Cabecinha do Zenox preocupada, triângulo âmbar |
| `zenoxlove` | Cabecinha do Zenox com sunglasses, corações flutuando |
| `zenoxcry` | Cabecinha do Zenox chorando estilo cartoon exagerado |
| `zenoxsmug` | Smirk clássico do Zenox em close, óculos puxados |
| `zenoxcoin` | Moeda Z âmbar (idem `economy.currency_icon`) |
| `zenoxxp` | Cristal âmbar XP |
| `zenoxvip` | Coroa com óculos escuros |
| `zenoxticket` | Bolha de chat com headset |
| `zenoxshop` | Sacola preta com fita âmbar |
| `zenoxrank` | Troféu preto com gema âmbar |

---

## 11. BADGES

PNG transparente 512x512, formato de medalha redonda com anel brilhante. Cada uma sempre com o mesmo arco preto + glow âmbar para parecerem família.

| Key | Estilo |
|-----|--------|
| badge.founder   | Coroa real com óculos escuros entalhados + dourado intenso |
| badge.staff     | Escudo preto com Z âmbar dentro |
| badge.vip       | Diamante âmbar facetado com glow laranja |
| badge.top_level | Cristal verde-XP grande |
| badge.top_economy | Moeda Z âmbar gigante |
| badge.beta_tester | Tubo de ensaio com líquido âmbar brilhante |
| badge.supporter | Coração âmbar com glow |
| badge.bug_hunter | Lupa com bug verde neon |
| badge.event     | Confete âmbar espiralado |
| badge.legendary | Chama âmbar/laranja com Z no centro |

**Prompt base badge:** *"Premium circular medal badge, [tema], thick black metallic rim with intense warm amber-orange glow ring (Zenox brand), gaming achievement style consistent with Zenox mascot art direction (chibi cartoon, painterly), transparent background, ultra detailed, no text."*

---

## Prioridades

**Sprint 1 — virar premium agora:**
`global.logo` (já feito ✅), `global.banner`, `tickets.panel_banner` + 5 `tickets.icon_*`, `economy.currency_icon`, `economy.banner`, `social.rank_background`, `social.levelup_banner`, `premium.vip_badge`, `premium.banner`, `moderation.icon_shield`, `dashboard.logo_horizontal`.

**Sprint 2 — polimento:** ícones e banners restantes, GIFs de interação com o mascote, badges principais.

**Sprint 3 — variações:** emojis, backgrounds extras, ilustrações de empty state.

---

## Como o código usa

```ts
import { ui } from "@/bot/systems/ui/embed.factory.js";
import { getAsset } from "@/bot/systems/ui/embed.assets.js";

const banner = await getAsset(interaction.guildId, "tickets.panel_banner");
await interaction.reply({
  embeds: [ui.ticket({ kind: "panel", guildId: interaction.guildId, image: banner })],
});
```

Se a URL não estiver cadastrada, o embed renderiza sem a imagem — **nada quebra**.
