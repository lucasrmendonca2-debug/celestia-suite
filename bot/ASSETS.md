# Assets Visuais do Zenox — Guia Completo

> **Regra de ouro:** o **mascote Zenox é a marca**. Ele aparece em quase todo asset (banners, ilustrações, splashes). Ícones e badges são objetos isolados, mas seguem a mesma DNA: traço anime moderno, contornos limpos, **paleta azul elétrico + roxo profundo**, glow suave, pele quente, brilho de personagem de gacha/mobile game premium.
>
> A meta é ter algo **mais marcante que a Loritta** — não genérico, não corporativo, não "tech minimalista". Sempre que possível, o mascote olha pro jogador, com uma expressão característica (sorriso confiante de lado, surpresa fofa, foco sério).

---

## Identidade do mascote Zenox

Referência canônica: `src/assets/zenox-mascot.png` (o ícone redondo com o garoto de cabelo azul-meia-noite, olhos azul cristal grandes, headset gamer, hoodie azul/branca, "Z" azul flutuando no cabelo).

**Sempre incluir em qualquer prompt onde ele aparece:**

> *"Zenox mascot: anime boy character, messy dark navy-blue spiky hair with a glowing blue letter Z floating near the side of the head, large expressive crystal-blue eyes with light reflections, soft tan skin, slim modern gaming headset with cyan glow on the earcup, white and electric blue hoodie with subtle tech panels, confident smirk, anime gacha mobile-game art style, clean lineart, vibrant cel-shading with soft rim light, premium polished finish — match the established Zenox character design exactly."*

Cole esse bloco como **primeira frase** de qualquer prompt envolvendo o personagem. Depois descreva a cena/pose/cenário.

---

## Paleta oficial

| Token        | Hex       | Uso                                |
|--------------|-----------|------------------------------------|
| brand        | `#5865F2` | Identidade primária / azul Zenox   |
| brand_glow   | `#8B5CF6` | Acento, gradiente premium          |
| cyan_accent  | `#22D3EE` | Glow do headset, partículas        |
| success      | `#22C55E` | Confirmações                       |
| error        | `#EF4444` | Erros                              |
| warn         | `#F59E0B` | Avisos                             |
| premium      | `#F5C842` | VIP / Dourado                      |
| economy      | `#FBBF24` | Moeda                              |
| tickets      | `#14B8A6` | Atendimento                        |
| moderation   | `#DC2626` | Punições                           |
| fun          | `#EC4899` | Diversão                           |
| social       | `#A855F7` | Perfil/Level                       |
| logs         | `#64748B` | Cinza eventos                      |

Fundo padrão dos banners: gradiente **#0B0F2A → #1E1B4B → #312E81** com partículas/bokeh azul-cyan.

---

## 1. GLOBAL

### `global.logo` — Logo redonda · **ALTA**
- **PNG transparente · 512x512**
- **Prompt:** *"[BLOCO MASCOTE] — close-up shot from chest up, character looking forward with a confident smirk, framed inside a circular glowing blue ring with sparkles, dark navy background inside the circle, app-icon composition, mobile game logo style, ultra polished."*

### `global.banner` — Banner principal · **ALTA**
- **WebP · 1200x400**
- **Prompt:** *"[BLOCO MASCEMTOTE] — full body dynamic pose, arms slightly open, holographic blue UI panels floating around him (chat bubbles, command icons, sparkles), epic anime keyvisual, deep navy-to-purple gradient sky with aurora, cinematic rim light, no text, ultra HD."*

### `global.thumbnail_default` — **MÉDIA**
- **PNG · 512x512** — busto do mascote em ¾, olhando para a câmera, fundo abstrato azul-roxo desfocado.

### `global.footer_icon` — **BAIXA**
- **PNG · 64x64** — só a cabeça do Zenox em chibi, fundo transparente.

---

## 2. WELCOME

### `welcome.banner` · **ALTA**
- **WebP · 1200x400**
- **Prompt:** *"[BLOCO MASCOTE] — character on the right side, waving enthusiastically with a big bright smile, throwing blue and purple confetti and stars, holding a small welcome sign with a heart, warm aurora background, festive but premium anime style, leaves left third empty for text, no text."*

