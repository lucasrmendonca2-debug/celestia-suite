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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/leveling")({
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
      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas ({rewards.length})</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-4 space-y-4">
          <Card>
            <Row
              label="Ativar sistema de XP"
              checked={form.enabled}
              onChange={(v) => setForm({ ...form, enabled: v })}
            />
          </Card>

          <Card>
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
          </Card>

          <Card>
            <Label className="text-sm font-medium">Canal de level up</Label>
            <Input
              className="mt-2"
              placeholder="ID do canal (vazio = mesmo canal da msg)"
              value={form.level_up_channel_id ?? ""}
              onChange={(e) =>
                setForm({ ...form, level_up_channel_id: e.target.value.trim() || null })
              }
            />
            <Label className="mt-4 block text-sm font-medium">
              Mensagem de level up
            </Label>
            <Textarea
              rows={3}
              className="mt-2"
              value={form.level_up_message}
              onChange={(e) => setForm({ ...form, level_up_message: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Variáveis: <code className="rounded bg-muted px-1">{"{user}"}</code>{" "}
              <code className="rounded bg-muted px-1">{"{level}"}</code>{" "}
              <code className="rounded bg-muted px-1">{"{xp}"}</code>
            </p>
            <div className="mt-4">
              <Row
                label="Enviar também por DM"
                checked={form.level_up_dm}
                onChange={(v) => setForm({ ...form, level_up_dm: v })}
              />
            </div>
          </Card>

          <Card>
            <Label className="text-sm font-medium">Canais sem XP (IDs)</Label>
            <Textarea
              rows={2}
              className="mt-2"
              value={(form.no_xp_channels ?? []).join("\n")}
              onChange={(e) =>
                setForm({ ...form, no_xp_channels: parseList(e.target.value) })
              }
            />
            <Label className="mt-4 block text-sm font-medium">
              Cargos sem XP (IDs)
            </Label>
            <Textarea
              rows={2}
              className="mt-2"
              value={(form.no_xp_roles ?? []).join("\n")}
              onChange={(e) =>
                setForm({ ...form, no_xp_roles: parseList(e.target.value) })
              }
            />
          </Card>

          <Card>
            <Row
              label="Acumular cargos de nível"
              hint="Quando ligado, membro mantém todos os cargos ganhos. Senão, só o mais alto."
              checked={form.stack_rewards}
              onChange={(v) => setForm({ ...form, stack_rewards: v })}
            />
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-4 space-y-4">
          <Card>
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
          </Card>
          <div className="rounded-2xl border border-border bg-card">
            {rewards.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma recompensa.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {(rewards as any[]).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-4">
                      <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
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
          <div className="rounded-2xl border border-border bg-card">
            {(lb as any[]).length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Sem dados ainda.
              </p>
            ) : (
              <ol className="divide-y divide-border">
                {(lb as any[]).map((u, i) => (
                  <li
                    key={u.user_id}
                    className="flex items-center gap-4 px-5 py-3 text-sm"
                  >
                    <span className="w-8 text-center font-semibold text-muted-foreground">
                      #{i + 1}
                    </span>
                    <span className="flex-1 font-mono text-xs">{u.user_id}</span>
                    <span className="text-xs text-muted-foreground">
                      {u.messages} msgs
                    </span>
                    <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                      Nv {u.level}
                    </span>
                    <span className="w-20 text-right font-mono text-xs">
                      {u.xp.toLocaleString("pt-BR")} XP
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5">{children}</div>;
}
function Row({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
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
