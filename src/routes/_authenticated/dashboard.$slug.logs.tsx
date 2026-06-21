import { createFileRoute, notFound } from "@tanstack/react-router";
import { DashboardErrorBoundary, DashboardNotFound } from "@/components/dashboard/RouteBoundaries";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Save,
  ScrollText,
  History,
  RefreshCw,
  Activity,
  Hash,
  ShieldOff,
  MessageSquare,
  Users,
  Tag,
  Volume2,
  Server,
  Link2,
  ShieldAlert,
} from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getLogsConfig,
  updateLogsConfig,
  listAuditLogs,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import {
  AuroraSection,
  AuroraStatCard,
  AuroraField,
  AuroraSwitchRow,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";
import { ChannelSelect } from "@/components/dashboard/selectors/ChannelSelect";
import { RoleSelect } from "@/components/dashboard/selectors/RoleSelect";
import { ChannelBadge, RoleBadge } from "@/components/dashboard/DiscordBadges";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/logs")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    const config = await context.queryClient.ensureQueryData({
      queryKey: ["logs", guildId],
      queryFn: () => getLogsConfig({ data: { guildId: guildId } }),
    });
    return { guildId, user, config };
  },
  component: LogsPage,
  errorComponent: ({ error, reset }) => <DashboardErrorBoundary error={error as Error} reset={reset} />,
  notFoundComponent: () => <DashboardNotFound />,
});

type Tone = "lavender" | "pink" | "cyan" | "mint" | "peach";

type Category = {
  key: string;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  channelKey: string;
  toggles: { key: string; label: string }[];
};

const CATEGORIES: Category[] = [
  {
    key: "message",
    label: "Mensagens",
    icon: MessageSquare,
    tone: "lavender",
    channelKey: "message_channel_id",
    toggles: [
      { key: "message_delete", label: "Mensagem deletada" },
      { key: "message_edit", label: "Mensagem editada" },
      { key: "message_bulk_delete", label: "Deleção em massa" },
    ],
  },
  {
    key: "member",
    label: "Membros",
    icon: Users,
    tone: "pink",
    channelKey: "member_channel_id",
    toggles: [
      { key: "member_join", label: "Entrada" },
      { key: "member_leave", label: "Saída" },
      { key: "member_role_update", label: "Cargos alterados" },
      { key: "member_nickname_update", label: "Apelido alterado" },
      { key: "member_timeout", label: "Timeout" },
      { key: "user_update", label: "Avatar/nome" },
    ],
  },
  {
    key: "role",
    label: "Cargos",
    icon: Tag,
    tone: "peach",
    channelKey: "role_channel_id",
    toggles: [
      { key: "role_create", label: "Cargo criado" },
      { key: "role_update", label: "Cargo atualizado" },
      { key: "role_delete", label: "Cargo deletado" },
    ],
  },
  {
    key: "channel",
    label: "Canais",
    icon: Hash,
    tone: "cyan",
    channelKey: "channel_channel_id",
    toggles: [
      { key: "channel_create", label: "Canal criado" },
      { key: "channel_update", label: "Canal renomeado" },
      { key: "channel_delete", label: "Canal deletado" },
    ],
  },
  {
    key: "voice",
    label: "Voz",
    icon: Volume2,
    tone: "mint",
    channelKey: "voice_channel_id",
    toggles: [{ key: "voice_state_update", label: "Join/leave/move" }],
  },
  {
    key: "server",
    label: "Servidor",
    icon: Server,
    tone: "lavender",
    channelKey: "server_channel_id",
    toggles: [
      { key: "server_update", label: "Servidor atualizado" },
      { key: "emoji_update", label: "Emojis" },
    ],
  },
  {
    key: "invite",
    label: "Convites",
    icon: Link2,
    tone: "pink",
    channelKey: "invite_channel_id",
    toggles: [
      { key: "invite_create", label: "Convite criado" },
      { key: "invite_delete", label: "Convite deletado" },
    ],
  },
  {
    key: "mod",
    label: "Moderação",
    icon: ShieldAlert,
    tone: "peach",
    channelKey: "mod_channel_id",
    toggles: [
      { key: "member_ban", label: "Ban" },
      { key: "member_unban", label: "Unban" },
      { key: "member_kick", label: "Kick" },
    ],
  },
];