### `welcome.goodbye_banner` · **MÉDIA**
- *"[BLOCO MASCOTE] — character on the right, waving goodbye with a soft melancholic smile, looking back over his shoulder, twilight purple-blue gradient sky with falling petals and gentle light particles, cinematic anime farewell scene, leaves left empty, no text."*

### `welcome.card_background` · **ALTA**
- **PNG · 1200x500**
- *"Background for member welcome card: dark navy gradient with diagonal blue-purple light streaks and soft bokeh, faint silhouette of the Zenox mascot peeking from the right corner watching, leaves left side empty for avatar and right-center empty for text, no text."*

---

## 3. TICKETS

### `tickets.panel_banner` · **ALTA**
- *"[BLOCO MASCOTE] — character sitting at a futuristic holographic support desk wearing his headset, mic close to mouth, focused friendly expression, holographic chat bubbles and ticket icons floating around, teal-to-navy gradient backdrop (#0F172A to #14B8A6), glassmorphism panels, premium anime support-center scene, no text."*

### `tickets.icon_support` · **ALTA**
- **PNG transparente · 256x256** — headset gamer com glow cyan e uma chat bubble flutuando, mesmo estilo do headset do mascote, fundo branco sólido.

### `tickets.icon_purchase` · **ALTA**
- Sacola brilhante azul com fita roxa e moedas Z saindo, estilo gacha mobile game.

### `tickets.icon_report` · **MÉDIA**
- Escudo azul-violeta com exclamação vermelha neon, mesmo traço cel-shaded.

### `tickets.icon_partnership` · **MÉDIA**
- Dois anéis cyan e roxo entrelaçados com brilho, estilo joia anime.

### `tickets.icon_vip` · **ALTA**
- Coroa dourada com gema azul Zenox no centro, glow dourado.

### `tickets.closed_image` · **BAIXA**
- *"[BLOCO MASCOTE] — chibi version giving a thumbs-up with a wink, big green check mark behind him, soft confetti, anime sticker style, no text."*

### `tickets.rating_image` · **BAIXA**
- *"[BLOCO MASCOTE] — chibi version holding 5 golden stars in his hands with sparkles, excited expression, blue-purple background, no text."*

---

## 4. ECONOMIA

### `economy.banner` · **ALTA**
- *"[BLOCO MASCOTE] — character juggling glowing golden Z coins with a mischievous grin, coins flying around him with motion trails, treasure chest open behind spilling more coins, dark navy background with gold particles, premium anime economy scene, no text."*

### `economy.currency_icon` · **ALTA**
- *"Premium glowing coin with letter Z embossed on front, gold-to-amber gradient (#FBBF24 to #F5C842), thick metallic rim with subtle blue inner glow, anime game item icon style, 3/4 angle, sparkles, transparent/white background, no text other than the Z."*

### `economy.daily_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, opening a glowing gift box that explodes with coins and stars, sparkle in his eye, no text."*

### `economy.work_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, wearing a hard hat backwards and holding a holographic wrench, focused happy face, blue blueprints floating, no text."*

### `economy.crime_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, wearing a small black mask over the eyes, sneaky grin, tiptoeing with a coin bag, noir purple-cyan lighting, comedic anime style, no text."*

### `economy.shop_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, behind a futuristic holographic shop counter with floating items (potions, badges, frames), arms open in welcoming gesture, no text."*

### `economy.top_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi standing on a golden 1st-place podium holding a glowing trophy above his head, confetti raining, no text."*

---

## 5. SOCIAL / LEVEL

### `social.rank_background` · **ALTA**
- **PNG · 1200x500**
- *"Rank card background: dark navy gradient with diagonal purple-blue energy streaks on the right side, faint holographic XP bar pattern, very small chibi Zenox mascot silhouette peeking from the bottom-right corner with a thumbs up, left side empty for avatar, center empty for username and stats, no text."*

### `social.profile_banner` · **ALTA**
- *"[BLOCO MASCOTE] chibi version on the right edge holding a clipboard and a magnifying glass, curious friendly expression, abstract purple-blue gradient with stars, leaves most of the banner empty for profile info, no text."*

