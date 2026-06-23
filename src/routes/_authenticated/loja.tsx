import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getShopCatalog,
  purchaseProfileCosmetic,
  type ShopItemDTO,
  type WalletDTO,
} from "@/lib/profile/profile.functions";
import { toggleFavorite } from "@/lib/profile/favorites.functions";
import { celebrateBurst, celebrateLegendary } from "@/lib/animations/confetti";
import { EmptyMascot } from "@/components/profile/EmptyMascot";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Shirt,
  Palette,
  Sticker,
  Wand2,
  Coins,
  Check,
  Search,
  User as UserIcon,
  Loader2,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const shopOptions = queryOptions({
  queryKey: ["shop-catalog"],
  queryFn: () => getShopCatalog(),
});

const RARITY_STYLES: Record<string, string> = {
  common: "bg-muted text-muted-foreground border-transparent",
  rare: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  epic: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  legendary:
    "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_20px_-5px_hsl(45_100%_60%/0.4)]",
  seasonal: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  seasonal: "Sazonal",
};

const RARITY_RING: Record<string, string> = {
  common: "ring-border/40",
  rare: "ring-blue-500/40",
  epic: "ring-purple-500/40",
  legendary: "ring-amber-400/60",
  seasonal: "ring-pink-500/40",
};

const TYPE_TABS = [
  { id: "all", label: "Tudo", icon: Sparkles },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "daily", label: "Ofertas do Dia", icon: Sparkles },
  { id: "seasonal", label: "Temporada", icon: Sparkles },
  { id: "banner", label: "Banners", icon: Shirt },
  { id: "frame", label: "Molduras", icon: Palette },
  { id: "sticker", label: "Stickers", icon: Sticker },
  { id: "effect", label: "Efeitos", icon: Wand2 },
] as const;

const PAGE_SIZE = 24;