function LogsPage() {
  const { user, config } = Route.useLoaderData();
  const { guildId } = Route.useLoaderData();
  const updateFn = useServerFn(updateLogsConfig);
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, unknown>>(config as Record<string, unknown>);

  const mutation = useMutation({
    mutationFn: () => updateFn({ data: { ...form, guildId } as never }),
    onSuccess: (saved) => {
      setForm(saved as Record<string, unknown>);
      qc.setQueryData(["logs", guildId], saved);
      toast.success("Logs atualizados.");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const enabledCount = useMemo(
    () =>
      CATEGORIES.flatMap((c) => c.toggles).filter((t) => !!form[t.key]).length,
    [form],
  );
  const channelsCount = useMemo(
    () => CATEGORIES.filter((c) => !!form[c.channelKey]).length,
    [form],
  );
  const hasGlobal = !!form.log_channel_id;

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={ScrollText}
      title="Logs do servidor"
      description="Audite tudo: mensagens, membros, cargos, canais, voz, convites e moderação."
      actions={
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="mr-1.5 size-4" />
          {mutation.isPending ? "Salvando…" : "Salvar"}
        </Button>
      }
    >
      <div
        className="aurora-panel relative mb-5 overflow-hidden p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--aurora-lavender) 18%, var(--card)), color-mix(in oklab, var(--aurora-cyan) 14%, var(--card)))",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--aurora-lavender) 70%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <Mascot variant={hasGlobal ? "celebrate" : "error"} size={84} glow />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Tudo que acontece, registrado
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasGlobal
                ? `Canal global configurado, ${enabledCount} evento${enabledCount === 1 ? "" : "s"} ativo${enabledCount === 1 ? "" : "s"}.`
                : "Configure um canal global no fim para começar a auditar."}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <AuroraStatCard
          label="Eventos ativos"
          value={enabledCount}
          icon={Activity}
          tone="mint"
        />
        <AuroraStatCard
          label="Canais dedicados"
          value={channelsCount}
          icon={Hash}
          tone="cyan"
        />
        <AuroraStatCard
          label="Canal global"
          value={hasGlobal ? "Ok" : "—"}
          icon={hasGlobal ? Server : ShieldOff}
          tone={hasGlobal ? "lavender" : "peach"}
        />
      </div>

      <Tabs defaultValue="message" className="space-y-4">
        <TabsList className="flex w-full flex-wrap">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>
              <c.icon className="mr-1.5 size-3.5" />
              {c.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="general">Geral & filtros</TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1.5 size-3.5" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {CATEGORIES.map((c) => (
          <TabsContent key={c.key} value={c.key} className="space-y-4">
            <AuroraSection
              title={`Canal — ${c.label}`}
              icon={c.icon}
              tone={c.tone}
              description="Deixe vazio para cair no canal global."
            >
              <AuroraField label="Canal de destino">
                <ChannelSelect
                  guildId={guildId}
                  value={(form[c.channelKey] as string | null) ?? null}
                  onChange={(v) => set(c.channelKey, v)}
                  placeholder="Usar canal global"
                />
              </AuroraField>
            </AuroraSection>
            <AuroraSection title="Eventos" icon={Activity} tone={c.tone}>
              <div className="grid gap-2 sm:grid-cols-2">
                {c.toggles.map((t) => (
                  <AuroraSwitchRow
                    key={t.key}
                    label={t.label}
                    checked={!!form[t.key]}
                    onChange={(v) => set(t.key, v)}
                  />
                ))}
              </div>
            </AuroraSection>
          </TabsContent>
        ))}

        <TabsContent value="general" className="space-y-4">
          <AuroraSection title="Canal global (fallback)" icon={Server} tone="lavender">
            <AuroraField label="Canal de destino">
              <ChannelSelect
                guildId={guildId}
                value={(form.log_channel_id as string | null) ?? null}
                onChange={(v) => set("log_channel_id", v)}
                placeholder="Selecione um canal"
              />
            </AuroraField>
          </AuroraSection>
          <IgnoreList
            label="Canais ignorados"
            tone="cyan"
            icon={Hash}
            k="ignored_channels"
            kind="channel"
            guildId={guildId}
            form={form}
            set={set}
          />
          <IgnoreList
            label="Cargos ignorados"
            tone="peach"
            icon={Tag}
            k="ignored_roles"
            kind="role"
            guildId={guildId}
            form={form}
            set={set}
          />
          <IgnoreList
            label="Usuários ignorados"
            tone="pink"
            icon={Users}
            k="ignored_users"
            kind="user"
            guildId={guildId}
            form={form}
            set={set}
          />
        </TabsContent>

        <TabsContent value="history">
          <HistoryView guildId={guildId} />
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}