### `social.levelup_banner` · **ALTA**
- *"[BLOCO MASCOTE] — full body, fist raised triumphantly, screaming a victory shout with eyes closed in a wide smile, golden and purple light beams exploding behind him, XP particles, anime power-up scene, dark background, no text."*

### `social.frame_common` / `social.frame_vip` · **MÉDIA**
- PNG transparente 512x512. Comum = anel prata fosco com sutil glow azul. VIP = anel dourado com gemas azuis Zenox e brilho intenso, no estilo moldura de avatar de gacha game.

### `social.icon_rep` · coração roxo-rosa com glow neon.
### `social.icon_xp` · cristal azul facetado irradiando luz.
### `social.icon_achievement` · troféu dourado com gema azul, mesma família de design.

---

## 6. PREMIUM

### `premium.banner` · **ALTA**
- *"[BLOCO MASCOTE] — character wearing a luxurious royal-blue and gold VIP outfit (cape with gold trim, golden crown floating above his head), confident smirk, standing in front of a glowing portal of golden light and diamonds, deep purple-to-gold gradient background, ultra premium anime scene, no text."*

### `premium.vip_badge` · **ALTA**
- *"Premium VIP badge: golden crown with a central blue Z-shaped gem matching the Zenox brand, ornate metallic detailing, intense gold glow, anime game premium tier icon, transparent background, no text."*

### `premium.locked_image` · **MÉDIA**
- *"[BLOCO MASCOTE] chibi, sitting next to a glowing golden lock with a slightly pouty face, pointing at it like 'unlock me!', purple-gold background, no text."*

### `premium.plan_image` · **BAIXA**
- *"Holographic VIP membership card floating, blue-purple-gold gradient, Zenox Z logo prominent, anime game UI style, no readable text."*

---

## 7. DIVERSÃO / INTERAÇÕES

Para os GIFs, **prefira gerar com IA de vídeo curtos (1–2s, loop)** usando o mascote, em vez de pegar GIFs genéricos de anime. Fallback: Tenor.

| Key | Cena com o mascote |
|-----|--------------------|
| `fun.hug_gif` | Zenox abraçando alguém apertado com sorriso fechado, coraçõezinhos flutuando |
| `fun.kiss_gif` | Zenox dando um beijo no ar com a mão, piscando, coração rosa |
| `fun.slap_gif` | Zenox dando um tapa cômico exagerado, estrela de impacto |
| `fun.pat_gif` | Zenox fazendo carinho na cabeça de alguém com expressão doce |
| `fun.bonk_gif` | Zenox segurando um martelo de brinquedo gigante, "bonk!" |
| `fun.cuddle_gif` | Zenox enrolado em um cobertor azul, fofo, olhos fechados |
| `fun.poke_gif` | Zenox cutucando com o dedo, expressão maliciosa |

### `fun.ship_image` · *"[BLOCO MASCOTE] chibi, segurando uma fita rosa com dois corações nas pontas, sorriso travesso, espaço vazio dos lados para 2 avatares, no text."*

### `fun.marriage_image` · *"[BLOCO MASCOTE] chibi vestido de padrinho com gravata azul, segurando duas alianças douradas em uma almofadinha, pétalas de rosa caindo, no text."*

---

## 8. MODERAÇÃO / LOGS

### `moderation.icon_ban` — martelo de juiz vermelho com glow, mesma família de ícones.
### `moderation.icon_mute` — microfone cortado com X vermelho neon.
### `moderation.icon_warn` — triângulo amarelo com glow âmbar.
### `moderation.icon_shield` · **ALTA** — escudo azul Zenox com Z dentro, brilho cyan.

### `moderation.automod_banner` · **MÉDIA**
- *"[BLOCO MASCOTE] — character in 'guardian mode', wearing a navy-blue tactical jacket, arms crossed, serious focused expression, large translucent blue shield with circuit patterns hovering in front of him, deep red-to-navy gradient background with subtle warning glow, no text."*