const RARITY_ORDER = ["legendary", "epic", "rare", "common", "seasonal"];

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function ItemCard({
  item,
  owned,
  favorited,
  onBuy,
  onFavorite,
}: {
  item: ShopItemDTO;
  owned: boolean;
  favorited: boolean;
  onBuy: () => void;
  onFavorite: () => void;
}) {
  const isLegendary = item.rarity === "legendary";
  return (
    <Card
      className={`group overflow-hidden ring-1 ${RARITY_RING[item.rarity]} transition-all hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div
        className={`relative ${item.type === "banner" ? "aspect-[3/1]" : "aspect-square"} w-full overflow-hidden bg-muted`}
      >
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className={`h-full w-full ${item.type === "frame" || item.type === "sticker" ? "object-contain p-2" : "object-cover"} transition-transform duration-500 group-hover:scale-105 ${isLegendary ? "drop-shadow-[0_0_18px_hsl(45_100%_60%/0.45)]" : ""}`}
          />
        )}
        {isLegendary && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        )}
        <Badge
          variant="outline"
          className={`absolute left-2 top-2 ${RARITY_STYLES[item.rarity]}`}
        >
          {RARITY_LABEL[item.rarity] ?? item.rarity}
        </Badge>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }}
          aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className={`absolute right-2 ${owned ? "top-10" : "top-2"} flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur transition-all hover:scale-110 hover:bg-black/60 ${favorited ? "text-pink-400" : "text-white/80"}`}
        >
          <Heart
            className={`h-4 w-4 transition-all ${favorited ? "fill-current animate-scale-in" : ""}`}
          />
        </button>
        {owned && (
          <Badge className="absolute right-2 top-2 bg-emerald-500/90 text-white border-transparent">
            <Check className="mr-1 h-3 w-3" /> Tem
          </Badge>
        )}
      </div>
      <CardContent className="space-y-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.name}</p>
          {item.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-sm font-semibold">
            <Coins className="h-4 w-4 text-amber-400" />
            {fmt(item.price_coins)}
          </div>
          <Button
            size="sm"
            variant={owned ? "secondary" : "default"}
            disabled={owned}
            onClick={onBuy}
          >
            {owned ? "Adquirido" : "Comprar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LojaPage() {
  const qc = useQueryClient();
  const { data: catalog } = useSuspenseQuery(shopOptions);
  const purchaseFn = useServerFn(purchaseProfileCosmetic);
  const favoriteFn = useServerFn(toggleFavorite);

  const [tab, setTab] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showOwned, setShowOwned] = useState<"all" | "missing">("all");
  const [page, setPage] = useState(1);
  const [buyTarget, setBuyTarget] = useState<ShopItemDTO | null>(null);
  const [buying, setBuying] = useState(false);
  const [favSet, setFavSet] = useState<Set<string>>(() => new Set(catalog.favoriteIds));


  // Sincroniza favoritos quando o catálogo for refetchado
  useEffect(() => {
    setFavSet(new Set(catalog.favoriteIds));
  }, [catalog.favoriteIds]);

  // Reset paginação quando filtros mudarem
  useEffect(() => {
    setPage(1);
  }, [tab, rarityFilter, query, showOwned]);

  const ownedSet = useMemo(() => new Set(catalog.ownedIds), [catalog.ownedIds]);

  const dailySet = useMemo(
    () => new Set([...catalog.dailyOfferIds, ...catalog.rarePickIds]),
    [catalog.dailyOfferIds, catalog.rarePickIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.cosmetics
      .filter((c) => {
        if (tab === "all") return true;
        if (tab === "favorites") return favSet.has(c.id);
        if (tab === "daily") return dailySet.has(c.id);
        if (tab === "seasonal") return c.rarity === "seasonal" || c.collection !== null;
        return c.type === tab;
      })
      .filter((c) => (rarityFilter === "all" ? true : c.rarity === rarityFilter))
      .filter((c) =>
        showOwned === "missing" ? !ownedSet.has(c.id) : true,
      )
      .filter((c) => {
        if (q.length === 0) return true;
        const rarityLabel = (RARITY_LABEL[c.rarity] ?? c.rarity).toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          rarityLabel.includes(q)
        );
      })
      .sort(
        (a, b) =>
          RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
      );
  }, [catalog.cosmetics, tab, rarityFilter, showOwned, ownedSet, query, dailySet, favSet]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = {
      all: catalog.cosmetics.length,
      favorites: catalog.cosmetics.filter((c) => favSet.has(c.id)).length,
      daily: catalog.cosmetics.filter((c) => dailySet.has(c.id)).length,
      seasonal: catalog.cosmetics.filter(
        (c) => c.rarity === "seasonal" || c.collection !== null,
      ).length,
    };
    for (const c of catalog.cosmetics) m[c.type] = (m[c.type] ?? 0) + 1;
    return m;
  }, [catalog.cosmetics, dailySet, favSet]);

  async function handleFavorite(cosmetic: ShopItemDTO) {
    // Otimista
    const wasFav = favSet.has(cosmetic.id);
    const nextSet = new Set(favSet);
    if (wasFav) nextSet.delete(cosmetic.id);
    else nextSet.add(cosmetic.id);
    setFavSet(nextSet);

    try {
      const res = await favoriteFn({ data: { cosmeticId: cosmetic.id } });
      if (res.favorited) toast.success(`${cosmetic.name} salvo nos favoritos`);
      else toast(`${cosmetic.name} removido dos favoritos`);
    } catch (e: unknown) {
      // Rollback
      setFavSet(favSet);
      const msg = e instanceof Error ? e.message : "Falha ao favoritar";
      toast.error(msg);
    }
  }

  async function confirmPurchase() {
    if (!buyTarget) return;
    setBuying(true);
    const toastId = toast.loading(`Comprando ${buyTarget.name}…`);
    try {
      const res = await purchaseFn({
        data: { cosmeticId: buyTarget.id, useDiscount: dailySet.has(buyTarget.id) },
      });

      if (!res.ok) {
        const reasonMap: Record<string, string> = {
          insufficient_funds: "Saldo insuficiente — ganhe mais moedas no Discord.",
          already_owned: "Você já tem esse cosmético.",
          not_found: "Cosmético não encontrado ou desativado.",
          expired: "Esta oferta expirou.",
          not_available_yet: "Esta oferta ainda não está disponível.",
        };
        toast.error(reasonMap[res.reason ?? ""] ?? `Não foi possível comprar: ${res.reason ?? "erro"}`, {
          id: toastId,
        });
      } else {
        toast.success(
          `${buyTarget.name} adquirido! −${fmt(res.price_paid ?? 0)} 🪙 · saldo ${fmt(res.new_balance ?? 0)}`,
          { id: toastId, duration: 4000 },
        );
        if (buyTarget.rarity === "legendary" || buyTarget.rarity === "epic") {
          celebrateLegendary();
        } else {
          celebrateBurst();
        }
        setBuyTarget(null);
        qc.invalidateQueries({ queryKey: ["shop-catalog"] });
        qc.invalidateQueries({ queryKey: ["my-profile"] });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao comprar";
      toast.error(msg, { id: toastId });
    } finally {
      setBuying(false);
    }
  }

  const canAfford = !!buyTarget && catalog.balance >= buyTarget.price_coins;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loja de Perfil</h1>
            <p className="text-muted-foreground">
              Banners, molduras e cosméticos para personalizar seu card — compre uma vez, use em qualquer servidor.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold tabular-nums">{fmt(catalog.balance)}</span>
              <span className="text-xs text-muted-foreground">saldo global</span>
            </div>
            <Button asChild variant="outline">
              <Link to="/perfil">
                <UserIcon className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>

            </Button>
          </div>
        </header>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, descrição ou raridade…"
              className="pl-9"
            />
          </div>
          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Raridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas raridades</SelectItem>
              <SelectItem value="common">Comum</SelectItem>
              <SelectItem value="rare">Raro</SelectItem>
              <SelectItem value="epic">Épico</SelectItem>
              <SelectItem value="legendary">Lendário</SelectItem>
              <SelectItem value="seasonal">Sazonal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={showOwned} onValueChange={(v) => setShowOwned(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mostrar tudo</SelectItem>
              <SelectItem value="missing">Só não-adquiridos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-full flex-wrap h-auto gap-1 sm:inline-flex sm:w-auto">
            {TYPE_TABS.map((t) => {
              const Icon = t.icon;
              const n = counts[t.id] ?? 0;
              return (
                <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                  <span className="text-[10px] text-muted-foreground">{n}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>


          <TabsContent value={tab} className="mt-6">
            {filtered.length === 0 ? (
              tab === "favorites" ? (
                <EmptyMascot
                  variant="sleeping"
                  title="Nenhum favorito ainda"
                  description="Clique no ❤ de qualquer item pra salvar aqui e achar fácil depois."
                />
              ) : (
                <EmptyMascot
                  variant="analyst"
                  title="Nada encontrado com esses filtros"
                  description="Tenta limpar a busca ou trocar de aba — tem muito cosmético escondido por aí."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery("");
                        setRarityFilter("all");
                        setShowOwned("all");
                        setTab("all");
                      }}
                    >
                      Limpar filtros
                    </Button>
                  }
                />
              )
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {pageItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      owned={ownedSet.has(item.id)}
                      favorited={favSet.has(item.id)}
                      onBuy={() => setBuyTarget(item)}
                      onFavorite={() => handleFavorite(item)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Mostrando {(safePage - 1) * PAGE_SIZE + 1}–
                      {Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {safePage} / {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!buyTarget} onOpenChange={(o) => !o && setBuyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar compra</DialogTitle>
            <DialogDescription>
              {buyTarget?.name} — {RARITY_LABEL[buyTarget?.rarity ?? "common"]}
            </DialogDescription>
          </DialogHeader>

          {buyTarget && (
            <div className="space-y-4">
              <div
                className={`overflow-hidden rounded-md bg-muted ${buyTarget.type === "banner" ? "aspect-[3/1]" : "aspect-square max-h-56"}`}
              >
                {buyTarget.image_url && (
                  <img
                    src={buyTarget.image_url}
                    alt={buyTarget.name}
                    className={`h-full w-full ${buyTarget.type === "frame" || buyTarget.type === "sticker" ? "object-contain p-3" : "object-cover"}`}
                  />
                )}
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/60 bg-card/50 px-3 py-2">
                <span className="text-sm text-muted-foreground">Preço</span>
                <span className="flex items-center gap-1 text-base font-semibold">
                  <Coins className="h-4 w-4 text-amber-400" />
                  {fmt(buyTarget.price_coins)}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Pagar com a carteira do servidor
                </label>
                {catalog.wallets.length === 0 ? (
                  <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                    Você ainda não tem moedas em nenhum servidor. Use o bot para ganhar
                    coins primeiro.
                  </p>
                ) : (
                  <Select
                    value={buyGuild ?? undefined}
                    onValueChange={(v) => setBuyGuild(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o servidor" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.wallets.map((w) => (
                        <SelectItem key={w.guild_id} value={w.guild_id}>
                          <span className="flex w-full items-center justify-between gap-3">
                            <span className="truncate">
                              {w.guild_name ?? w.guild_id}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {fmt(w.balance)} 🪙
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedWallet && !canAfford && (
                  <p className="text-xs text-destructive">
                    Saldo insuficiente nessa carteira ({fmt(selectedWallet.balance)} 🪙).
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setBuyTarget(null)} disabled={buying}>
              Cancelar
            </Button>
            <Button
              onClick={confirmPurchase}
              disabled={buying || !buyGuild || !canAfford}
            >
              {buying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Comprando…
                </>
              ) : (
                "Confirmar compra"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export const Route = createFileRoute("/_authenticated/loja")({
  loader: ({ context }) => context.queryClient.ensureQueryData(shopOptions),
  component: LojaPage,
  head: () => ({
    meta: [
      { title: "Loja de Perfil — Zenox" },
      {
        name: "description",
        content:
          "Compre banners, molduras e cosméticos para personalizar seu perfil Zenox.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">
        Erro ao carregar loja: {String(error)}
      </p>
    </main>
  ),
  notFoundComponent: () => <p>Não encontrado</p>,
});
