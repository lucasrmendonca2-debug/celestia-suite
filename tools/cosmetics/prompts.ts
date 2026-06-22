// Catálogo de 150 cosméticos para geração inicial.
// Cada prompt foi escrito visando uma estética coesa para a loja de perfil.

export type Rarity = "common" | "rare" | "epic" | "legendary";
export type CosmeticType = "banner" | "frame" | "sticker";

export interface CosmeticPrompt {
  slug: string;
  name: string;
  description: string;
  rarity: Rarity;
  type: CosmeticType;
  price: number;
  prompt: string;
}

const BANNER_BASE =
  "ultra wide cinematic profile banner, no text, no watermark, no logo, no faces, no human figures, balanced horizontal composition, sharp focus, professional digital art, suitable as a clean background behind avatar and name, aspect ratio 3:1";

const FRAME_BASE =
  "circular avatar frame ornament, transparent center hole for a profile picture, perfectly symmetrical ring, no text, no watermark, decorative border art only, the inner 60% of the image must be empty so an avatar can be placed inside, premium digital craftsmanship";

const STICKER_BASE =
  "single centered icon on plain solid white background, no text, no watermark, no shadows on background, simple flat or semi-flat style, clear silhouette, suitable as a small profile sticker, 1:1 aspect, large object filling 70% of the canvas";

const RARITY_PRICE: Record<Rarity, number> = {
  common: 500,
  rare: 1500,
  epic: 5000,
  legendary: 15000,
};

function mk(
  type: CosmeticType,
  slug: string,
  name: string,
  description: string,
  rarity: Rarity,
  themePrompt: string,
): CosmeticPrompt {
  const base =
    type === "banner" ? BANNER_BASE : type === "frame" ? FRAME_BASE : STICKER_BASE;
  return {
    slug,
    name,
    description,
    rarity,
    type,
    price: RARITY_PRICE[rarity],
    prompt: `${themePrompt}. ${base}`,
  };
}

