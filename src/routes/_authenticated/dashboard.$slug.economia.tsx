import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Coins,
  Plus,
  Save,
  Sparkles,
  ShoppingBag,
  Target,
  Briefcase,
  Zap,
  Loader2,
} from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { DashboardErrorBoundary, DashboardNotFound } from "@/components/dashboard/RouteBoundaries";
import { EmptyMascot } from "@/components/profile/EmptyMascot";
import {
  getEconomyConfig,
  listEconomyMissions,
  listMultipliers,
  listShopItems,
  removeEconomyMission,
  removeMultiplier,
  removeShopItem,
  updateEconomyConfig,
  upsertEconomyMission,
  upsertMultiplier,
  upsertShopItem,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AuroraSection,
  AuroraStatCard,
  AuroraSwitchRow,
  AuroraField,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";
import { RoleSelect } from "@/components/dashboard/selectors/RoleSelect";
import { ChannelSelect } from "@/components/dashboard/selectors/ChannelSelect";
import { RoleBadge, ChannelBadge } from "@/components/dashboard/DiscordBadges";


const MISSION_KIND_LABELS: Record<string, { label: string; emoji: string }> = {
  daily: { label: "Diária", emoji: "🌅" },
  work: { label: "Trabalho", emoji: "💼" },
  shop_spend: { label: "Gasto na loja", emoji: "🛍️" },
  crime: { label: "Crime", emoji: "🦹" },
  rob: { label: "Roubo", emoji: "💸" },
  messages: { label: "Mensagens", emoji: "💬" },
};

export const Route = createFileRoute("/_authenticated/dashboard/$slug/economia")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    const config = await context.queryClient.ensureQueryData({
      queryKey: ["economy", guildId],
      queryFn: () => getEconomyConfig({ data: { guildId: guildId } }),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["shop", guildId],
      queryFn: () => listShopItems({ data: { guildId: guildId } }),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["economy-missions", guildId],
      queryFn: () => listEconomyMissions({ data: { guildId: guildId } }),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["multipliers", guildId],
      queryFn: () => listMultipliers({ data: { guildId: guildId } }),
    });
    return { guildId, user, config };
  },
  component: EconomyPage,
  errorComponent: DashboardErrorBoundary,
  notFoundComponent: () => <DashboardNotFound message="Servidor não encontrado." />,
  head: () => ({ meta: [{ title: "Economia — Zenox" }] }),
});

