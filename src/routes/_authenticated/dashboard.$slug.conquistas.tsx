import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Trophy, Eye, EyeOff } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  deleteAchievement,
  listAchievements,
  listBadges,
  upsertAchievement,
} from "@/lib/guild/badges.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AuroraSection,
  AuroraStatCard,
  AuroraSwitchRow,
  AuroraField,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";

const TRIGGER_LABELS: Record<string, string> = {
  manual: "Manual",
  messages_count: "Mensagens enviadas",
  level_reached: "Nível alcançado",
  reputation_received: "Reputação recebida",
  badges_collected: "Badges coletadas",
};

export const Route = createFileRoute("/_authenticated/dashboard/$slug/conquistas")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["achievements", params.guildId],
        queryFn: () => listAchievements({ data: { guildId: params.guildId } }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["badges", params.guildId],
        queryFn: () => listBadges({ data: { guildId: params.guildId } }),
      }),
    ]);
    return { user };
  },
  component: AchievementsPage,
});

interface AForm {
  id?: string;
  code: string;
  name: string;
  description: string;
  emoji: string;
  points: number;
  trigger_type:
    | "manual"
    | "messages_count"
    | "level_reached"
    | "reputation_received"
    | "badges_collected";
  trigger_value: number;
  reward_badge_id: string;
  reward_coins: number;
  reward_xp: number;
  hidden: boolean;
  active: boolean;
}

const EMPTY: AForm = {
  code: "",
  name: "",
  description: "",
  emoji: "🏆",
  points: 10,
  trigger_type: "messages_count",
  trigger_value: 100,
  reward_badge_id: "",
  reward_coins: 0,
  reward_xp: 0,
  hidden: false,
  active: true,
};

function AchievementsPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const qc = useQueryClient();

  const save = useServerFn(upsertAchievement);
  const del = useServerFn(deleteAchievement);

  const [form, setForm] = useState<AForm>(EMPTY);

  const achievements = useSuspenseQuery({
    queryKey: ["achievements", guildId],
    queryFn: () => listAchievements({ data: { guildId } }),
  });
  const badges = useSuspenseQuery({
    queryKey: ["badges", guildId],
    queryFn: () => listBadges({ data: { guildId } }),
  });

  const list = (achievements.data as any[]) ?? [];
  const activeCount = list.filter((a) => a.active).length;
  const totalPoints = list.reduce((sum, a) => sum + (a.points ?? 0), 0);

  const saveM = useMutation({
    mutationFn: () =>
      save({
        data: {
          guildId,
          id: form.id,
          code: form.code,
          name: form.name,
          description: form.description,
          emoji: form.emoji,
          points: Number(form.points),
          trigger_type: form.trigger_type,
          trigger_value: Number(form.trigger_value),
          reward_badge_id: form.reward_badge_id || null,
          reward_coins: Number(form.reward_coins),
          reward_xp: Number(form.reward_xp),
          hidden: form.hidden,
          active: form.active,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Conquista atualizada. ✨" : "Conquista criada. 🏆");
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ["achievements", guildId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro."),
  });

  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { guildId, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["achievements", guildId] }),
  });

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Trophy}
      title="Conquistas"
      description="Defina metas automáticas (XP, mensagens, reputação) ou conquistas manuais. Recompense com badges, moedas e XP."
    >
      <div className="aurora-panel relative mb-6 flex items-center gap-4 overflow-hidden p-5">
        <div className="aurora-float">
          <Mascot variant="celebrate" size={80} glow />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Transforme cada milestone em uma comemoração 🎉
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie conquistas que se desbloqueiam sozinhas. O bot avisa o membro no chat e entrega a recompensa.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AuroraStatCard label="Conquistas" value={list.length} icon={Trophy} tone="peach" />
        <AuroraStatCard label="Ativas" value={activeCount} icon={Eye} tone="mint" />
        <AuroraStatCard label="Pontos totais" value={totalPoints} icon={Trophy} tone="lavender" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Lista */}
        <AuroraSection
          title={`Configuradas (${list.length})`}
          icon={Trophy}
          tone="peach"
        >
          {list.length > 0 ? (
            <ul className="space-y-2">
              {list.map((a: any) => {
                const rewardBadge = (badges.data as any[])?.find(
                  (b) => b.id === a.reward_badge_id,
                );
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-3 transition hover:border-[color:color-mix(in_oklab,var(--aurora-peach)_50%,var(--border))]"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                        style={{
                          background:
                            "linear-gradient(135deg, color-mix(in oklab, var(--aurora-peach) 35%, transparent), color-mix(in oklab, var(--aurora-pink) 25%, transparent))",
                          boxShadow:
                            "inset 0 1px 0 color-mix(in oklab, white 30%, transparent)",
                        }}
                      >
                        {a.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-semibold">{a.name}</span>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                            {a.code}
                          </code>
                          {!a.active && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] uppercase text-amber-300">
                              inativa
                            </span>
                          )}
                          {a.hidden && (
                            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px]">
                              <EyeOff className="size-2.5" /> oculta
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {TRIGGER_LABELS[a.trigger_type]}
                          {a.trigger_type !== "manual" && ` ≥ ${a.trigger_value}`}
                          {" · "}
                          {a.points}pt
                          {a.reward_coins > 0 && ` · 💰 ${a.reward_coins}`}
                          {a.reward_xp > 0 && ` · ✨ ${a.reward_xp} XP`}
                          {rewardBadge && ` · 🏅 ${rewardBadge.name}`}
                        </p>
                        {a.description && (
                          <p className="mt-1 text-sm">{a.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setForm({
                            ...a,
                            reward_badge_id: a.reward_badge_id ?? "",
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => delM.mutate(a.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <Mascot variant="sleeping" size={72} />
              <p className="text-sm text-muted-foreground">
                Nenhuma conquista ainda. Crie a primeira ao lado!
              </p>
            </div>
          )}
        </AuroraSection>

        {/* Form */}
        <AuroraSection
          title={form.id ? "Editar conquista" : "Nova conquista"}
          icon={Plus}
          tone="lavender"
        >
          <AuroraField label="Código">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="first_100_messages"
              className="font-mono text-xs"
            />
          </AuroraField>
          <AuroraField label="Nome">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </AuroraField>
          <AuroraField label="Descrição">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </AuroraField>
          <div className="grid grid-cols-2 gap-3">
            <AuroraField label="Emoji">
              <Input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="text-center text-lg"
              />
            </AuroraField>
            <AuroraField label="Pontos">
              <Input
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
              />
            </AuroraField>
          </div>
          <AuroraField label="Tipo de gatilho">
            <Select
              value={form.trigger_type}
              onValueChange={(v: any) => setForm({ ...form, trigger_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AuroraField>
          {form.trigger_type !== "manual" && (
            <AuroraField label="Valor mínimo do gatilho">
              <Input
                type="number"
                value={form.trigger_value}
                onChange={(e) =>
                  setForm({ ...form, trigger_value: Number(e.target.value) })
                }
              />
            </AuroraField>
          )}
          <AuroraField label="Badge de recompensa (opcional)">
            <Select
              value={form.reward_badge_id || "none"}
              onValueChange={(v) =>
                setForm({ ...form, reward_badge_id: v === "none" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— nenhuma —</SelectItem>
                {((badges.data as any[]) ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.emoji} {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AuroraField>
          <div className="grid grid-cols-2 gap-3">
            <AuroraField label="Moedas">
              <Input
                type="number"
                value={form.reward_coins}
                onChange={(e) =>
                  setForm({ ...form, reward_coins: Number(e.target.value) })
                }
              />
            </AuroraField>
            <AuroraField label="XP extra">
              <Input
                type="number"
                value={form.reward_xp}
                onChange={(e) =>
                  setForm({ ...form, reward_xp: Number(e.target.value) })
                }
              />
            </AuroraField>
          </div>
          <AuroraSwitchRow
            label="Oculta até desbloquear"
            checked={form.hidden}
            onChange={(v) => setForm({ ...form, hidden: v })}
          />
          <AuroraSwitchRow
            label="Ativa"
            checked={form.active}
            onChange={(v) => setForm({ ...form, active: v })}
          />
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => saveM.mutate()}
              disabled={!form.code || !form.name || saveM.isPending}
              className="flex-1"
            >
              <Plus className="mr-2 size-4" />{" "}
              {form.id ? "Salvar alterações" : "Criar conquista"}
            </Button>
            {form.id && (
              <Button variant="outline" onClick={() => setForm(EMPTY)}>
                Cancelar
              </Button>
            )}
          </div>
        </AuroraSection>
      </div>
    </ModuleLayout>
  );
}
