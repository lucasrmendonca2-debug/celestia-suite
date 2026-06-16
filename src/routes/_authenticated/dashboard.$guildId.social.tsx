import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Sparkles, Trash2, Trophy, User } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  addSocialReward,
  getLevelConfig,
  getMyProfile,
  getSocialConfig,
  getSocialLeaderboard,
  getSocialLogs,
  listSocialRewards,
  removeSocialReward,
  updateLevelConfig,
  updateMyProfile,
  updateSocialConfig,
} from "@/lib/guild/social.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/social")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    const [social, level] = await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["social-config", params.guildId],
        queryFn: () => getSocialConfig({ data: { guildId: params.guildId } }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["level-config", params.guildId],
        queryFn: () => getLevelConfig({ data: { guildId: params.guildId } }),
      }),
    ]);
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["social-rewards", params.guildId],
        queryFn: () => listSocialRewards({ data: { guildId: params.guildId } }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["social-lb", params.guildId],
        queryFn: () => getSocialLeaderboard({ data: { guildId: params.guildId } }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["social-logs", params.guildId],
        queryFn: () => getSocialLogs({ data: { guildId: params.guildId } }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["my-profile", params.guildId],
        queryFn: () => getMyProfile({ data: { guildId: params.guildId } }),
      }),
    ]);
    return { user, social, level };
  },
  component: SocialPage,
});

function parseList(s: string): string[] {
  return s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
}