function IgnoreList({
  label,
  k,
  kind,
  guildId,
  form,
  set,
  icon,
  tone,
}: {
  label: string;
  k: string;
  kind: "channel" | "role" | "user";
  guildId: string;
  form: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
  icon: LucideIcon;
  tone: Tone;
}) {
  const list = (form[k] as string[] | undefined) ?? [];
  const [draft, setDraft] = useState<string>("");

  const add = (id: string | null) => {
    if (!id || !/^\d{5,32}$/.test(id)) return toast.error("ID inválido");
    if (list.includes(id)) return;
    set(k, [...list, id]);
    setDraft("");
  };
  const remove = (id: string) => set(k, list.filter((x) => x !== id));

  return (
    <AuroraSection title={label} icon={icon} tone={tone}>
      <div className="flex gap-2">
        {kind === "channel" ? (
          <div className="flex-1">
            <ChannelSelect
              guildId={guildId}
              value={draft || null}
              onChange={(v) => add(v)}
              placeholder="Selecione um canal para ignorar"
            />
          </div>
        ) : kind === "role" ? (
          <div className="flex-1">
            <RoleSelect
              guildId={guildId}
              value={draft || null}
              onChange={(v) => add(v)}
              placeholder="Selecione um cargo para ignorar"
            />
          </div>
        ) : (
          <>
            <Input
              placeholder="ID do usuário"
              value={draft}
              onChange={(e) => setDraft(e.target.value.trim())}
            />
            <Button variant="outline" onClick={() => add(draft)}>
              Adicionar
            </Button>
          </>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {list.length === 0 && (
          <span className="text-xs text-muted-foreground">Nenhum.</span>
        )}
        {list.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => remove(id)}
            className="group inline-flex items-center gap-1 rounded-md border border-border bg-background/40 px-1.5 py-0.5 transition hover:border-destructive/60 hover:bg-destructive/10"
            title="Remover"
          >
            {kind === "channel" ? (
              <ChannelBadge guildId={guildId} channelId={id} />
            ) : kind === "role" ? (
              <RoleBadge guildId={guildId} roleId={id} />
            ) : (
              <span className="font-mono text-xs">{id}</span>
            )}
            <span className="text-xs text-muted-foreground group-hover:text-destructive">
              ✕
            </span>
          </button>
        ))}
      </div>
    </AuroraSection>
  );
}

function HistoryView({ guildId }: { guildId: string }) {
  const fn = useServerFn(listAuditLogs);
  const [category, setCategory] = useState("");
  const [actor, setActor] = useState("");
  const [target, setTarget] = useState("");

  const q = useQuery({
    queryKey: ["audit-logs", guildId, category, actor, target],
    queryFn: () =>
      fn({
        data: {
          guildId,
          category: category || null,
          actorId: /^\d{5,32}$/.test(actor) ? actor : null,
          targetId: /^\d{5,32}$/.test(target) ? target : null,
          limit: 200,
        },
      }),
  });

  const rows = q.data ?? [];

  return (
    <AuroraSection title="Histórico de auditoria" icon={History} tone="lavender">
      <div className="grid gap-2 sm:grid-cols-4">
        <Input
          placeholder="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value.trim())}
        />
        <Input
          placeholder="ID do autor"
          value={actor}
          onChange={(e) => setActor(e.target.value.trim())}
        />
        <Input
          placeholder="ID do alvo"
          value={target}
          onChange={(e) => setTarget(e.target.value.trim())}
        />
        <Button variant="outline" onClick={() => q.refetch()} disabled={q.isFetching}>
          <RefreshCw className={`mr-1 size-4 ${q.isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card/40">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="bg-[color:color-mix(in_oklab,var(--aurora-lavender)_10%,transparent)] text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Quando</th>
              <th className="px-3 py-2 text-left">Categoria</th>
              <th className="px-3 py-2 text-left">Evento</th>
              <th className="px-3 py-2 text-left">Autor</th>
              <th className="px-3 py-2 text-left">Alvo</th>
              <th className="px-3 py-2 text-left">Canal</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !q.isLoading && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Mascot variant="sleeping" size={56} />
                    <span className="text-sm text-muted-foreground">
                      Nenhum registro encontrado.
                    </span>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-border/60 transition hover:bg-[color:color-mix(in_oklab,var(--aurora-lavender)_8%,transparent)]"
              >
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{r.category}</Badge>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.event}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {r.actor_tag ?? r.actor_id ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {r.target_tag ?? r.target_id ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {r.channel_id ? (
                    <ChannelBadge guildId={guildId} channelId={r.channel_id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuroraSection>
  );
}