// =========================================================================
// 50 BANNERS — temas variados, foco em ambientes/abstrações sem texto
// =========================================================================
export const BANNERS: CosmeticPrompt[] = [
  mk("banner", "banner-aurora-boreal", "Aurora Boreal", "Céu noturno com aurora verde e violeta sobre montanhas nevadas", "rare", "northern lights aurora over snowy mountains, deep navy sky, glowing green and purple ribbons, stars"),
  mk("banner", "banner-galaxia-nebula", "Nebulosa Profunda", "Nebulosa cósmica em rosa e azul com estrelas distantes", "epic", "deep space nebula in magenta and cyan, distant galaxies, cosmic dust, hubble photography style"),
  mk("banner", "banner-praia-tropical", "Praia ao Pôr do Sol", "Praia tropical durante o crepúsculo dourado", "common", "tropical beach at golden hour, palm silhouettes, gentle waves, warm orange and pink sky"),
  mk("banner", "banner-cyberpunk-cidade", "Tóquio Neon", "Vista panorâmica de cidade futurista com neon", "epic", "futuristic neon city skyline at night, cyberpunk rain reflections, purple and cyan glow, distant skyscrapers"),
  mk("banner", "banner-floresta-mistica", "Floresta Mística", "Floresta encantada com luz dourada filtrada", "rare", "enchanted forest with sun rays through tall trees, mossy ground, mystical atmosphere, soft bokeh"),
  mk("banner", "banner-deserto-dunas", "Dunas Infinitas", "Dunas do deserto sob céu rosado", "common", "endless desert dunes under soft pink dusk sky, smooth sand ripples, minimal serene composition"),
  mk("banner", "banner-oceano-profundo", "Abismo Azul", "Águas profundas com raios de luz penetrando", "rare", "deep ocean underwater scene, sun rays piercing blue water, particles suspended, cinematic depth"),
  mk("banner", "banner-cherry-blossom", "Sakura", "Galhos de cerejeira em flor sobre céu pastel", "rare", "cherry blossom branches in full bloom, soft pastel pink and cream sky, japanese aesthetic, delicate petals"),
  mk("banner", "banner-castelo-medieval", "Castelo nas Montanhas", "Castelo medieval no topo de penhasco enevoado", "epic", "medieval stone castle on misty cliff, gothic spires, dramatic clouds, fantasy matte painting"),
  mk("banner", "banner-savana-leoa", "Savana Dourada", "Savana africana ao crepúsculo com árvore solitária", "common", "african savanna at sunset, lone acacia tree silhouette, warm golden grass, expansive sky"),
  mk("banner", "banner-gelo-cristal", "Geleira Cristal", "Cavernas de gelo azul translúcido", "rare", "glacial ice cave with translucent blue walls, crystalline reflections, cold light, awe-inspiring scale"),
  mk("banner", "banner-vulcano-lava", "Forja Vulcânica", "Rios de lava descendo encosta vulcânica à noite", "epic", "volcanic landscape at night, flowing lava rivers, glowing red and orange, dark silhouette mountains"),
  mk("banner", "banner-cosmos-galaxia", "Via Láctea", "Faixa da Via Láctea sobre lago calmo", "epic", "milky way galaxy band over calm lake reflection, deep blue night, countless stars, astrophotography"),
  mk("banner", "banner-jardim-japones", "Jardim Zen", "Jardim japonês com lago de carpas e ponte vermelha", "rare", "japanese zen garden, koi pond, red wooden bridge, manicured trees, tranquil minimal composition"),
  mk("banner", "banner-arquitetura-grega", "Templo Helênico", "Colunas de templo grego sob luz dourada", "rare", "ancient greek temple ruins, marble columns, golden hour light, classical architecture wide angle"),
  mk("banner", "banner-floresta-outono", "Outono Vermelho", "Floresta em folhas vermelhas e amarelas de outono", "common", "autumn forest path with red and yellow leaves, soft sunlight, cozy seasonal mood"),
  mk("banner", "banner-cidade-paris", "Telhados de Paris", "Vista dos telhados parisienses ao entardecer", "common", "panoramic view of paris rooftops at dusk, soft purple sky, distant eiffel tower silhouette, painterly"),
  mk("banner", "banner-tempestade-eletrica", "Tempestade Elétrica", "Raios sobre planície escura e dramática", "epic", "dramatic thunderstorm over dark plains, lightning bolts, heavy clouds, cinematic moody atmosphere"),
  mk("banner", "banner-pradaria-flores", "Campo de Lavanda", "Campos de lavanda roxa até o horizonte", "common", "endless lavender fields in bloom, soft purple rows, distant rolling hills, summer light"),
  mk("banner", "banner-espaco-saturno", "Anéis de Saturno", "Saturno em primeiro plano sobre vasto espaço estrelado", "legendary", "saturn planet with detailed rings, deep space backdrop, distant stars, photorealistic astronomical art"),
  mk("banner", "banner-floresta-magica-fada", "Bosque das Fadas", "Bosque mágico com luzes flutuantes e cogumelos", "rare", "magical fairy forest with floating glowing particles, mushrooms, soft teal and gold light, fantasy"),
  mk("banner", "banner-onda-japonesa", "Grande Onda", "Releitura abstrata de onda japonesa estilizada", "rare", "stylized great wave inspired by hokusai, deep blue and white foam, japanese woodblock aesthetic"),
  mk("banner", "banner-snowy-mountain", "Pico Nevado", "Pico de montanha nevada sob céu límpido", "common", "snowy mountain peak under clear cold blue sky, sharp ridges, alpine wilderness, minimal"),
  mk("banner", "banner-deserto-mars", "Superfície Marciana", "Paisagem alienígena vermelha de Marte", "epic", "martian red desert landscape, alien rocks, dusty horizon, sci-fi photorealism"),
  mk("banner", "banner-arco-iris-tempestade", "Arco-Íris pós Tempestade", "Arco-íris duplo sobre vale verde", "common", "double rainbow over green valley after storm, dramatic clouds parting, hopeful atmosphere"),
  mk("banner", "banner-dragao-oriental", "Dragão Oriental", "Dragão chinês estilizado entre nuvens douradas", "legendary", "majestic oriental chinese dragon flying among golden clouds, ornate detail, traditional asian art"),
  mk("banner", "banner-bibliotech-arcana", "Biblioteca Arcana", "Biblioteca antiga com livros flutuantes e luz mágica", "epic", "ancient library with floating books, warm magical light beams, dust particles, fantasy interior"),
  mk("banner", "banner-portal-dimensional", "Portal Dimensional", "Portal energético entre realidades", "legendary", "swirling dimensional portal of cyan and violet energy, lightning arcs, cosmic vortex"),
  mk("banner", "banner-deepsea-bioluminescence", "Bioluminescência", "Vida marinha bioluminescente em água escura", "rare", "deep sea bioluminescent jellyfish and plankton, glowing blue creatures in dark water, ethereal"),
  mk("banner", "banner-cidade-veneza", "Canais de Veneza", "Canais venezianos ao amanhecer rosado", "common", "venice canals at soft pink dawn, gondolas, historic facades, peaceful reflection on water"),
  mk("banner", "banner-castelo-no-ceu", "Castelo nas Nuvens", "Castelo flutuante entre nuvens douradas", "legendary", "floating castle in golden cloud sea, fantasy studio ghibli inspired, soft dreamlike atmosphere"),
  mk("banner", "banner-flores-cerejeira-noite", "Hanami Noturno", "Cerejeiras iluminadas por lanternas à noite", "rare", "night hanami cherry blossoms lit by paper lanterns, deep blue sky, glowing soft pink petals"),
  mk("banner", "banner-tundra-aurora", "Tundra Polar", "Tundra polar com aurora roxa baixa no horizonte", "rare", "polar tundra landscape with low purple aurora, frozen lake, isolated and cinematic"),
  mk("banner", "banner-coliseu-romano", "Coliseu", "Coliseu romano ao crepúsculo dourado", "rare", "roman colosseum at golden dusk, historic atmosphere, warm stone, cinematic wide composition"),
  mk("banner", "banner-meadow-summer", "Pradaria de Verão", "Campo verde com flores silvestres e céu claro", "common", "summer meadow with wildflowers, bright blue sky, gentle breeze, cheerful pastoral"),
  mk("banner", "banner-piramides-egipto", "Pirâmides ao Crepúsculo", "Pirâmides do Egito ao pôr do sol", "rare", "egyptian pyramids at sunset, warm desert sand, long shadows, ancient majesty"),
  mk("banner", "banner-river-amazonia", "Rio Amazonas", "Vista aérea do rio Amazonas serpenteando na floresta", "common", "aerial view of amazon river snaking through dense green rainforest, lush and humid"),
  mk("banner", "banner-iceberg-arctic", "Icebergs Árticos", "Icebergs azuis flutuando em mar gelado", "rare", "arctic icebergs floating in calm steel-blue sea, atmospheric mist, cold serene beauty"),
  mk("banner", "banner-galactic-battle", "Batalha Espacial", "Naves espaciais distantes em batalha entre nebulosas", "epic", "distant space battle with small ship silhouettes between purple nebulae, sci-fi epic"),
  mk("banner", "banner-fenix-fogo", "Fênix Renascente", "Fênix flamejante voando contra céu escuro", "legendary", "majestic flaming phoenix soaring against dark sky, golden and red fire feathers, mythological"),
  mk("banner", "banner-cidade-rio", "Rio de Janeiro", "Vista do Cristo Redentor sobre baía", "common", "rio de janeiro panorama, christ statue silhouette, mountains and bay, tropical golden hour"),
  mk("banner", "banner-bambuzal", "Bambuzal Verde", "Floresta de bambu alta com luz filtrada", "common", "tall green bamboo forest, soft sunlight filtering through, peaceful asian aesthetic"),
  mk("banner", "banner-aurora-antartica", "Sul Polar", "Aurora austral sobre paisagem antártica", "epic", "southern aurora over antarctic landscape, green and pink ribbons in dark sky, icy foreground"),
  mk("banner", "banner-vulcao-ilha", "Ilha Vulcânica", "Ilha vulcânica vista do mar ao entardecer", "rare", "volcanic island seen from calm sea at dusk, smoking peak, warm orange clouds"),
  mk("banner", "banner-cosmic-spiral", "Espiral Cósmica", "Galáxia espiral vista de cima", "epic", "top-down view of spiral galaxy, glowing core, star clusters in arms, deep space art"),
  mk("banner", "banner-castelo-aquatico", "Atlântida", "Ruínas submersas com luz filtrada", "epic", "underwater ruins of atlantis, sun rays through water, ancient columns, marine life around"),
  mk("banner", "banner-trem-vapor", "Trem nas Montanhas", "Trem a vapor cruzando vale com viaduto", "common", "steam train crossing stone viaduct in green mountain valley, nostalgic warm light"),
  mk("banner", "banner-paisagem-mars-blue", "Planeta Alienígena", "Paisagem extraterrestre com céu turquesa e duas luas", "legendary", "alien planet landscape with turquoise sky, two moons, exotic rock formations, sci-fi concept art"),
  mk("banner", "banner-cidade-medieval", "Vila Medieval", "Vila medieval com telhados de madeira ao amanhecer", "common", "medieval fantasy village with thatched roofs at dawn, cozy chimneys, soft mist between buildings"),
  mk("banner", "banner-tempo-quantico", "Fluxo Quântico", "Linhas de energia abstratas em movimento", "epic", "abstract flowing quantum energy lines in violet and gold, dynamic light streaks, futuristic"),
];