function SocialPage() {
  const { user, social, level } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const qc = useQueryClient();

  const updSocial = useServerFn(updateSocialConfig);
  const updLevel = useServerFn(updateLevelConfig);
  const addReward = useServerFn(addSocialReward);
  const delReward = useServerFn(removeSocialReward);

  const [s, setS] = useState<any>(social);
  const [l, setL] = useState<any>(level);
  const [newReward, setNewReward] = useState({
    level: 5,
    reward_type: "role" as "role" | "coins" | "badge" | "title",
    reward_value: "",
    remove_previous_roles: false,
  });

  const rewards = useSuspenseQuery({
    queryKey: ["social-rewards", guildId],
    queryFn: () => listSocialRewards({ data: { guildId } }),
  });
  const lb = useSuspenseQuery({
    queryKey: ["social-lb", guildId],
    queryFn: () => getSocialLeaderboard({ data: { guildId } }),
  });
  const logs = useSuspenseQuery({
    queryKey: ["social-logs", guildId],
    queryFn: () => getSocialLogs({ data: { guildId } }),
  });
  const myProfile = useSuspenseQuery({
    queryKey: ["my-profile", guildId],
    queryFn: () => getMyProfile({ data: { guildId } }),
  });

  const updMyProfile = useServerFn(updateMyProfile);
  const [mp, setMp] = useState<any>(myProfile.data);

  const saveMyProfile = useMutation({
    mutationFn: () =>
      updMyProfile({
        data: {
          guildId,
          accent_color: mp.accent_color || null,
          background_color: mp.background_color || null,
          text_color: mp.text_color || null,
          card_style: (mp.card_style as "default" | "minimal" | "gradient") ?? "default",
        },
      }),
    onSuccess: () => {
      toast.success("Seu card foi atualizado.");
      qc.invalidateQueries({ queryKey: ["my-profile", guildId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });

  const saveSocial = useMutation({
    mutationFn: () =>
      updSocial({
        data: {
          guildId,
          enabled: s.enabled,
          level_enabled: s.level_enabled,
          profile_enabled: s.profile_enabled,
          reputation_enabled: s.reputation_enabled,
          achievements_enabled: s.achievements_enabled,
          log_channel_id: s.log_channel_id || null,
          ignored_channel_ids: typeof s.ignored_channel_ids === "string"
            ? parseList(s.ignored_channel_ids)
            : s.ignored_channel_ids ?? [],
          ignored_role_ids: typeof s.ignored_role_ids === "string"
            ? parseList(s.ignored_role_ids)
            : s.ignored_role_ids ?? [],
          embed_color: s.embed_color,
          card_accent_color: s.card_accent_color ?? "#5865F2",
          card_background_color: s.card_background_color ?? "#0f1117",
          card_text_color: s.card_text_color ?? "#ffffff",
          card_style: (s.card_style as "default" | "minimal" | "gradient") ?? "default",
        },
      }),
    onSuccess: () => {
      toast.success("Configurações gerais salvas.");
      qc.invalidateQueries({ queryKey: ["social-config", guildId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });

  const saveLevel = useMutation({
    mutationFn: () =>
      updLevel({
        data: {
          guildId,
          enabled: l.enabled,
          min_xp_per_message: Number(l.min_xp_per_message),
          max_xp_per_message: Number(l.max_xp_per_message),
          cooldown_seconds: Number(l.cooldown_seconds),
          global_multiplier: Number(l.global_multiplier),
          vip_multiplier: Number(l.vip_multiplier),
          level_up_channel_id: l.level_up_channel_id || null,
          level_up_message: l.level_up_message,
          send_level_up_message: l.send_level_up_message,
          level_up_message_mode: l.level_up_message_mode,
          delete_level_up_after_seconds: Number(l.delete_level_up_after_seconds),
          min_message_length: Number(l.min_message_length),
        },
      }),
    onSuccess: () => {
      toast.success("XP & Level salvos.");
      qc.invalidateQueries({ queryKey: ["level-config", guildId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });

  const addRewardM = useMutation({
    mutationFn: () =>
      addReward({
        data: {
          guildId,
          level: Number(newReward.level),
          reward_type: newReward.reward_type,
          reward_value: newReward.reward_value,
          remove_previous_roles: newReward.remove_previous_roles,
          active: true,
        },
      }),
    onSuccess: () => {
      toast.success("Recompensa criada.");
      setNewReward({ level: 5, reward_type: "role", reward_value: "", remove_previous_roles: false });
      qc.invalidateQueries({ queryKey: ["social-rewards", guildId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro."),
  });

  const delRewardM = useMutation({
    mutationFn: (id: string) => delReward({ data: { guildId, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-rewards", guildId] }),
  });

  const ignoredChannelsStr = Array.isArray(s.ignored_channel_ids)
    ? s.ignored_channel_ids.join(", ")
    : s.ignored_channel_ids ?? "";
  const ignoredRolesStr = Array.isArray(s.ignored_role_ids)
    ? s.ignored_role_ids.join(", ")
    : s.ignored_role_ids ?? "";

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Sparkles}
      title="Social & Level"
      description="XP por mensagem, perfis sociais, reputação e recompensas. Tudo conectado ao banco."
    >
      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-xl bg-card p-1">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="xp">XP & Level</TabsTrigger>
          <TabsTrigger value="card">Card visual</TabsTrigger>
          <TabsTrigger value="meu-card">Meu card</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* GERAL */}
        <TabsContent value="geral" className="space-y-4">
          <Card title="Módulos">
            <Row label="Sistema social ativado">
              <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
            </Row>
            <Row label="Level (XP por mensagem)">
              <Switch checked={s.level_enabled} onCheckedChange={(v) => setS({ ...s, level_enabled: v })} />
            </Row>
            <Row label="Perfil social">
              <Switch checked={s.profile_enabled} onCheckedChange={(v) => setS({ ...s, profile_enabled: v })} />
            </Row>
            <Row label="Reputação">
              <Switch checked={s.reputation_enabled} onCheckedChange={(v) => setS({ ...s, reputation_enabled: v })} />
            </Row>
            <Row label="Conquistas (Pass 2)">
              <Switch checked={s.achievements_enabled} onCheckedChange={(v) => setS({ ...s, achievements_enabled: v })} />
            </Row>
          </Card>

          <Card title="Listas de ignorados">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Canais ignorados (IDs separados por vírgula)</Label>
                <Textarea
                  value={ignoredChannelsStr}
                  onChange={(e) => setS({ ...s, ignored_channel_ids: e.target.value })}
                  placeholder="123456789012345678, 234567..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Cargos ignorados (IDs separados por vírgula)</Label>
                <Textarea
                  value={ignoredRolesStr}
                  onChange={(e) => setS({ ...s, ignored_role_ids: e.target.value })}
                  placeholder="123456789012345678"
                  rows={3}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Canal de logs</Label>
                <Input
                  value={s.log_channel_id ?? ""}
                  onChange={(e) => setS({ ...s, log_channel_id: e.target.value })}
                  placeholder="ID do canal"
                />
              </div>
              <div>
                <Label>Cor dos embeds</Label>
                <Input
                  value={s.embed_color}
                  onChange={(e) => setS({ ...s, embed_color: e.target.value })}
                  placeholder="#5865F2"
                />
              </div>
            </div>
          </Card>

          <SaveBar onClick={() => saveSocial.mutate()} loading={saveSocial.isPending} />
        </TabsContent>

        {/* XP & LEVEL */}
        <TabsContent value="xp" className="space-y-4">
          <Card title="Ganho de XP">
            <Row label="Level ativado">
              <Switch checked={l.enabled} onCheckedChange={(v) => setL({ ...l, enabled: v })} />
            </Row>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="XP mínimo por mensagem">
                <Input type="number" value={l.min_xp_per_message} onChange={(e) => setL({ ...l, min_xp_per_message: e.target.value })} />
              </Field>
              <Field label="XP máximo por mensagem">
                <Input type="number" value={l.max_xp_per_message} onChange={(e) => setL({ ...l, max_xp_per_message: e.target.value })} />
              </Field>
              <Field label="Cooldown (segundos)">
                <Input type="number" value={l.cooldown_seconds} onChange={(e) => setL({ ...l, cooldown_seconds: e.target.value })} />
              </Field>
              <Field label="Multiplicador global">
                <Input type="number" step="0.1" value={l.global_multiplier} onChange={(e) => setL({ ...l, global_multiplier: e.target.value })} />
              </Field>
              <Field label="Multiplicador VIP">
                <Input type="number" step="0.1" value={l.vip_multiplier} onChange={(e) => setL({ ...l, vip_multiplier: e.target.value })} />
              </Field>
              <Field label="Tamanho mínimo da mensagem">
                <Input type="number" value={l.min_message_length} onChange={(e) => setL({ ...l, min_message_length: e.target.value })} />
              </Field>
            </div>
          </Card>

          <Card title="Anúncio de level up">
            <Row label="Enviar mensagem ao subir de nível">
              <Switch checked={l.send_level_up_message} onCheckedChange={(v) => setL({ ...l, send_level_up_message: v })} />
            </Row>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Modo">
                <Select value={l.level_up_message_mode} onValueChange={(v) => setL({ ...l, level_up_message_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_channel">Canal atual</SelectItem>
                    <SelectItem value="fixed_channel">Canal fixo</SelectItem>
                    <SelectItem value="dm">Mensagem privada</SelectItem>
                    <SelectItem value="disabled">Desativado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Canal fixo (ID)">
                <Input
                  value={l.level_up_channel_id ?? ""}
                  onChange={(e) => setL({ ...l, level_up_channel_id: e.target.value })}
                  placeholder="ID do canal"
                  disabled={l.level_up_message_mode !== "fixed_channel"}
                />
              </Field>
              <Field label="Apagar mensagem após (s) — 0 desativa">
                <Input type="number" value={l.delete_level_up_after_seconds} onChange={(e) => setL({ ...l, delete_level_up_after_seconds: e.target.value })} />
              </Field>
            </div>
            <Field label="Mensagem ({user}, {level}, {server})">
              <Textarea value={l.level_up_message} onChange={(e) => setL({ ...l, level_up_message: e.target.value })} rows={3} />
            </Field>
          </Card>

          <SaveBar onClick={() => saveLevel.mutate()} loading={saveLevel.isPending} />
        </TabsContent>

        {/* CARD VISUAL — defaults do rank card por servidor */}
        <TabsContent value="card" className="space-y-4">
          <Card title="Padrão visual do rank card">
            <p className="text-sm text-muted-foreground mb-4">
              Estas cores e estilo são aplicados quando o membro ainda não personalizou seu próprio rank card.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Cor de destaque (accent)">
                <div className="flex gap-2 items-center">
                  <Input type="color" value={s.card_accent_color ?? "#5865F2"}
                    onChange={(e) => setS({ ...s, card_accent_color: e.target.value })}
                    className="h-10 w-16 p-1" />
                  <Input value={s.card_accent_color ?? "#5865F2"}
                    onChange={(e) => setS({ ...s, card_accent_color: e.target.value })} className="font-mono" />
                </div>
              </Field>
              <Field label="Cor de fundo">
                <div className="flex gap-2 items-center">
                  <Input type="color" value={s.card_background_color ?? "#0f1117"}
                    onChange={(e) => setS({ ...s, card_background_color: e.target.value })}
                    className="h-10 w-16 p-1" />
                  <Input value={s.card_background_color ?? "#0f1117"}
                    onChange={(e) => setS({ ...s, card_background_color: e.target.value })} className="font-mono" />
                </div>
              </Field>
              <Field label="Cor do texto">
                <div className="flex gap-2 items-center">
                  <Input type="color" value={s.card_text_color ?? "#ffffff"}
                    onChange={(e) => setS({ ...s, card_text_color: e.target.value })}
                    className="h-10 w-16 p-1" />
                  <Input value={s.card_text_color ?? "#ffffff"}
                    onChange={(e) => setS({ ...s, card_text_color: e.target.value })} className="font-mono" />
                </div>
              </Field>
              <Field label="Estilo do card">
                <select
                  value={s.card_style ?? "default"}
                  onChange={(e) => setS({ ...s, card_style: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="default">Padrão — gradient na barra, overlay médio</option>
                  <option value="minimal">Minimal — borda fina, sem gradient</option>
                  <option value="gradient">Gradient — fundo dégradé com accent</option>
                </select>
              </Field>
            </div>

            {/* Preview */}
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Pré-visualização</p>
              <RankCardPreview
                accent={s.card_accent_color ?? "#5865F2"}
                background={s.card_background_color ?? "#0f1117"}
                text={s.card_text_color ?? "#ffffff"}
                style={(s.card_style as "default" | "minimal" | "gradient") ?? "default"}
              />
            </div>
          </Card>

          <SaveBar onClick={() => saveSocial.mutate()} loading={saveSocial.isPending} />
        </TabsContent>


        <TabsContent value="rewards" className="space-y-4">
          <Card title="Nova recompensa">
            <div className="grid gap-4 md:grid-cols-5">
              <Field label="Nível">
                <Input type="number" value={newReward.level} onChange={(e) => setNewReward({ ...newReward, level: Number(e.target.value) })} />
              </Field>
              <Field label="Tipo">
                <Select value={newReward.reward_type} onValueChange={(v: any) => setNewReward({ ...newReward, reward_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">Cargo</SelectItem>
                    <SelectItem value="coins">Moedas</SelectItem>
                    <SelectItem value="badge">Badge (pass 2)</SelectItem>
                    <SelectItem value="title">Título</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={newReward.reward_type === "role" ? "ID do cargo" : newReward.reward_type === "coins" ? "Quantidade" : "Valor"}>
                <Input value={newReward.reward_value} onChange={(e) => setNewReward({ ...newReward, reward_value: e.target.value })} />
              </Field>
              <Field label="Remover anteriores">
                <Switch checked={newReward.remove_previous_roles} onCheckedChange={(v) => setNewReward({ ...newReward, remove_previous_roles: v })} />
              </Field>
              <div className="flex items-end">
                <Button onClick={() => addRewardM.mutate()} disabled={addRewardM.isPending || !newReward.reward_value}>
                  <Plus className="mr-2 size-4" /> Adicionar
                </Button>
              </div>
            </div>
          </Card>

          <Card title={`Recompensas configuradas (${rewards.data?.length ?? 0})`}>
            {rewards.data && rewards.data.length > 0 ? (
              <ul className="space-y-2">
                {rewards.data.map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between rounded-md border border-border bg-background/40 p-3 text-sm">
                    <div>
                      <span className="font-semibold">Nível {r.level}</span> ·{" "}
                      <span className="text-muted-foreground">{r.reward_type}</span> ·{" "}
                      <code className="rounded bg-muted px-1 py-0.5">{r.reward_value}</code>
                      {r.remove_previous_roles && <span className="ml-2 text-xs text-amber-400">substitui anteriores</span>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => delRewardM.mutate(r.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma recompensa cadastrada ainda.</p>
            )}
          </Card>
        </TabsContent>

        {/* LEADERBOARD */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card title="Top 50 — Mais XP no servidor">
            {lb.data && lb.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="p-2">#</th><th className="p-2">Usuário</th><th className="p-2">Nível</th><th className="p-2">XP total</th><th className="p-2">Mensagens</th></tr>
                  </thead>
                  <tbody>
                    {lb.data.map((r: any, i: number) => (
                      <tr key={r.user_id} className="border-t border-border/40">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2 font-medium">{r.username ?? r.user_id}</td>
                        <td className="p-2">{r.level}</td>
                        <td className="p-2">{Number(r.total_xp).toLocaleString("pt-BR")}</td>
                        <td className="p-2 text-muted-foreground">{r.messages_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <Trophy className="size-10 opacity-40" />
                <p>Ninguém ganhou XP ainda. Mande seu pessoal conversar!</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* LOGS */}
        <TabsContent value="logs" className="space-y-4">
          <Card title="Últimas 50 ações">
            {logs.data && logs.data.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {logs.data.map((log: any) => (
                  <li key={log.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 bg-background/40 px-3 py-2">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{log.action}</code>
                    <span>user <code>{log.user_id}</code></span>
                    {log.level != null && <span>· nível <b>{log.level}</b></span>}
                    {log.amount != null && <span>· {log.amount > 0 ? "+" : ""}{log.amount} XP</span>}
                    <span className="ml-auto text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sem registros ainda.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border/40 bg-background/30 px-3 py-2">
      <span className="text-sm">{label}</span>
      {children}
    </div>
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

function SaveBar({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="sticky bottom-4 z-10 flex justify-end">
      <Button onClick={onClick} disabled={loading} size="lg" className="shadow-lg">
        <Save className="mr-2 size-4" /> {loading ? "Salvando..." : "Salvar alterações"}
      </Button>
    </div>
  );
}

function RankCardPreview({
  accent,
  background,
  text,
  style,
}: {
  accent: string;
  background: string;
  text: string;
  style: "default" | "minimal" | "gradient";
}) {
  const muted = text + "99";
  const bgStyle =
    style === "gradient"
      ? { background: `linear-gradient(90deg, ${background} 0%, ${accent}55 100%)` }
      : { background };
  const border = style === "minimal" ? `1px solid ${accent}88` : "none";
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-5 shadow-inner"
      style={{ ...bgStyle, border, color: text, minHeight: 140 }}
    >
      <div
        className="size-20 rounded-full shrink-0"
        style={{ background: accent, boxShadow: `0 0 0 3px ${accent}` }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="font-bold text-lg truncate" style={{ color: text }}>
              Nome do membro
            </div>
            <div className="text-sm truncate" style={{ color: muted }}>
              Título personalizado
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs uppercase" style={{ color: muted }}>Rank #1</div>
            <div className="font-bold text-2xl leading-none" style={{ color: accent }}>LVL 42</div>
          </div>
        </div>
        <div className="mt-3">
          <div
            className="h-3 w-full rounded-full overflow-hidden"
            style={{ background: text + "14" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: "65%",
                background:
                  style === "minimal" ? accent : `linear-gradient(90deg, ${accent}, ${text})`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs" style={{ color: muted }}>
            <span>650 / 1.000 XP</span>
            <span>Total 12.350 XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
