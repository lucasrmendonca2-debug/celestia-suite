import { useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield,
  Save,
  AlertCircle,
  Activity,
  Power,
  Gavel,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getModerationConfig,
  getModerationStats,
  updateModerationConfig,
} from "@/lib/guild/moderation.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChannelPicker,
  RolePicker,
  MultiRolePicker,
} from "@/components/dashboard/tickets/DiscordPickers";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/moderation")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    const [config, stats] = await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["moderation-config", params.guildId],
        queryFn: () => getModerationConfig({ data: { guildId: params.guildId } }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["moderation-stats", params.guildId],
        queryFn: () => getModerationStats({ data: { guildId: params.guildId } }),
      }),
    ]);
    return { user, config, stats };
  },
  errorComponent: ({ error }) => (
    <div className="p-8">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="size-4" /> {error.message}
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-muted-foreground">Servidor não encontrado.</div>
  ),
  component: ModerationPage,
});

const TABS = [
  { value: "general", label: "Geral" },
  { value: "permissions", label: "Permissões" },
  { value: "punishments", label: "Punições" },
  { value: "automod", label: "AutoMod" },
  { value: "antispam", label: "Anti-Spam" },
  { value: "antilink", label: "Anti-Link" },
  { value: "blacklist", label: "Blacklist" },
  { value: "logs", label: "Logs" },
  { value: "history", label: "Histórico" },
  { value: "appearance", label: "Aparência" },
] as const;

function ModerationPage() {
  const { user, config, stats } = Route.useLoaderData();
  const { guildId } = Route.useParams();

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Shield}
      title="Sistema de Moderação"
      description="Painel completo. Permissões, punições, AutoMod e histórico — tudo lido em tempo real pelo bot."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Punições totais"
          value={stats.total}
          icon={Gavel}
          accent="from-red-500/20 to-rose-500/10 text-rose-300"
        />
        <StatCard
          label="Punições ativas"
          value={stats.active}
          icon={Activity}
          accent="from-amber-500/20 to-orange-500/10 text-amber-300"
        />
        <StatCard
          label="Warns ativos"
          value={stats.activeWarnings}
          icon={AlertTriangle}
          accent="from-violet-500/20 to-fuchsia-500/10 text-violet-300"
        />
      </div>

      <Tabs defaultValue="general" className="mt-6">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/40 p-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <GeneralTab guildId={guildId} initial={config} />
        </TabsContent>

        {(["permissions", "punishments", "automod", "antispam", "antilink", "blacklist", "logs", "history", "appearance"] as const).map(
          (v) => (
            <TabsContent key={v} value={v} className="mt-4">
              <SoonCard
                title={TABS.find((t) => t.value === v)?.label ?? v}
                description="Em construção. Esta aba será liberada nas próximas fases do sistema de moderação."
              />
            </TabsContent>
          ),
        )}
      </Tabs>
    </ModuleLayout>
  );
}

/* ---------------- helpers ---------------- */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: typeof Activity;
  accent: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 ${accent}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
        <Icon className="size-5 opacity-80" />
      </div>
    </div>
  );
}

function SoonCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border bg-card/50 p-8 text-center">
      <Sparkles className="mx-auto mb-3 size-6 text-violet-400" />
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card/50 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PickerField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SwitchRow({
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
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-background/40 p-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function emptyToNull(v: string | null | undefined) {
  if (!v) return null;
  const t = v.trim();
  return t.length ? t : null;
}

/* ---------------- General tab ---------------- */

function GeneralTab({
  guildId,
  initial,
}: {
  guildId: string;
  initial: Awaited<ReturnType<typeof getModerationConfig>>;
}) {
  const update = useServerFn(updateModerationConfig);
  const qc = useQueryClient();
  const [form, setForm] = useState(initial);

  const mutation = useMutation({
    mutationFn: () =>
      update({
        data: {
          guildId,
          enabled: form.enabled,
          log_channel_id: emptyToNull(form.log_channel_id),
          mute_role_id: emptyToNull(form.mute_role_id),
          max_warnings: Number(form.max_warnings) || 3,
          default_warn_punishment: form.default_warn_punishment,
          default_warn_punishment_duration:
            Number(form.default_warn_punishment_duration) || 3600,
          default_mute_duration: Number(form.default_mute_duration) || 600,
          allow_temporary_ban: form.allow_temporary_ban,
          allow_temporary_mute: form.allow_temporary_mute,
          delete_punished_messages: form.delete_punished_messages,
          dm_punished_user: form.dm_punished_user,
          punishment_dm_template: form.punishment_dm_template,
          protected_role_ids: form.protected_role_ids ?? [],
          protected_user_ids: form.protected_user_ids ?? [],
          embed_color: Number(form.embed_color) || 15548997,
          embed_footer: form.embed_footer,
          embed_icon_url: emptyToNull(form.embed_icon_url),
          enabled_log_events: form.enabled_log_events ?? [],
        },
      }),
    onSuccess: () => {
      toast.success("Configuração de moderação salva!");
      qc.invalidateQueries({ queryKey: ["moderation-config", guildId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <SectionCard title="Ligar / Desligar">
        <SwitchRow
          label="Sistema de moderação ativado"
          hint="Quando desligado, comandos de moderação ficam inativos."
          checked={form.enabled}
          onChange={(v) => setForm({ ...form, enabled: v })}
        />
      </SectionCard>

      <SectionCard title="Canais e cargos">
        <PickerField
          label="Canal de logs"
          hint="Recebe todas as ações de moderação e eventos do AutoMod."
        >
          <ChannelPicker
            guildId={guildId}
            value={form.log_channel_id}
            onChange={(v) => setForm({ ...form, log_channel_id: v })}
            types={[0, 5]}
            placeholder="Selecione o canal de logs"
          />
        </PickerField>
        <PickerField
          label="Cargo de mute (opcional)"
          hint="Quando vazio, o bot usa o timeout nativo do Discord (até 28 dias)."
        >
          <RolePicker
            guildId={guildId}
            value={form.mute_role_id}
            onChange={(v) => setForm({ ...form, mute_role_id: v })}
          />
        </PickerField>
      </SectionCard>

      <SectionCard title="Proteção">
        <PickerField
          label="Cargos protegidos"
          hint="Membros com esses cargos nunca podem ser punidos."
        >
          <MultiRolePicker
            guildId={guildId}
            value={form.protected_role_ids ?? []}
            onChange={(v) => setForm({ ...form, protected_role_ids: v })}
          />
        </PickerField>
      </SectionCard>

      <SectionCard title="Punições temporárias">
        <SwitchRow
          label="Permitir mute temporário"
          checked={form.allow_temporary_mute}
          onChange={(v) => setForm({ ...form, allow_temporary_mute: v })}
        />
        <SwitchRow
          label="Permitir ban temporário"
          checked={form.allow_temporary_ban}
          onChange={(v) => setForm({ ...form, allow_temporary_ban: v })}
        />
        <SwitchRow
          label="Apagar mensagens recentes ao punir"
          hint="Quando ativado, alguns comandos (ban/kick) podem apagar mensagens do alvo."
          checked={form.delete_punished_messages}
          onChange={(v) => setForm({ ...form, delete_punished_messages: v })}
        />
      </SectionCard>

      <SectionCard title="Mensagem privada ao punido">
        <SwitchRow
          label="Enviar DM ao usuário punido"
          checked={form.dm_punished_user}
          onChange={(v) => setForm({ ...form, dm_punished_user: v })}
        />
        <div>
          <Label className="text-sm">Modelo da DM</Label>
          <Textarea
            className="mt-1 font-mono text-xs"
            rows={4}
            value={form.punishment_dm_template}
            onChange={(e) =>
              setForm({ ...form, punishment_dm_template: e.target.value })
            }
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Variáveis: {"{action}"}, {"{guild}"}, {"{reason}"}, {"{duration}"},{" "}
            {"{moderator}"}
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Advertências">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-sm">Máximo de advertências</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={form.max_warnings}
              onChange={(e) =>
                setForm({ ...form, max_warnings: Number(e.target.value) || 1 })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Ação ao atingir o limite</Label>
            <Select
              value={form.default_warn_punishment}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  default_warn_punishment: v as typeof form.default_warn_punishment,
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="mute">Mute permanente</SelectItem>
                <SelectItem value="temp_mute">Mute temporário</SelectItem>
                <SelectItem value="kick">Expulsar</SelectItem>
                <SelectItem value="ban">Banir</SelectItem>
                <SelectItem value="temp_ban">Banir temporariamente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Duração padrão (segundos) — punição auto</Label>
            <Input
              type="number"
              min={60}
              value={form.default_warn_punishment_duration}
              onChange={(e) =>
                setForm({
                  ...form,
                  default_warn_punishment_duration: Number(e.target.value) || 3600,
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Duração padrão do /mute (segundos)</Label>
            <Input
              type="number"
              min={60}
              value={form.default_mute_duration}
              onChange={(e) =>
                setForm({
                  ...form,
                  default_mute_duration: Number(e.target.value) || 600,
                })
              }
              className="mt-1"
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          size="lg"
        >
          {mutation.isPending ? (
            <>
              <Power className="mr-2 size-4 animate-pulse" /> Salvando…
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" /> Salvar configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