function EconomyPage() {
  const { user, config } = Route.useLoaderData();
  const { guildId } = Route.useLoaderData();
  const qc = useQueryClient();
  const updateFn = useServerFn(updateEconomyConfig);
  const upsertItem = useServerFn(upsertShopItem);
  const removeItem = useServerFn(removeShopItem);
  const upsertMission = useServerFn(upsertEconomyMission);
  const removeMission = useServerFn(removeEconomyMission);
  const upsertMult = useServerFn(upsertMultiplier);
  const removeMult = useServerFn(removeMultiplier);

  const [form, setForm] = useState<any>(config);
  const [item, setItem] = useState({
    name: "",
    description: "",
    price: 100,
    role_id: "",
  });
  const [mission, setMission] = useState({
    slug: "daily_claim",
    title: "Pegue sua diária",
    description: "Use /daily hoje.",
    kind: "daily",
    goal: 1,
    reward: 150,
    active: true,
    sort_order: 1,
  });

  const [mult, setMult] = useState({
    kind: "xp" as "xp" | "coin",
    target_type: "role" as "role" | "channel",
    target_id: "",
    multiplier: 2,
    label: "",
  });

  const { data: shop } = useSuspenseQuery({
    queryKey: ["shop", guildId],
    queryFn: () => listShopItems({ data: { guildId } }),
  });
  const { data: missions } = useSuspenseQuery({
    queryKey: ["economy-missions", guildId],
    queryFn: () => listEconomyMissions({ data: { guildId } }),
  });
  const { data: multipliers } = useSuspenseQuery({
    queryKey: ["multipliers", guildId],
    queryFn: () => listMultipliers({ data: { guildId } }),
  });


  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          guildId,
          enabled: form.enabled,
          currency_name: form.currency_name,
          currency_emoji: form.currency_emoji,
          daily_amount: Number(form.daily_amount),
          work_min: Number(form.work_min),
          work_max: Number(form.work_max),
          work_cooldown_seconds: Number(form.work_cooldown_seconds),
        },
      }),
    onSuccess: (saved) => {
      setForm(saved);
      qc.setQueryData(["economy", guildId], saved);
      toast.success("Salvo. 💰");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const addItem = useMutation({
    mutationFn: () =>
      upsertItem({
        data: {
          guildId,
          name: item.name,
          description: item.description || null,
          price: Number(item.price),
          type: "role",
          role_id: item.role_id || null,
          enabled: true,
        },
      }),
    onSuccess: () => {
      setItem({ name: "", description: "", price: 100, role_id: "" });
      qc.invalidateQueries({ queryKey: ["shop", guildId] });
      toast.success("Item adicionado à loja.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => removeItem({ data: { guildId, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shop", guildId] }),
  });

  const addMission = useMutation({
    mutationFn: () =>
      upsertMission({
        data: {
          guildId,
          slug: mission.slug,
          title: mission.title,
          description: mission.description || null,
          kind: mission.kind as any,
          goal: Number(mission.goal),
          reward: Number(mission.reward),
          active: mission.active,
          sort_order: Number(mission.sort_order),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["economy-missions", guildId] });
      toast.success("Missão salva.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMission = useMutation({
    mutationFn: (id: string) => removeMission({ data: { guildId, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["economy-missions", guildId] }),
  });

  const addMult = useMutation({
    mutationFn: () =>
      upsertMult({
        data: {
          guildId,
          kind: mult.kind,
          target_type: mult.target_type,
          target_id: mult.target_id,
          multiplier: Number(mult.multiplier),
          label: mult.label || null,
          active: true,
        },
      }),
    onSuccess: () => {
      setMult({ ...mult, target_id: "", label: "" });
      qc.invalidateQueries({ queryKey: ["multipliers", guildId] });
      toast.success("Multiplicador salvo. ⚡");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMult = useMutation({
    mutationFn: (id: string) => removeMult({ data: { guildId, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["multipliers", guildId] }),
  });


  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Coins}
      title="Economia"
      description="Moeda própria do servidor, daily, work, loja de cargos e missões."
      actions={
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 size-4" />
          )}
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      }
    >
      <div className="aurora-panel relative mb-6 flex items-center gap-4 overflow-hidden p-5">
        <div className="aurora-float">
          <Mascot variant="celebrate" size={80} glow />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold tracking-tight">
            {form.currency_emoji} {form.currency_name || "Moedas"} pra todo lado!
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie sua própria economia. Daily, work, loja e missões — tudo configurável.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AuroraStatCard label="Itens na loja" value={shop.length} icon={ShoppingBag} tone="peach" />
        <AuroraStatCard label="Missões ativas" value={missions.length} icon={Target} tone="lavender" />
        <AuroraStatCard
          label="Daily"
          value={`${form.currency_emoji} ${Number(form.daily_amount).toLocaleString("pt-BR")}`}
          icon={Sparkles}
          tone="mint"
        />
      </div>

      <Tabs defaultValue="config">
        <TabsList className="aurora-panel">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="shop">Loja ({shop.length})</TabsTrigger>
          <TabsTrigger value="missions">Missões ({missions.length})</TabsTrigger>
          <TabsTrigger value="multipliers">Multiplicadores ({multipliers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-4 space-y-4">
          <AuroraSection title="Status" icon={Coins} tone="mint">
            <AuroraSwitchRow
              label="Ativar economia"
              checked={form.enabled}
              onChange={(v) => setForm({ ...form, enabled: v })}
            />
          </AuroraSection>

          <AuroraSection title="Moeda" icon={Sparkles} tone="peach">
            <div className="grid gap-3 sm:grid-cols-2">
              <AuroraField label="Nome da moeda">
                <Input
                  value={form.currency_name}
                  onChange={(e) => setForm({ ...form, currency_name: e.target.value })}
                />
              </AuroraField>
              <AuroraField label="Emoji da moeda">
                <Input
                  value={form.currency_emoji}
                  onChange={(e) => setForm({ ...form, currency_emoji: e.target.value })}
                />
              </AuroraField>
            </div>
          </AuroraSection>

          <AuroraSection title="Daily & Work" icon={Briefcase} tone="lavender">
            <div className="grid gap-3 sm:grid-cols-2">
              <AuroraField label="Valor do /daily">
                <Input
                  type="number"
                  value={form.daily_amount}
                  onChange={(e) => setForm({ ...form, daily_amount: e.target.value })}
                />
              </AuroraField>
              <AuroraField label="Cooldown /work (s)">
                <Input
                  type="number"
                  value={form.work_cooldown_seconds}
                  onChange={(e) =>
                    setForm({ ...form, work_cooldown_seconds: e.target.value })
                  }
                />
              </AuroraField>
              <AuroraField label="/work mínimo">
                <Input
                  type="number"
                  value={form.work_min}
                  onChange={(e) => setForm({ ...form, work_min: e.target.value })}
                />
              </AuroraField>
              <AuroraField label="/work máximo">
                <Input
                  type="number"
                  value={form.work_max}
                  onChange={(e) => setForm({ ...form, work_max: e.target.value })}
                />
              </AuroraField>
            </div>
          </AuroraSection>
        </TabsContent>

        <TabsContent value="shop" className="mt-4 space-y-4">
          <AuroraSection title="Novo item" icon={Plus} tone="peach">
            <div className="grid gap-3 sm:grid-cols-2">
              <AuroraField label="Nome">
                <Input
                  value={item.name}
                  onChange={(e) => setItem({ ...item, name: e.target.value })}
                />
              </AuroraField>
              <AuroraField label="Preço">
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => setItem({ ...item, price: Number(e.target.value) })}
                />
              </AuroraField>
              <AuroraField label="Cargo entregue na compra">
                <RoleSelect
                  guildId={guildId}
                  value={item.role_id || null}
                  onChange={(id) => setItem({ ...item, role_id: id ?? "" })}
                  excludeManaged
                  placeholder="Selecione um cargo"
                />
              </AuroraField>
              <AuroraField label="Descrição">
                <Textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) => setItem({ ...item, description: e.target.value })}
                />
              </AuroraField>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => addItem.mutate()}
                disabled={!item.name || !item.role_id || addItem.isPending}
              >
                <Plus className="mr-1.5 size-4" /> Adicionar
              </Button>
            </div>
          </AuroraSection>

          <div className="aurora-panel overflow-hidden">
            {shop.length === 0 ? (
              <EmptyMascot
                variant="sleeping"
                title="Loja vazia"
                description="Adicione o primeiro item acima para começar a vender cargos por moedas."
                size={96}
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {(shop as any[]).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-[color:color-mix(in_oklab,var(--aurora-peach)_6%,transparent)]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="flex size-10 items-center justify-center rounded-xl"
                        style={{
                          background:
                            "color-mix(in oklab, var(--aurora-peach) 25%, transparent)",
                        }}
                      >
                        <ShoppingBag className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{s.name}</p>
                        {s.description && (
                          <p className="truncate text-xs text-muted-foreground">
                            {s.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">Entrega:</span>
                          {s.role_id ? (
                            <RoleBadge guildId={guildId} roleId={s.role_id} />
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="font-display rounded-lg bg-[color:color-mix(in_oklab,var(--aurora-peach)_25%,transparent)] px-3 py-1.5 text-sm font-bold">
                      {form.currency_emoji} {s.price.toLocaleString("pt-BR")}
                    </span>
                    <ConfirmDeleteButton
                      onConfirm={() => deleteItem.mutate(s.id)}
                      title="Remover item da loja?"
                      description={`O item "${s.name}" será removido permanentemente.`}
                    />

                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="missions" className="mt-4 space-y-4">
          <AuroraSection title="Nova missão" icon={Target} tone="lavender">
            <div className="grid gap-3 sm:grid-cols-2">
              <AuroraField label="Slug">
                <Input
                  value={mission.slug}
                  onChange={(e) => setMission({ ...mission, slug: e.target.value })}
                />
              </AuroraField>
              <AuroraField label="Título">
                <Input
                  value={mission.title}
                  onChange={(e) => setMission({ ...mission, title: e.target.value })}
                />
              </AuroraField>
              <AuroraField label="Tipo">
                <select
                  value={mission.kind}
                  onChange={(e) => setMission({ ...mission, kind: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  {Object.entries(MISSION_KIND_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.emoji} {v.label}
                    </option>
                  ))}
                </select>
              </AuroraField>
              <AuroraField label="Meta">
                <Input
                  type="number"
                  value={mission.goal}
                  onChange={(e) => setMission({ ...mission, goal: Number(e.target.value) })}
                />
              </AuroraField>
              <AuroraField label="Recompensa">
                <Input
                  type="number"
                  value={mission.reward}
                  onChange={(e) => setMission({ ...mission, reward: Number(e.target.value) })}
                />
              </AuroraField>
              <AuroraField label="Ordem">
                <Input
                  type="number"
                  value={mission.sort_order}
                  onChange={(e) => setMission({ ...mission, sort_order: Number(e.target.value) })}
                />
              </AuroraField>
              <AuroraField label="Descrição">
                <Textarea
                  rows={2}
                  value={mission.description}
                  onChange={(e) => setMission({ ...mission, description: e.target.value })}
                />
              </AuroraField>
              <div className="flex items-end">
                <div className="w-full">
                  <AuroraSwitchRow
                    label="Ativa"
                    checked={mission.active}
                    onChange={(v) => setMission({ ...mission, active: v })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => addMission.mutate()}
                disabled={!mission.slug || !mission.title || addMission.isPending}
              >
                <Plus className="mr-1.5 size-4" /> Salvar missão
              </Button>
            </div>
          </AuroraSection>

          <div className="aurora-panel overflow-hidden">
            {missions.length === 0 ? (
              <EmptyMascot
                variant="sleeping"
                title="Nenhuma missão configurada"
                description="Crie a primeira missão para premiar atividades como /daily, /work ou roubos."
                size={96}
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {(missions as any[]).map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-[color:color-mix(in_oklab,var(--aurora-lavender)_6%,transparent)]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="flex size-10 items-center justify-center rounded-xl"
                        style={{
                          background:
                            "color-mix(in oklab, var(--aurora-lavender) 25%, transparent)",
                        }}
                      >
                        <Target className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {m.title}{" "}
                          <span className="font-mono text-[10px] text-muted-foreground">
                            /{m.slug}
                          </span>
                          {!m.active && (
                            <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              pausada
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span>
                            {MISSION_KIND_LABELS[m.kind]?.emoji ?? "🎯"}{" "}
                            {MISSION_KIND_LABELS[m.kind]?.label ?? m.kind}
                          </span>
                          <span>· meta {m.goal}</span>
                          <span>
                            · recompensa {form.currency_emoji}{" "}
                            {Number(m.reward).toLocaleString("pt-BR")}
                          </span>
                        </p>
                      </div>
                    </div>
                    <ConfirmDeleteButton
                      onConfirm={() => deleteMission.mutate(m.id)}
                      title="Remover missão?"
                      description={`A missão "${m.title}" será removida permanentemente.`}
                    />

                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="multipliers" className="mt-4 space-y-4">
          <AuroraSection title="Novo multiplicador" icon={Zap} tone="cyan">
            <p className="mb-3 text-xs text-muted-foreground">
              Dê um boost de XP ou moedas para um cargo específico (ex: VIP ganha 2x)
              ou para mensagens enviadas em um canal.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <AuroraField label="Tipo de boost">
                <select
                  value={mult.kind}
                  onChange={(e) => setMult({ ...mult, kind: e.target.value as any })}
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="xp">⭐ XP</option>
                  <option value="coin">💰 Moedas</option>
                </select>
              </AuroraField>
              <AuroraField label="Aplicar em">
                <select
                  value={mult.target_type}
                  onChange={(e) =>
                    setMult({
                      ...mult,
                      target_type: e.target.value as any,
                      target_id: "",
                    })
                  }
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  <option value="role">Cargo</option>
                  <option value="channel">Canal</option>
                </select>
              </AuroraField>
              <AuroraField
                label={mult.target_type === "role" ? "Cargo" : "Canal"}
              >
                {mult.target_type === "role" ? (
                  <RoleSelect
                    guildId={guildId}
                    value={mult.target_id || null}
                    onChange={(id) => setMult({ ...mult, target_id: id ?? "" })}
                    excludeManaged
                  />
                ) : (
                  <ChannelSelect
                    guildId={guildId}
                    value={mult.target_id || null}
                    onChange={(id) => setMult({ ...mult, target_id: id ?? "" })}
                  />
                )}
              </AuroraField>
              <AuroraField label="Multiplicador (ex: 2 = dobro)">
                <Input
                  type="number"
                  step="0.25"
                  min={0}
                  max={100}
                  value={mult.multiplier}
                  onChange={(e) =>
                    setMult({ ...mult, multiplier: Number(e.target.value) })
                  }
                />
              </AuroraField>
              <AuroraField label="Rótulo (opcional)">
                <Input
                  value={mult.label}
                  placeholder="Ex: Booster, Evento de fim de semana"
                  onChange={(e) => setMult({ ...mult, label: e.target.value })}
                />
              </AuroraField>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => addMult.mutate()}
                disabled={!mult.target_id || addMult.isPending}
              >
                <Plus className="mr-1.5 size-4" /> Adicionar
              </Button>
            </div>
          </AuroraSection>

          <div className="aurora-panel overflow-hidden">
            {multipliers.length === 0 ? (
              <EmptyMascot
                variant="sleeping"
                title="Sem multiplicadores ativos"
                description="Adicione um boost para premiar cargos VIP ou canais especiais com mais XP ou moedas."
                size={96}
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {multipliers.map((mp) => (
                  <li
                    key={mp.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-[color:color-mix(in_oklab,var(--aurora-cyan)_6%,transparent)]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="flex size-10 items-center justify-center rounded-xl text-lg"
                        style={{
                          background:
                            "color-mix(in oklab, var(--aurora-cyan) 25%, transparent)",
                        }}
                      >
                        {mp.kind === "xp" ? "⭐" : "💰"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display rounded-md bg-[color:color-mix(in_oklab,var(--aurora-cyan)_25%,transparent)] px-2 py-0.5 text-sm font-bold">
                            {mp.multiplier}×
                          </span>
                          <span className="text-sm font-medium">
                            {mp.kind === "xp" ? "XP" : "Moedas"}
                          </span>
                          {mp.label && (
                            <span className="text-xs text-muted-foreground">
                              · {mp.label}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>em</span>
                          {mp.target_type === "role" ? (
                            <RoleBadge guildId={guildId} roleId={mp.target_id} />
                          ) : (
                            <ChannelBadge
                              guildId={guildId}
                              channelId={mp.target_id}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <ConfirmDeleteButton
                      onConfirm={() => deleteMult.mutate(mp.id)}
                      title="Remover multiplicador?"
                      description="O boost será desativado imediatamente."
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}
