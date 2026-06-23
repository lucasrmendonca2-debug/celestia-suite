import { createFileRoute, notFound } from "@tanstack/react-router";
import { DashboardErrorBoundary, DashboardNotFound } from "@/components/dashboard/RouteBoundaries";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag, RefreshCw, Sparkles, Plus, Coins, TrendingUp, Settings2 } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getGuildShopOverview,
  forceRotation,
  setEconomyTuning,
  toggleGuildCosmetic,
  createGuildCosmetic,
} from "@/lib/cosmetics/guild-shop.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { AuroraSection, AuroraStatCard, AuroraField } from "@/components/dashboard/aurora-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const RARITY_LABEL: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  seasonal: "Sazonal",
};

const RARITY_TONE: Record<string, string> = {
  common: "bg-muted text-muted-foreground border-transparent",
  rare: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  epic: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  legendary: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  seasonal: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

const TYPE_LABEL: Record<string, string> = {
  banner: "Banner",
  frame: "Moldura",
  sticker: "Sticker",
  effect: "Efeito",
  background_pattern: "Padrão",
  badge_decoration: "Decoração",
};

export const Route = createFileRoute("/_authenticated/dashboard/$slug/loja")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["guild-shop", guildId],
      queryFn: () => getGuildShopOverview({ data: { guildId } }),
    });
    return { guildId, user };
  },
  component: GuildShopPage,
  errorComponent: DashboardErrorBoundary,
  notFoundComponent: () => <DashboardNotFound />,
  head: () => ({
    meta: [{ title: "Loja de Cosméticos — Zenox" }],
  }),
});

