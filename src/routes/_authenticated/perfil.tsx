import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  getMyProfile,
  equipCosmetic,
  unequipCosmetic,
  updateProfileMeta,
  type ProfileDTO,
  type CosmeticDTO,
} from "@/lib/profile/profile.functions";
import { getPurchaseHistory } from "@/lib/profile/purchase-history.functions";
import { celebrateBurst } from "@/lib/animations/confetti";
import { EmptyMascot } from "@/components/profile/EmptyMascot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Shirt, Palette, Sticker, Wand2, ShoppingBag, X, History, Coins, Gift, Trophy } from "lucide-react";

const profileOptions = queryOptions({
  queryKey: ["my-profile"],
  queryFn: () => getMyProfile(),
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

const TYPE_LABEL: Record<string, string> = {
  banner: "Banner",
  frame: "Moldura",
  sticker: "Sticker",
  effect: "Efeito",
  background_pattern: "Fundo",
  badge_decoration: "Decoração",
};

const TYPE_TABS = [
  { id: "all", label: "Tudo", icon: Sparkles },
  { id: "banner", label: "Banners", icon: Shirt },
  { id: "frame", label: "Molduras", icon: Palette },
  { id: "sticker", label: "Stickers", icon: Sticker },
  { id: "effect", label: "Efeitos", icon: Wand2 },
] as const;

function avatarUrl(user: ProfileDTO["user"]) {
  if (!user.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
}

function initials(user: ProfileDTO["user"]) {
  return (user.globalName ?? user.username).slice(0, 2).toUpperCase();
}

function ProfilePreviewCard({ profile }: { profile: ProfileDTO }) {
  const { user, loadout } = profile;
  const av = avatarUrl(user);
  const bannerUrl = loadout.banner?.image_url;

  return (
    <Card className="overflow-hidden border-border/60">
      <div
        className="relative h-44 w-full"
        style={{
          backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: bannerUrl ? undefined : loadout.accent_color,
        }}
      >
        {!bannerUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/60" />
        )}
        {loadout.stickers.length > 0 && (
          <div className="absolute right-3 top-3 flex gap-2">
            {loadout.stickers.slice(0, 3).map((s) => (
              <img
                key={s.id}
                src={s.image_url ?? ""}
                alt={s.name}
                className="h-12 w-12 rounded-md object-contain drop-shadow-lg animate-in fade-in"
              />
            ))}
          </div>
        )}
      </div>

      <CardContent className="relative pt-0">
        <div className="-mt-12 flex items-end gap-4">
          <div
            className="rounded-full p-1"
            style={{
              backgroundImage: loadout.frame?.image_url
                ? `url(${loadout.frame.image_url})`
                : undefined,
              backgroundSize: "cover",
              backgroundColor: loadout.frame?.image_url ? undefined : loadout.accent_color,
            }}
          >
            <Avatar className="h-24 w-24 border-4 border-background">
              {av ? <AvatarImage src={av} alt={user.username} /> : null}
              <AvatarFallback>{initials(user)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 pb-2">
            <h2 className="text-xl font-semibold">{user.globalName ?? user.username}</h2>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>

        {loadout.bio && (
          <p className="mt-4 text-sm text-foreground/80 whitespace-pre-wrap break-words">
            {loadout.bio}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" style={{ borderColor: loadout.accent_color, color: loadout.accent_color }}>
            🪙 {profile.totalBalance.toLocaleString("pt-BR")}
          </Badge>
          {loadout.effect && (
            <Badge variant="outline" className={RARITY_STYLES[loadout.effect.rarity]}>
              ✨ {loadout.effect.name}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EquippedRow({
  label,
  cosmetic,
  onUnequip,
}: {
  label: string;
  cosmetic: CosmeticDTO | null;
  onUnequip?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-card/50 p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-12 w-12 shrink-0 rounded-md bg-muted overflow-hidden flex items-center justify-center">
          {cosmetic?.image_url ? (
            <img src={cosmetic.image_url} alt={cosmetic.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium truncate">{cosmetic?.name ?? "Nenhum"}</p>
        </div>
      </div>
      {cosmetic && onUnequip && (
        <Button variant="ghost" size="icon" onClick={onUnequip} title="Desequipar">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function InventoryItem({
  entry,
  isEquipped,
  onEquip,
}: {
  entry: ProfileDTO["inventory"][number];
  isEquipped: boolean;
  onEquip: () => void;
}) {
  const c = entry.cosmetic;
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square w-full bg-muted overflow-hidden">
        {c.image_url && (
          <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium truncate">{c.name}</p>
          <Badge variant="outline" className={RARITY_STYLES[c.rarity]}>
            {RARITY_LABEL[c.rarity] ?? c.rarity}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{TYPE_LABEL[c.type] ?? c.type}</p>
        <Button
          size="sm"
          className="w-full"
          variant={isEquipped ? "secondary" : "default"}
          onClick={onEquip}
          disabled={isEquipped}
        >
          {isEquipped ? "Equipado" : "Equipar"}
        </Button>
      </CardContent>
    </Card>
  );
}

const SOURCE_LABEL: Record<string, { label: string; icon: typeof Coins; tone: string }> = {
  shop: { label: "Compra na loja", icon: Coins, tone: "text-amber-400" },
  drop: { label: "Drop aleatório", icon: Gift, tone: "text-pink-400" },
  level_reward: { label: "Recompensa de nível", icon: Trophy, tone: "text-emerald-400" },
  seasonal: { label: "Recompensa sazonal", icon: Sparkles, tone: "text-purple-400" },
  daily: { label: "Diário", icon: Gift, tone: "text-blue-400" },
  admin: { label: "Concedido", icon: Sparkles, tone: "text-muted-foreground" },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `há ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `há ${day}d`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `há ${mo}mes${mo > 1 ? "es" : ""}`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function PurchaseHistorySection() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["purchase-history"],
    queryFn: () => getPurchaseHistory(),
    staleTime: 1000 * 30,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Carregando histórico…
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="py-2">
          <EmptyMascot
            variant="sleeping"
            title="Você ainda não comprou nada"
            description="Bora pra loja? Banners, molduras e stickers te esperam."
            action={
              <Button asChild>
                <Link to="/loja">Visitar a loja</Link>
              </Button>

            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Últimas aquisições</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {history.map((entry) => {
            const meta = SOURCE_LABEL[entry.source ?? ""] ?? SOURCE_LABEL.admin;
            const Icon = meta.icon;
            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-md border border-border/60 bg-card/50 p-2.5 transition-colors hover:bg-card animate-fade-in"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {entry.cosmetic.image_url && (
                    <img
                      src={entry.cosmetic.image_url}
                      alt={entry.cosmetic.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{entry.cosmetic.name}</p>
                    <Badge variant="outline" className={`shrink-0 ${RARITY_STYLES[entry.cosmetic.rarity]}`}>
                      {RARITY_LABEL[entry.cosmetic.rarity] ?? entry.cosmetic.rarity}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className={`h-3 w-3 ${meta.tone}`} />
                    {meta.label}
                    {entry.price_paid != null && entry.price_paid > 0 && (
                      <>
                        <span className="opacity-50">·</span>
                        <span>−{entry.price_paid.toLocaleString("pt-BR")} 🪙</span>
                      </>
                    )}
                    <span className="opacity-50">·</span>
                    <span>{timeAgo(entry.acquired_at)}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function PerfilPage() {
  const qc = useQueryClient();
  const { data: profile } = useSuspenseQuery(profileOptions);
  const equipFn = useServerFn(equipCosmetic);
  const unequipFn = useServerFn(unequipCosmetic);
  const updateMetaFn = useServerFn(updateProfileMeta);

  const [bio, setBio] = useState(profile.loadout.bio ?? "");
  const [accent, setAccent] = useState(profile.loadout.accent_color);
  const [savingMeta, setSavingMeta] = useState(false);
  const [tab, setTab] = useState<string>("all");
  const [cardVersion, setCardVersion] = useState(() => Date.now());

  const equippedIds = useMemo(() => {
    const set = new Set<string>();
    for (const k of ["banner", "frame", "effect", "background_pattern"] as const) {
      const c = profile.loadout[k];
      if (c) set.add(c.id);
    }
    for (const s of profile.loadout.stickers) set.add(s.id);
    return set;
  }, [profile.loadout]);

  const filteredInventory = useMemo(() => {
    if (tab === "all") return profile.inventory;
    return profile.inventory.filter((e) => e.cosmetic.type === tab);
  }, [profile.inventory, tab]);

  async function handleEquip(cosmeticId: string) {
    try {
      await equipFn({ data: { cosmeticId } });
      toast.success("Equipado!");
      celebrateBurst();
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      setCardVersion(Date.now());
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao equipar");
    }
  }

  async function handleUnequip(slot: "banner" | "frame" | "effect" | "background_pattern" | "sticker", cosmeticId?: string) {
    try {
      await unequipFn({ data: { slot, cosmeticId } });
      toast.success("Desequipado");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      setCardVersion(Date.now());
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao desequipar");
    }
  }

  async function handleSaveMeta() {
    setSavingMeta(true);
    try {
      await updateMetaFn({ data: { bio, accentColor: accent } });
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      setCardVersion(Date.now());
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao salvar");
    } finally {
      setSavingMeta(false);
    }
  }

  const hasInventory = profile.inventory.length > 0;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Equipe cosméticos, personalize sua bio e veja o preview ao vivo do seu card.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/loja">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ir para loja
            </Link>
          </Button>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Coluna esquerda: preview + equipados + customização */}
          <div className="space-y-6">
            <ProfilePreviewCard profile={profile} />

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Card público (embed Discord)</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const url = `${window.location.origin}/api/public/profile/${profile.user.id}/card.svg`;
                    void navigator.clipboard.writeText(url);
                    toast.success("URL copiada");
                  }}
                >
                  Copiar URL
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-border/60 bg-muted">
                  <img
                    key={cardVersion}
                    src={`/api/public/profile/${profile.user.id}/card.svg?v=${cardVersion}`}
                    alt="Preview do card público"
                    className="block h-auto w-full"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Esta imagem é usada no embed do <code>/perfil</code> no Discord.
                  Atualiza automaticamente quando você equipa/desequipa.
                </p>
              </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle className="text-base">Equipado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <EquippedRow
                  label="Banner"
                  cosmetic={profile.loadout.banner}
                  onUnequip={() => handleUnequip("banner")}
                />
                <EquippedRow
                  label="Moldura"
                  cosmetic={profile.loadout.frame}
                  onUnequip={() => handleUnequip("frame")}
                />
                <EquippedRow
                  label="Efeito"
                  cosmetic={profile.loadout.effect}
                  onUnequip={() => handleUnequip("effect")}
                />
                <EquippedRow
                  label="Fundo"
                  cosmetic={profile.loadout.background_pattern}
                  onUnequip={() => handleUnequip("background_pattern")}
                />
                <div className="pt-2">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Stickers ({profile.loadout.stickers.length}/3)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.loadout.stickers.length === 0 && (
                      <p className="text-xs text-muted-foreground">Nenhum sticker equipado.</p>
                    )}
                    {profile.loadout.stickers.map((s) => (
                      <div
                        key={s.id}
                        className="group relative h-14 w-14 rounded-md border border-border/60 bg-muted overflow-hidden"
                      >
                        {s.image_url && (
                          <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />
                        )}
                        <button
                          onClick={() => handleUnequip("sticker", s.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover sticker"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personalização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Bio (máx 200)</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                    placeholder="Conte algo sobre você…"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-right text-xs text-muted-foreground">{bio.length}/200</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-muted-foreground">Cor de destaque</label>
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded-md border border-border bg-transparent"
                  />
                  <code className="text-xs text-muted-foreground">{accent}</code>
                </div>
                <Button onClick={handleSaveMeta} disabled={savingMeta} className="w-full">
                  {savingMeta ? "Salvando…" : "Salvar"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Coluna direita: inventário + histórico */}
          <div className="space-y-4 self-start">
            <Tabs defaultValue="inventory">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inventory" className="gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Inventário ({profile.inventory.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inventory">
                <Card>
                  <CardContent className="pt-6">
                    <Tabs value={tab} onValueChange={setTab}>
                      <TabsList className="grid w-full grid-cols-5">
                        {TYPE_TABS.map((t) => {
                          const Icon = t.icon;
                          return (
                            <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                              <Icon className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{t.label}</span>
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>
                      <TabsContent value={tab} className="mt-4">
                        {!hasInventory ? (
                          <EmptyMascot
                            variant="sleeping"
                            title="Inventário vazio"
                            description="Você ainda não tem cosméticos. Bora ganhar moedas e dar uma olhada na loja?"
                            action={
                              <Button asChild>
                                <Link to="/loja">Visitar a loja</Link>
                              </Button>
                            }
                          />
                        ) : filteredInventory.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">
                            Nenhum item desta categoria.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {filteredInventory.map((entry) => (
                              <InventoryItem
                                key={entry.id}
                                entry={entry}
                                isEquipped={equippedIds.has(entry.cosmetic.id)}
                                onEquip={() => handleEquip(entry.cosmetic.id)}
                              />
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <PurchaseHistorySection />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_authenticated/perfil")({
  loader: ({ context }) => context.queryClient.ensureQueryData(profileOptions),
  component: PerfilPage,
  head: () => ({
    meta: [
      { title: "Meu Perfil — Zenox" },
      {
        name: "description",
        content: "Personalize seu perfil Zenox: equipe banners, molduras, stickers e bio.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Erro ao carregar perfil: {String(error)}</p>
    </main>
  ),
  notFoundComponent: () => <p>Não encontrado</p>,
});
