import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Trophy } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TRIGGER_LABELS: Record<string, string> = {
  manual: "Manual",
  messages_count: "Mensagens enviadas",
  level_reached: "Nível alcançado",
  reputation_received: "Reputação recebida",
  badges_collected: "Badges coletadas",
};

export const Route = createFileRoute("/_authenticated/g/$guildId/conquistas")({
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
  trigger_type: "manual" | "messages_count" | "level_reached" | "reputation_received" | "badges_collected";
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
      toast.success(form.id ? "Conquista atualizada." : "Conquista criada.");
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
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Lista */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Conquistas configuradas ({achievements.data?.length ?? 0})
          </h3>
          {achievements.data && achievements.data.length > 0 ? (
            <ul className="space-y-2">
              {achievements.data.map((a: any) => {
                const rewardBadge = badges.data?.find((b: any) => b.id === a.reward_badge_id);
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{a.emoji}</span>
                        <span className="font-semibold">{a.name}</span>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider">{a.code}</code>
                        {!a.active && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] uppercase text-amber-300">inativa</span>}
                        {a.hidden && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">oculta</span>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Gatilho: <b>{TRIGGER_LABELS[a.trigger_type]}</b>
                        {a.trigger_type !== "manual" && ` ≥ ${a.trigger_value}`}
                        {" · "}
                        Recompensa: {a.points}pt
                        {a.reward_coins > 0 && ` · 💰 ${a.reward_coins}`}
                        {a.reward_xp > 0 && ` · ✨ ${a.reward_xp} XP`}
                        {rewardBadge && ` · 🏅 ${rewardBadge.name}`}
                      </p>
                      {a.description && <p className="mt-1 text-sm">{a.description}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" onClick={() => setForm({ ...a, reward_badge_id: a.reward_badge_id ?? "" })}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => delM.mutate(a.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma conquista ainda. Crie a primeira ao lado!
            </p>
          )}
        </section>

        {/* Form */}
        <aside className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {form.id ? "Editar conquista" : "Nova conquista"}
          </h3>
          <div className="space-y-3">
            <Field label="Código"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="first_100_messages" /></Field>
            <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Descrição"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Emoji"><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></Field>
              <Field label="Pontos"><Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Tipo de gatilho">
              <Select value={form.trigger_type} onValueChange={(v: any) => setForm({ ...form, trigger_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {form.trigger_type !== "manual" && (
              <Field label="Valor mínimo do gatilho">
                <Input type="number" value={form.trigger_value} onChange={(e) => setForm({ ...form, trigger_value: Number(e.target.value) })} />
              </Field>
            )}
            <Field label="Badge de recompensa (opcional)">
              <Select value={form.reward_badge_id || "none"} onValueChange={(v) => setForm({ ...form, reward_badge_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— nenhuma —</SelectItem>
                  {(badges.data ?? []).map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.emoji} {b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Moedas"><Input type="number" value={form.reward_coins} onChange={(e) => setForm({ ...form, reward_coins: Number(e.target.value) })} /></Field>
              <Field label="XP extra"><Input type="number" value={form.reward_xp} onChange={(e) => setForm({ ...form, reward_xp: Number(e.target.value) })} /></Field>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/30 px-3 py-2">
                <span className="text-sm">Oculta até desbloquear</span>
                <Switch checked={form.hidden} onCheckedChange={(v) => setForm({ ...form, hidden: v })} />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/30 px-3 py-2">
                <span className="text-sm">Ativa</span>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveM.mutate()} disabled={!form.code || !form.name || saveM.isPending} className="flex-1">
                <Plus className="mr-2 size-4" /> {form.id ? "Salvar alterações" : "Criar conquista"}
              </Button>
              {form.id && <Button variant="outline" onClick={() => setForm(EMPTY)}>Cancelar</Button>}
            </div>
          </div>
        </aside>
      </div>
    </ModuleLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