function GuildShopPage() {
  const { guildId, user } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: ["guild-shop", guildId],
    queryFn: () => getGuildShopOverview({ data: { guildId } }),
  });

  const rotateFn = useServerFn(forceRotation);
  const tuneFn = useServerFn(setEconomyTuning);
  const toggleFn = useServerFn(toggleGuildCosmetic);
  const createFn = useServerFn(createGuildCosmetic);

  const rotate = useMutation({
    mutationFn: () => rotateFn({ data: { guildId } }),
    onSuccess: () => {
      toast.success("Nova rotação gerada!");
      qc.invalidateQueries({ queryKey: ["guild-shop", guildId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao rodar rotação"),
  });

  const [priceMult, setPriceMult] = useState(
    Number(data.tuning.shop_price_multiplier ?? 1),
  );
  const [dailyMult, setDailyMult] = useState(
    Number(data.tuning.daily_reward_multiplier ?? 1),
  );

  const tune = useMutation({
    mutationFn: () =>
      tuneFn({
        data: {
          guildId,
          shop_price_multiplier: priceMult,
          daily_reward_multiplier: dailyMult,
        },
      }),
    onSuccess: () => {
      toast.success("Tuning de economia salvo.");
      qc.invalidateQueries({ queryKey: ["guild-shop", guildId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const toggle = useMutation({
    mutationFn: (v: { cosmeticId: string; active: boolean }) =>
      toggleFn({ data: { guildId, ...v } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guild-shop", guildId] }),
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  const exclusives = data.cosmetics.filter(
    (c: any) => c.guild_exclusive_id === guildId,
  );
  const rotation = data.rotation;
  const dailyIds: string[] = rotation?.daily_offers ?? [];
  const rareIds: string[] = rotation?.rare_picks ?? [];
  const rotationItems = data.cosmetics.filter((c: any) =>
    dailyIds.includes(c.id) || rareIds.includes(c.id),
  );

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={ShoppingBag}
      title="Loja de Cosméticos"
      description="Rotação diária, multiplicadores e itens exclusivos do servidor."
      actions={
        <Button
          size="sm"
          variant="outline"
          disabled={rotate.isPending}
          onClick={() => rotate.mutate()}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${rotate.isPending ? "animate-spin" : ""}`}
          />
          Forçar rotação
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <AuroraStatCard
          label="Vendas (7 dias)"
          value={data.totalSales7d}
          icon={TrendingUp}
          tone="mint"
        />
        <AuroraStatCard
          label="Exclusivos da guild"
          value={exclusives.length}
          icon={Sparkles}
          tone="lavender"
        />
        <AuroraStatCard
          label="Itens na rotação hoje"
          value={rotationItems.length}
          icon={ShoppingBag}
          tone="peach"
        />
      </div>

      <div className="mt-6 space-y-6">
        {/* Rotação do dia */}
        <AuroraSection
          title="Rotação do dia"
          description="Itens em destaque para todos os usuários hoje. Atualiza automaticamente à meia-noite."
          icon={Sparkles}
          tone="peach"
        >
          {rotationItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem itens na rotação ainda. Clique em "Forçar rotação" no topo.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {rotationItems.map((c: any) => (
                <CosmeticCard key={c.id} cosmetic={c} />
              ))}
            </div>
          )}
        </AuroraSection>

        {/* Tuning de economia */}
        <AuroraSection
          title="Multiplicadores de economia"
          description="Ajuste preço da loja e recompensa diária. Use com cuidado — afeta toda a guild."
          icon={Settings2}
          tone="cyan"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <AuroraField
              label={`Preço da loja: ${priceMult.toFixed(2)}×`}
              hint="0.5× = metade do preço · 2.0× = dobro"
            >
              <Slider
                value={[priceMult]}
                onValueChange={(v) => setPriceMult(v[0])}
                min={0.5}
                max={2.0}
                step={0.05}
              />
            </AuroraField>
            <AuroraField
              label={`Recompensa diária: ${dailyMult.toFixed(2)}×`}
              hint="Aplicado no /daily e drops"
            >
              <Slider
                value={[dailyMult]}
                onValueChange={(v) => setDailyMult(v[0])}
                min={0.5}
                max={2.0}
                step={0.05}
              />
            </AuroraField>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => tune.mutate()} disabled={tune.isPending}>
              {tune.isPending ? "Salvando..." : "Salvar tuning"}
            </Button>
            <Badge variant="outline" className="text-xs">
              Estado: {String(data.tuning.state ?? "stable")}
            </Badge>
          </div>
        </AuroraSection>

        {/* Cosméticos exclusivos */}
        <AuroraSection
          title="Cosméticos exclusivos do servidor"
          description="Crie itens que aparecem apenas para membros desse servidor."
          icon={ShoppingBag}
          tone="lavender"
        >
          <div className="mb-3 flex justify-end">
            <CreateCosmeticDialog
              guildId={guildId}
              onCreated={() => qc.invalidateQueries({ queryKey: ["guild-shop", guildId] })}
              createFn={createFn}
            />
          </div>
          {exclusives.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum cosmético exclusivo ainda. Crie o primeiro com o botão acima!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {exclusives.map((c: any) => (
                <CosmeticCard
                  key={c.id}
                  cosmetic={c}
                  exclusive
                  onToggle={(active) =>
                    toggle.mutate({ cosmeticId: c.id, active })
                  }
                />
              ))}
            </div>
          )}
        </AuroraSection>
      </div>
    </ModuleLayout>
  );
}

function CosmeticCard({
  cosmetic,
  exclusive,
  onToggle,
}: {
  cosmetic: any;
  exclusive?: boolean;
  onToggle?: (active: boolean) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
      <div
        className={`relative ${cosmetic.type === "banner" ? "aspect-[3/1]" : "aspect-square"} w-full bg-muted`}
      >
        {cosmetic.image_url && (
          <img
            src={cosmetic.image_url}
            alt={cosmetic.name}
            className="h-full w-full object-cover"
          />
        )}
        <Badge
          variant="outline"
          className={`absolute left-2 top-2 ${RARITY_TONE[cosmetic.rarity]}`}
        >
          {RARITY_LABEL[cosmetic.rarity] ?? cosmetic.rarity}
        </Badge>
        {!cosmetic.active && (
          <Badge className="absolute right-2 top-2 bg-zinc-700 text-white border-transparent">
            Inativo
          </Badge>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-medium">{cosmetic.name}</p>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-amber-400">
            <Coins className="h-3 w-3" />
            {cosmetic.price_coins.toLocaleString("pt-BR")}
          </span>
          {cosmetic.sales_7d > 0 && (
            <span className="text-muted-foreground">
              {cosmetic.sales_7d} vendas
            </span>
          )}
        </div>
        {exclusive && onToggle && (
          <Button
            size="sm"
            variant={cosmetic.active ? "outline" : "default"}
            className="mt-2 h-7 w-full text-xs"
            onClick={() => onToggle(!cosmetic.active)}
          >
            {cosmetic.active ? "Desativar" : "Ativar"}
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateCosmeticDialog({
  guildId,
  onCreated,
  createFn,
}: {
  guildId: string;
  onCreated: () => void;
  createFn: ReturnType<typeof useServerFn<typeof createGuildCosmetic>>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    type: "banner" as
      | "banner"
      | "frame"
      | "sticker"
      | "effect"
      | "background_pattern"
      | "badge_decoration",
    rarity: "common" as "common" | "rare" | "epic" | "legendary" | "seasonal",
    price_coins: 100,
    image_url: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await createFn({ data: { guildId, ...form } });
      toast.success("Cosmético criado!");
      setOpen(false);
      setForm({
        slug: "",
        name: "",
        description: "",
        type: "banner",
        rarity: "common",
        price_coins: 100,
        image_url: "",
      });
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo cosmético
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cosmético exclusivo da guild</DialogTitle>
          <DialogDescription>
            Disponível apenas para membros desse servidor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <AuroraField label="Nome">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Banner do Aniversário"
            />
          </AuroraField>
          <AuroraField label="Slug" hint="ID único (sem espaços)">
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="banner-aniversario"
            />
          </AuroraField>
          <AuroraField label="Descrição">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </AuroraField>
          <div className="grid grid-cols-2 gap-3">
            <AuroraField label="Tipo">
              <Select
                value={form.type}
                onValueChange={(v: any) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AuroraField>
            <AuroraField label="Raridade">
              <Select
                value={form.rarity}
                onValueChange={(v: any) => setForm({ ...form, rarity: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RARITY_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AuroraField>
          </div>
          <AuroraField label="Preço (moedas)">
            <Input
              type="number"
              value={form.price_coins}
              onChange={(e) =>
                setForm({ ...form, price_coins: Number(e.target.value) })
              }
            />
          </AuroraField>
          <AuroraField label="URL da imagem">
            <Input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
            />
          </AuroraField>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={saving || !form.name || !form.slug || !form.image_url}
          >
            {saving ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