// =========================================================================
// 50 FRAMES — bordas circulares ornamentadas, centro vazio (transparente)
// =========================================================================
export const FRAMES: CosmeticPrompt[] = [
  mk("frame", "frame-ouro-classico", "Ouro Clássico", "Anel ornamentado em ouro brilhante", "rare", "ornate gold circular frame with classical engravings, polished metallic shine, dark background"),
  mk("frame", "frame-prata-elegante", "Prata Elegante", "Aro de prata polida com filigrana fina", "common", "elegant polished silver circular frame with thin filigree, minimal classic, dark backdrop"),
  mk("frame", "frame-bronze-rustico", "Bronze Rústico", "Borda em bronze envelhecido", "common", "rustic aged bronze circular frame, weathered patina, simple solid ring"),
  mk("frame", "frame-cristal-azul", "Cristal Azul", "Aro de cristal azul translúcido brilhante", "rare", "translucent blue crystal circular frame, glowing facets, magical jewel ring"),
  mk("frame", "frame-fogo-flamas", "Anel Flamejante", "Aro feito de chamas vivas vermelhas", "epic", "circular frame made entirely of live red and orange flames, fiery glow, dark background"),
  mk("frame", "frame-gelo-cristal", "Anel de Gelo", "Aro de gelo cristalino com geada", "rare", "frosty crystal ice circular frame, sharp icy edges, pale blue glow"),
  mk("frame", "frame-floral-rosas", "Coroa de Rosas", "Coroa circular de rosas vermelhas em plena flor", "rare", "circular wreath frame of blooming red roses with green leaves, romantic, dark background"),
  mk("frame", "frame-floral-girassois", "Coroa de Girassóis", "Coroa de girassóis amarelos vibrantes", "common", "circular wreath of vibrant yellow sunflowers, cheerful, clean dark backdrop"),
  mk("frame", "frame-galaxia", "Anel Cósmico", "Aro com estrelas e nebulosa girando", "epic", "circular cosmic frame with stars and swirling nebula colors, deep space aesthetic"),
  mk("frame", "frame-neon-cyan", "Neon Ciano", "Aro de neon ciano brilhante minimalista", "common", "glowing cyan neon circular ring, minimalist, dark background, sci-fi"),
  mk("frame", "frame-neon-pink", "Neon Magenta", "Aro de neon magenta vibrante", "common", "glowing magenta neon circular ring, minimalist, cyberpunk vibe, dark background"),
  mk("frame", "frame-dragao-asiatico", "Dragão Oriental", "Dois dragões orientais entrelaçados em círculo", "legendary", "two oriental dragons coiled in a perfect circle forming a frame, gold and red, traditional asian art"),
  mk("frame", "frame-folhas-louro", "Louros da Vitória", "Coroa de louros dourada", "rare", "golden laurel wreath circular frame, victory crown, classical roman style"),
  mk("frame", "frame-espinhos-negros", "Espinhos Negros", "Aro de espinhos pretos entrelaçados", "rare", "circular frame of intertwined black thorns, gothic dark aesthetic"),
  mk("frame", "frame-arcoiris-pastel", "Arco-Íris Pastel", "Aro com gradiente arco-íris suave", "common", "soft pastel rainbow gradient circular ring, cute kawaii aesthetic, dark background"),
  mk("frame", "frame-pixel-art", "Pixel 8-bit", "Aro estilo pixel art retrô", "common", "8-bit pixel art circular frame, retro video game style, bold square edges, dark background"),
  mk("frame", "frame-runas-magicas", "Runas Arcanas", "Aro com runas mágicas brilhantes em violeta", "epic", "circular frame with glowing violet magical runes carved in stone, arcane mystical"),
  mk("frame", "frame-eletricidade", "Raios Elétricos", "Aro feito de raios elétricos azuis", "epic", "circular frame made of electric blue lightning bolts arcing around, energetic, dark background"),
  mk("frame", "frame-coracoes-rosa", "Corações Rosa", "Aro de pequenos corações rosa entrelaçados", "common", "circular frame of small pink hearts interlinked, cute romantic, dark background"),
  mk("frame", "frame-borboletas", "Borboletas", "Anel de borboletas coloridas em voo", "rare", "circular frame of colorful butterflies in flight forming a ring, whimsical, dark backdrop"),
  mk("frame", "frame-penas-anjo", "Asas de Anjo", "Aro feito de penas brancas de anjo", "epic", "circular frame of white angel feathers in a ring, ethereal divine glow, dark background"),
  mk("frame", "frame-penas-corvo", "Penas de Corvo", "Aro feito de penas negras", "rare", "circular frame of black raven feathers in a ring, gothic mysterious"),
  mk("frame", "frame-mecanico-engrenagens", "Engrenagens Steampunk", "Aro com engrenagens douradas entrelaçadas", "rare", "circular steampunk frame of interlocking brass gears and cogs, vintage mechanical"),
  mk("frame", "frame-circuito-tech", "Circuito Tech", "Aro de placa de circuito brilhante", "rare", "circular frame of glowing green circuit board lines, futuristic tech aesthetic"),
  mk("frame", "frame-aquarela-azul", "Aquarela Azul", "Aro pintado em aquarela azul fluida", "common", "circular frame painted in fluid blue watercolor brush strokes, artistic, dark background"),
  mk("frame", "frame-veias-galaxia", "Veias Cósmicas", "Aro com linhas roxas e brilhantes como veias", "epic", "circular frame with glowing purple cosmic vein-like lines, magical energy, dark background"),
  mk("frame", "frame-cristal-quartzo", "Quartzo Rosa", "Aro composto de cristais de quartzo rosa", "rare", "circular frame made of pink rose quartz crystal clusters, gem aesthetic"),
  mk("frame", "frame-cobra-serpente", "Serpente Ouroboros", "Serpente dourada mordendo a própria cauda", "legendary", "golden serpent ouroboros biting its own tail forming a perfect circle, mythological, dark background"),
  mk("frame", "frame-coroa-real", "Coroa Real", "Aro decorado como coroa real com joias", "epic", "circular frame styled as a royal crown with jewels and gold, regal majestic"),
  mk("frame", "frame-natural-musgo", "Aro Musgo", "Aro de pedra coberto de musgo verde", "common", "circular stone ring covered in green moss and tiny ferns, natural earthy"),
  mk("frame", "frame-coracao-fogo", "Fogo do Coração", "Aro flamejante em formato de corações", "rare", "circular frame of flaming hearts arranged in a ring, passionate red orange glow"),
  mk("frame", "frame-cosmico-nebula", "Nebulosa Anel", "Aro com nuvem nebular roxa e rosa", "epic", "circular frame of swirling purple and pink nebula cloud, cosmic dreamy"),
  mk("frame", "frame-onda-oceano", "Onda Oceânica", "Aro feito de ondas azuis em movimento", "common", "circular frame of stylized blue ocean waves curling around, fresh aquatic"),
  mk("frame", "frame-relampago-gold", "Raios Dourados", "Aro de raios elétricos dourados", "rare", "circular frame of golden lightning bolts arcing around, regal energy"),
  mk("frame", "frame-cabelo-anjo", "Auréola Divina", "Aro brilhante dourado como auréola sagrada", "epic", "circular glowing golden halo frame, divine sacred light, soft holy glow"),
  mk("frame", "frame-flores-cerejeira", "Pétalas Sakura", "Aro de pétalas de cerejeira caindo", "rare", "circular frame of falling cherry blossom petals forming a ring, japanese poetic"),
  mk("frame", "frame-mosaico-bizantino", "Mosaico Bizantino", "Aro decorado como mosaico dourado bizantino", "rare", "circular frame decorated as ornate byzantine gold mosaic tiles, historical religious art"),
  mk("frame", "frame-vidro-vitral", "Vitral Catedral", "Aro estilo vitral colorido de catedral", "epic", "circular cathedral stained glass window frame, vibrant colored panels, gothic"),
  mk("frame", "frame-mariposa-noturna", "Mariposas Noturnas", "Aro de mariposas roxas em voo", "rare", "circular frame of purple night moths in flight, mystical gothic, dark background"),
  mk("frame", "frame-gemas-multicolor", "Gemas Multicor", "Aro cravejado de gemas coloridas variadas", "epic", "circular frame studded with multicolored gemstones, jeweled luxurious"),
  mk("frame", "frame-cordas-trancadas", "Corda Trançada", "Aro de cordas grossas trançadas dourado", "common", "circular braided gold rope frame, nautical elegant"),
  mk("frame", "frame-folhas-outono", "Folhas de Outono", "Aro de folhas vermelhas e amarelas de outono", "common", "circular frame of autumn red and yellow leaves arranged in a ring, seasonal cozy"),
  mk("frame", "frame-coroa-natal", "Coroa Natalina", "Aro de pinheiro com bagas vermelhas", "rare", "circular christmas wreath of pine branches with red holly berries, festive"),
  mk("frame", "frame-rabiscos-doodle", "Rabiscos Doodle", "Aro composto de rabiscos coloridos divertidos", "common", "circular frame of fun colorful hand-drawn doodles, playful kid style"),
  mk("frame", "frame-vinho-uvas", "Vinhas Frutadas", "Aro de vinhas com uvas roxas", "rare", "circular frame of grape vines with purple grape clusters and green leaves, lush"),
  mk("frame", "frame-correntes-prata", "Correntes de Prata", "Aro de correntes de prata entrelaçadas", "rare", "circular frame of intertwined silver chains, gothic punk aesthetic"),
  mk("frame", "frame-tribais-maori", "Tatuagem Maori", "Aro com padrões tribais maoris pretos", "rare", "circular frame with black maori tribal patterns, bold geometric tattoo style"),
  mk("frame", "frame-ondas-arabesco", "Arabescos Dourados", "Aro com arabescos dourados ornamentados", "epic", "circular frame with intricate golden arabesque patterns, middle eastern ornamental"),
  mk("frame", "frame-galactico-prisma", "Prisma Cristalino", "Aro com prismas cristalinos refratando luz", "legendary", "circular frame of crystalline prisms refracting rainbow light, dazzling magical"),
  mk("frame", "frame-supremo-divino", "Coroa Divina", "Aro lendário com raios de luz divinos e ouro", "legendary", "legendary circular frame of golden divine light rays radiating outward with ornate gold, supreme heavenly"),
];

