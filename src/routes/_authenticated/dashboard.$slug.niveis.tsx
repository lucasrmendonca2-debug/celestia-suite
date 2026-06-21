import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2, TrendingUp } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  addLevelReward,
  getLeaderboard,
  getLevelingConfig,
  listLevelRewards,
  removeLevelReward,
  updateLevelingConfig,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AuroraSection,
  AuroraStatCard,
  AuroraSwitchRow,
  AuroraField,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Trophy, Zap, Users, Crown, Medal, Award } from "lucide-react";


export const Route = createFileRoute("/_authenticated/g/$guildId/niveis")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    const config = await context.queryClient.ensureQueryData({
      queryKey: ["leveling", params.guildId],
      queryFn: () => getLevelingConfig({ data: { guildId: params.guildId } }),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["level-rewards", params.guildId],
      queryFn: () => listLevelRewards({ data: { guildId: params.guildId } }),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["leaderboard", params.guildId],
      queryFn: () => getLeaderboard({ data: { guildId: params.guildId } }),
    });
    return { user, config };
  },
  component: LevelingPage,
});

function LevelingPage() {
  const { user, config } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const qc = useQueryClient();
  const updateFn = useServerFn(updateLevelingConfig);
  const addRewardFn = useServerFn(addLevelReward);
  const removeRewardFn = useServerFn(removeLevelReward);

  const [form, setForm] = useState<any>(config);
  const [newLevel, setNewLevel] = useState("");
  const [newRoleId, setNewRoleId] = useState("");

  const { data: rewards } = useSuspenseQuery({
    queryKey: ["level-rewards", guildId],
    queryFn: () => listLevelRewards({ data: { guildId } }),
  });
  const { data: lb } = useSuspenseQuery({
    queryKey: ["leaderboard", guildId],
    queryFn: () => getLeaderboard({ data: { guildId } }),
  });

  const parseList = (s: string) =>
    s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          guildId,
          enabled: form.enabled,
          xp_per_message_min: Number(form.xp_per_message_min),
          xp_per_message_max: Number(form.xp_per_message_max),
          cooldown_seconds: Number(form.cooldown_seconds),
          level_up_channel_id: form.level_up_channel_id || null,
          level_up_message: form.level_up_message,
          level_up_dm: form.level_up_dm,
          no_xp_channels: form.no_xp_channels ?? [],
          no_xp_roles: form.no_xp_roles ?? [],
          stack_rewards: form.stack_rewards,
        },
      }),
    onSuccess: (saved) => {
      setForm(saved);
      qc.setQueryData(["leveling", guildId], saved);
      toast.success("Configuração salva.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const addReward = useMutation({
    mutationFn: () =>
      addRewardFn({
        data: { guildId, level: Number(newLevel), roleId: newRoleId },
      }),
    onSuccess: () => {
      setNewLevel("");
      setNewRoleId("");
      qc.invalidateQueries({ queryKey: ["level-rewards", guildId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const removeReward = useMutation({
    mutationFn: (id: string) => removeRewardFn({ data: { guildId, id } }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["level-rewards", guildId] }),
  });

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={TrendingUp}
      title="Níveis & XP"
      description="Sistema de progressão com XP por mensagem, ranking e recompensas."
      actions={
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-1.5 size-4" />
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      }
    >
      {/* Hero banner */}
      <div className="aurora-panel relative mb-6 flex items-center gap-4 overflow-hidden p-5">
        <div className="aurora-float">
          <Mascot variant="celebrate" size={80} glow />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Sistema de XP & Ranking ✨
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Membros sobem de nível conversando. Configure XP, recompensas e veja o ranking ao vivo.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AuroraStatCard
          label="Membros no ranking"
          value={(lb as any[]).length}
          icon={Users}
          tone="lavender"
        />
        <AuroraStatCard
          label="Recompensas ativas"
          value={rewards.length}
          icon={Trophy}
          tone="peach"
        />
        <AuroraStatCard
          label="XP por mensagem"
          value={`${form.xp_per_message_min}–${form.xp_per_message_max}`}
          icon={Zap}
          tone="mint"
        />
      </div>

      <Tabs defaultValue="config">
        <TabsList className="aurora-panel">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas ({rewards.length})</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-4 space-y-4">
          <AuroraSection title="Status" icon={Zap} tone="mint">
            <AuroraSwitchRow
              label="Ativar sistema de XP"
              hint="Quando desligado, mensagens não geram XP."
              checked={form.enabled}
              onChange={(v) => setForm({ ...form, enabled: v })}
            />
          </AuroraSection>

          <AuroraSection title="Ganho de XP" icon={Zap} tone="peach">
            <div className="grid gap-3 sm:grid-cols-3">
              <Num
                label="XP mínimo / msg"
                value={form.xp_per_message_min}
                onChange={(v) => setForm({ ...form, xp_per_message_min: v })}
              />
              <Num
                label="XP máximo / msg"
                value={form.xp_per_message_max}
                onChange={(v) => setForm({ ...form, xp_per_message_max: v })}
              />
              <Num
                label="Cooldown (s)"
                value={form.cooldown_seconds}
                onChange={(v) => setForm({ ...form, cooldown_seconds: v })}
              />
            </div>
          </AuroraSection>

          <AuroraSection title="Mensagem de level up" icon={Trophy} tone="pink">
            <AuroraField
              label="Canal de level up"
              hint="Vazio = envia no mesmo canal da mensagem que subiu de nível."
            >
              <Input
                placeholder="ID do canal"
                value={form.level_up_channel_id ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    level_up_channel_id: e.target.value.trim() || null,
                  })
                }
              />
            </AuroraField>
            <AuroraField
              label="Texto enviado"
              hint="Variáveis: {user}, {level}, {xp}"
            >
              <Textarea
                rows={3}
                className="font-mono text-sm"
                value={form.level_up_message}
                onChange={(e) =>
                  setForm({ ...form, level_up_message: e.target.value })
                }
              />
            </AuroraField>
            <AuroraSwitchRow
              label="Enviar também por DM"
              checked={form.level_up_dm}
              onChange={(v) => setForm({ ...form, level_up_dm: v })}
            />
          </AuroraSection>

          <AuroraSection title="Exceções" icon={Users} tone="cyan">
            <AuroraField label="Canais sem XP (IDs)">
              <Textarea
                rows={2}
                className="font-mono text-xs"
                value={(form.no_xp_channels ?? []).join("\n")}
                onChange={(e) =>
                  setForm({ ...form, no_xp_channels: parseList(e.target.value) })
                }
              />
            </AuroraField>
            <AuroraField label="Cargos sem XP (IDs)">
              <Textarea
                rows={2}
                className="font-mono text-xs"
                value={(form.no_xp_roles ?? []).join("\n")}
                onChange={(e) =>
                  setForm({ ...form, no_xp_roles: parseList(e.target.value) })
                }
              />
            </AuroraField>
          </AuroraSection>

          <AuroraSection title="Recompensas" icon={Trophy} tone="lavender">
            <AuroraSwitchRow
              label="Acumular cargos de nível"
              hint="Quando ligado, o membro mantém todos os cargos ganhos. Senão, só o mais alto."
              checked={form.stack_rewards}
              onChange={(v) => setForm({ ...form, stack_rewards: v })}
            />
          </AuroraSection>
        </TabsContent>

        <TabsContent value="rewards" className="mt-4 space-y-4">
          <AuroraSection title="Adicionar recompensa" icon={Plus} tone="mint">
            <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto]">
              <Input
                type="number"
                placeholder="Nível"
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
              />
              <Input
                placeholder="ID do cargo"
                value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value.trim())}
              />
              <Button
                onClick={() => addReward.mutate()}
                disabled={!newLevel || !newRoleId || addReward.isPending}
              >
                <Plus className="mr-1.5 size-4" /> Adicionar
              </Button>
            </div>
          </AuroraSection>
          <div className="aurora-panel overflow-hidden">
            {rewards.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <Mascot variant="sleeping" size={72} />
                <p className="text-sm text-muted-foreground">
                  Nenhuma recompensa ainda. Que tal recompensar quem conversa?
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {(rewards as any[]).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-5 py-3 transition hover:bg-[color:color-mix(in_oklab,var(--aurora-lavender)_6%,transparent)]"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="font-display rounded-lg px-2.5 py-1 text-xs font-bold"
                        style={{
                          background:
                            "linear-gradient(135deg, color-mix(in oklab, var(--aurora-peach) 50%, white), color-mix(in oklab, var(--aurora-pink) 40%, white))",
                          color: "#4a2a00",
                        }}
                      >
                        Nv {r.level}
                      </span>
                      <span className="font-mono text-sm">{r.role_id}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReward.mutate(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <div className="aurora-panel overflow-hidden">
            {(lb as any[]).length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <Mascot variant="sleeping" size={72} />
                <p className="text-sm text-muted-foreground">
                  Sem dados ainda. Quando alguém conversar, aparece aqui!
                </p>
              </div>
            ) : (
              <ol className="divide-y divide-border/60">
                {(lb as any[]).map((u, i) => {
                  const RankIcon =
                    i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Award : null;
                  const rankClass =
                    i === 0
                      ? "aurora-rank-1"
                      : i === 1
                        ? "aurora-rank-2"
                        : i === 2
                          ? "aurora-rank-3"
                          : "";
                  return (
                    <li
                      key={u.user_id}
                      className="flex items-center gap-4 px-5 py-3 text-sm transition hover:bg-[color:color-mix(in_oklab,var(--aurora-lavender)_6%,transparent)]"
                    >
                      <span
                        className={`font-display flex size-9 items-center justify-center rounded-full text-xs font-bold ${rankClass || "bg-muted text-muted-foreground"}`}
                      >
                        {RankIcon ? <RankIcon className="size-4" /> : `#${i + 1}`}
                      </span>


                      <span className="flex-1 font-mono text-xs truncate">
                        {u.user_id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {u.messages} msgs
                      </span>
                      <span
                        className="font-display rounded-md px-2 py-0.5 text-xs font-bold"
                        style={{
                          background:
                            "color-mix(in oklab, var(--aurora-lavender) 25%, transparent)",
                        }}
                      >
                        Nv {u.level}
                      </span>
                      <span className="w-20 text-right font-mono text-xs">
                        {u.xp.toLocaleString("pt-BR")} XP
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}



function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
