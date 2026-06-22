import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listShopCosmetics, getTodayRotation } from "@/lib/cosmetics/shop.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag, Sparkles, Flame } from "lucide-react";

const shopOptions = queryOptions({
  queryKey: ["cosmetic-shop"],
  queryFn: () => listShopCosmetics(),
});

const rotationOptions = queryOptions({
  queryKey: ["cosmetic-rotation"],
  queryFn: () => getTodayRotation(),
});

const TYPES = [
  { id: "banner", label: "Banners" },
  { id: "frame", label: "Molduras" },
  { id: "sticker", label: "Stickers" },
  { id: "effect", label: "Efeitos" },
] as const;

const RARITY_STYLES: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  rare: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  epic: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  legendary: "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_20px_-5px_hsl(45_100%_60%/0.4)]",
  seasonal: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  seasonal: "Sazonal",
};

function priceLabel(price: number, isOffer: boolean) {
  if (price <= 0) return "Grátis";
  if (!isOffer) return `🪙 ${price.toLocaleString("pt-BR")}`;
  const discounted = Math.floor(price * 0.8);
  return (
    <span>
      <span className="line-through opacity-50 mr-1">🪙 {price.toLocaleString("pt-BR")}</span>
      <span className="text-amber-400 font-semibold">🪙 {discounted.toLocaleString("pt-BR")}</span>
    </span>
  );
}

function LojaPage() {
  const { data: items } = useSuspenseQuery(shopOptions);
  const { data: rotation } = useSuspenseQuery(rotationOptions);

  const featured = items.filter((i) => i.is_on_offer || i.is_rare_pick);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="size-7 text-primary" />
          Loja de Perfil
        </h1>
        <p className="text-muted-foreground mt-1">
          Compre banners, molduras, stickers e efeitos pra personalizar seu cartão de perfil. A vitrine rotaciona todo dia.
        </p>
      </header>

      {featured.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="size-5 text-amber-400" />
            <h2 className="text-xl font-semibold">Em destaque hoje</h2>
            {rotation && (
              <Badge variant="outline" className="ml-2">
                rotação {rotation.rotation_date}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((item) => (
              <CosmeticCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <Tabs defaultValue="banner" className="w-full">
        <TabsList>
          {TYPES.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TYPES.map((t) => {
          const list = items.filter((i) => i.type === t.id);
          return (
            <TabsContent key={t.id} value={t.id} className="mt-6">
              {list.length === 0 ? (
                <p className="text-muted-foreground py-12 text-center">
                  Nenhum {t.label.toLowerCase()} disponível no momento.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {list.map((item) => (
                    <CosmeticCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function CosmeticCard({ item }: { item: any }) {
  return (
    <Card className="overflow-hidden group hover:border-primary/40 transition-colors">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {item.image_url ? (
          <img
            src={item.preview_url ?? item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            sem preview
          </div>
        )}
        {item.is_rare_pick && (
          <Badge className="absolute top-2 right-2 bg-amber-500 text-amber-950">🔥 Raro do dia</Badge>
        )}
        {item.is_on_offer && !item.is_rare_pick && (
          <Badge className="absolute top-2 right-2 bg-pink-500">−20%</Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="truncate">{item.name}</span>
          <Badge variant="outline" className={RARITY_STYLES[item.rarity]}>
            {RARITY_LABEL[item.rarity] ?? item.rarity}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold flex items-center gap-1">
            <Tag className="size-3.5" />
            {priceLabel(item.price_coins, !!item.is_on_offer)}
          </span>
          <code className="text-xs text-muted-foreground">{item.slug}</code>
        </div>
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute("/loja")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(shopOptions),
      context.queryClient.ensureQueryData(rotationOptions),
    ]),
  head: () => ({
    meta: [
      { title: "Loja de Perfil — Zenox" },
      { name: "description", content: "Banners, molduras, stickers e efeitos pra personalizar seu perfil no Zenox." },
    ],
  }),
  component: LojaPage,
});