// =========================================================================
// 50 STICKERS — ícones únicos centrados, fundo neutro
// =========================================================================
export const STICKERS: CosmeticPrompt[] = [
  mk("sticker", "sticker-coracao-vermelho", "Coração Vermelho", "Coração vermelho clássico", "common", "single classic glossy red heart icon"),
  mk("sticker", "sticker-estrela-dourada", "Estrela Dourada", "Estrela dourada brilhante de 5 pontas", "common", "single shiny golden five-pointed star icon"),
  mk("sticker", "sticker-fogo", "Chama", "Pequena chama estilizada laranja", "common", "single stylized orange flame icon, simple cartoon style"),
  mk("sticker", "sticker-coroa", "Coroa Real", "Coroa dourada com gemas", "rare", "single golden royal crown with red gem icon"),
  mk("sticker", "sticker-trofeu", "Troféu de Ouro", "Troféu dourado clássico", "rare", "single golden trophy cup icon"),
  mk("sticker", "sticker-medalha", "Medalha de Ouro", "Medalha de ouro com fita azul", "rare", "single gold medal with blue ribbon icon"),
  mk("sticker", "sticker-raio", "Raio", "Raio amarelo elétrico", "common", "single yellow lightning bolt icon"),
  mk("sticker", "sticker-diamante", "Diamante Azul", "Diamante azul brilhante", "rare", "single brilliant blue diamond gem icon, sparkling"),
  mk("sticker", "sticker-skull", "Caveira", "Caveira branca minimalista", "common", "single minimalist white skull icon"),
  mk("sticker", "sticker-fantasma", "Fantasminha", "Fantasma branco fofo", "common", "single cute white ghost icon, big eyes, cartoon style"),
  mk("sticker", "sticker-alien", "Alien Verde", "Alien verde fofo", "common", "single cute green alien face icon, cartoon"),
  mk("sticker", "sticker-foguete", "Foguete", "Foguete espacial vermelho e branco", "common", "single red and white cartoon rocket icon launching"),
  mk("sticker", "sticker-arco-iris", "Arco-Íris", "Arco-íris colorido", "common", "single colorful rainbow arc icon, cute style"),
  mk("sticker", "sticker-nuvem-chuva", "Nuvem de Chuva", "Nuvem cinza com gotas de chuva", "common", "single gray rain cloud icon with falling raindrops, cartoon"),
  mk("sticker", "sticker-sol", "Sol Sorridente", "Sol amarelo com rosto sorridente", "common", "single smiling yellow sun icon with face, cartoon"),
  mk("sticker", "sticker-lua-crescente", "Lua Crescente", "Lua crescente com rosto sereno", "common", "single crescent moon icon with calm sleeping face, soft style"),
  mk("sticker", "sticker-cafe", "Xícara de Café", "Xícara de café fumegante", "common", "single coffee cup icon with steam rising, cozy cartoon"),
  mk("sticker", "sticker-pizza", "Fatia de Pizza", "Fatia de pizza apetitosa", "common", "single slice of pepperoni pizza icon, appetizing cartoon"),
  mk("sticker", "sticker-hamburguer", "Hambúrguer", "Hambúrguer suculento", "common", "single juicy classic cheeseburger icon, cartoon"),
  mk("sticker", "sticker-cupcake", "Cupcake", "Cupcake rosa com confeitos", "common", "single pink frosted cupcake icon with sprinkles, cute"),
  mk("sticker", "sticker-controle-game", "Controle de Jogo", "Joystick estilo retrô", "rare", "single retro game controller icon, black and gray, gaming aesthetic"),
  mk("sticker", "sticker-pokemon-style-ball", "Esfera Captura", "Esfera vermelha e branca de captura", "rare", "single red and white capture sphere icon, monster-catching style, generic"),
  mk("sticker", "sticker-espada", "Espada Mágica", "Espada de cabo dourado e lâmina prateada", "rare", "single magic sword icon with golden hilt and silver blade, fantasy"),
  mk("sticker", "sticker-escudo", "Escudo Heroico", "Escudo azul com estrela dourada", "rare", "single hero shield icon, blue with golden star, fantasy"),
  mk("sticker", "sticker-mochila-aventura", "Mochila", "Mochila marrom de aventura", "common", "single brown adventure backpack icon, cartoon"),
  mk("sticker", "sticker-bussola", "Bússola", "Bússola dourada estilizada", "rare", "single golden compass icon, vintage explorer style"),
  mk("sticker", "sticker-balao-conversa", "Balão de Fala", "Balão de fala branco com '!'", "common", "single white speech bubble icon with an exclamation mark inside, simple"),
  mk("sticker", "sticker-balao-coracao", "Balão Coração", "Balão de fala em formato de coração", "common", "single white heart-shaped speech bubble icon, romantic"),
  mk("sticker", "sticker-balao-pensamento", "Pensamento", "Balão de pensamento com nuvenzinha", "common", "single thought bubble cloud icon, cartoon"),
  mk("sticker", "sticker-presente", "Caixa de Presente", "Presente vermelho com laço dourado", "common", "single red gift box icon with golden ribbon and bow, festive"),
  mk("sticker", "sticker-flor-margarida", "Margarida", "Margarida branca de pétalas brancas", "common", "single white daisy flower icon, simple flat style"),
  mk("sticker", "sticker-flor-tulipa", "Tulipa Rosa", "Tulipa rosa estilizada", "common", "single stylized pink tulip flower icon"),
  mk("sticker", "sticker-pata-cao", "Pata de Cachorro", "Patinha fofa marrom", "common", "single brown cute dog paw print icon, simple"),
  mk("sticker", "sticker-pata-gato", "Patinha de Gato", "Patinha rosada de gato", "common", "single pink cat paw print icon, kawaii style"),
  mk("sticker", "sticker-cabeca-gato", "Cabeça de Gato", "Cabeça de gatinho preto fofo", "common", "single cute black cat head icon, simple kawaii, green eyes"),
  mk("sticker", "sticker-cabeca-cachorro", "Cabeça de Cão", "Cabeça de cachorro fofo bege", "common", "single cute beige puppy dog head icon, simple cartoon"),
  mk("sticker", "sticker-cabeca-dragao", "Cabeça de Dragão", "Cabeça de dragão verde", "epic", "single green dragon head icon, fierce but stylized, fantasy"),
  mk("sticker", "sticker-cabeca-fenix", "Cabeça de Fênix", "Cabeça de fênix flamejante", "epic", "single fiery red phoenix head icon, flames around, mythological"),
  mk("sticker", "sticker-anjo-asas", "Asas de Anjo", "Par de asas brancas estilizadas", "rare", "single pair of white angel wings icon spread out, ethereal"),
  mk("sticker", "sticker-demonio-asas", "Asas Sombrias", "Par de asas pretas demoníacas", "rare", "single pair of dark demon wings icon spread out, gothic"),
  mk("sticker", "sticker-trevo-quatro", "Trevo Quatro Folhas", "Trevo verde de quatro folhas", "rare", "single green four leaf clover icon, lucky"),
  mk("sticker", "sticker-cha-chinese", "Bule de Chá", "Bule de chá estilo oriental", "common", "single oriental teapot icon with steam, asian aesthetic"),
  mk("sticker", "sticker-livro-magico", "Livro Mágico", "Livro com brilho mágico saindo", "rare", "single magical book icon with glowing aura emerging from open pages, fantasy"),
  mk("sticker", "sticker-bola-cristal", "Bola de Cristal", "Bola de cristal violeta com base", "rare", "single violet crystal ball icon on golden stand, mystical fortune teller"),
  mk("sticker", "sticker-vasinho-cacto", "Vaso de Cacto", "Cacto pequeno em vaso", "common", "single small potted cactus icon, cute desk plant"),
  mk("sticker", "sticker-emoji-fogo-coracao", "Coração em Chamas", "Coração com chamas", "rare", "single red heart icon engulfed in orange flames, passionate"),
  mk("sticker", "sticker-emoji-piscando", "Olho Piscando", "Olho fofo piscando", "common", "single cute winking eye icon, cartoon kawaii"),
  mk("sticker", "sticker-cabeca-robo", "Robô", "Cabeça de robô retrô", "rare", "single retro robot head icon, blocky friendly design"),
  mk("sticker", "sticker-microfone", "Microfone", "Microfone vintage prateado", "common", "single vintage silver microphone icon, music"),
  mk("sticker", "sticker-legendary-dragao-supremo", "Dragão Lendário", "Dragão lendário dourado em close", "legendary", "single legendary golden dragon head icon, intricate scales, epic mythological, premium quality"),
];

export const ALL_PROMPTS: CosmeticPrompt[] = [...BANNERS, ...FRAMES, ...STICKERS];