### `logs.icon_message_deleted` — balão de fala cinza com X vermelho.

---

## 9. DASHBOARD (web)

> Não entram em `bot_assets`. Coloque em `src/assets/`.

- **`dashboard.logo_horizontal`** · SVG/PNG 800x200 — cabeça do mascote à esquerda + wordmark "Zenox" à direita, em uma única composição.
- **`dashboard.logo_compact`** · SVG 96x96 — só a cabeça do mascote dentro do anel azul.
- **`dashboard.login_background`** · WebP 1920x1080 — *"[BLOCO MASCOTE] em ¾ no canto direito olhando para o usuário com sorriso convidativo, ambiente cyber-aurora azul-roxo, partículas, leaves left two-thirds clear for login form."*
- **`dashboard.empty_state`** · SVG/WebP 800x600 — *"[BLOCO MASCOTE] chibi sentado em uma caixa vazia, cabeça apoiada na mão, expressão entediada-fofa, no text."*
- **`dashboard.premium_lock`** · *"[BLOCO MASCOTE] chibi segurando uma chave dourada gigante, apontando para um cadeado dourado brilhante, expressão animada."*
- **`dashboard.error_illustration`** · *"[BLOCO MASCOTE] chibi com cabelo bagunçado, segurando peças de um circuito quebrado, expressão envergonhada, faíscas pequenas, no text."*
- **`dashboard.setup_complete`** · *"[BLOCO MASCOTE] chibi pulando com os dois braços para cima, check verde gigante atrás, confetes, no text."*

---

## 10. EMOJIS CUSTOMIZADOS

PNG 128x128 sem fundo. Sempre que possível, derive da cara do mascote.

| Nome | Estilo |
|------|--------|
| `zenoxok` | Cabecinha do Zenox piscando com polegar para cima |
| `zenoxno` | Cabecinha do Zenox sacudindo "não" com X vermelho ao lado |
| `zenoxwarn` | Cabecinha do Zenox preocupada, triângulo amarelo |
| `zenoxlove` | Cabecinha do Zenox com olhos de coração |
| `zenoxcry` | Cabecinha do Zenox chorando estilo anime exagerado |
| `zenoxsmug` | Smirk clássico do Zenox em close |
| `zenoxcoin` | Moeda Z dourada (idem `economy.currency_icon`) |
| `zenoxxp` | Cristal azul XP |
| `zenoxvip` | Coroa dourada com Z azul |
| `zenoxticket` | Headset com chat bubble |
| `zenoxshop` | Sacola brilhante |
| `zenoxrank` | Troféu dourado com gema azul |

---

## 11. BADGES

PNG transparente 512x512, formato de medalha redonda com anel brilhante. Cada uma sempre com o mesmo arco metálico + glow para parecerem família.

| Key | Estilo |
|-----|--------|
| badge.founder   | Coroa real com gemas azuis Zenox + dourado intenso |
| badge.staff     | Escudo azul com Z prateado dentro |
| badge.vip       | Diamante azul-cyan facetado com glow roxo |
| badge.top_level | Cristal verde-XP grande |
| badge.top_economy | Moeda Z dourada gigante |
| badge.beta_tester | Tubo de ensaio com líquido azul brilhante |
| badge.supporter | Coração rosa com glow |
| badge.bug_hunter | Lupa com bug verde neon |
| badge.event     | Confete colorido espiralado |
| badge.legendary | Chama arco-íris com Z no centro |

**Prompt base badge:** *"Premium circular medal badge, [tema], shiny metallic rim with intense blue-cyan glow ring (Zenox brand), gaming achievement style consistent with Zenox mascot art direction (anime cel-shaded, vibrant), transparent background, ultra detailed, no text."*

---

## Prioridades

**Sprint 1 — virar premium agora:**
`global.logo`, `global.banner`, `tickets.panel_banner` + 5 `tickets.icon_*`, `economy.currency_icon`, `economy.banner`, `social.rank_background`, `social.levelup_banner`, `premium.vip_badge`, `premium.banner`, `moderation.icon_shield`, `dashboard.logo_horizontal`, `dashboard.logo_compact`.

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
