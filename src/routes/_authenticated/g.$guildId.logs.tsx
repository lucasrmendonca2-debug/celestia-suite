import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Save, ScrollText, History, RefreshCw } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getLogsConfig,
  updateLogsConfig,
  listAuditLogs,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/g/$guildId/logs")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    const config = await context.queryClient.ensureQueryData({
      queryKey: ["logs", params.guildId],
      queryFn: () => getLogsConfig({ data: { guildId: params.guildId } }),
    });
    return { user, config };
  },
  component: LogsPage,
});

type Category = {
  key: string;
  label: string;
  channelKey: string;
  toggles: { key: string; label: string }[];
};

const CATEGORIES: Category[] = [
  {
    key: "message",
    label: "Mensagens",
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
    channelKey: "voice_channel_id",
    toggles: [{ key: "voice_state_update", label: "Join/leave/move" }],
  },
  {
    key: "server",
    label: "Servidor",
    channelKey: "server_channel_id",
    toggles: [
      { key: "server_update", label: "Servidor atualizado" },
      { key: "emoji_update", label: "Emojis" },
    ],
  },
  {
    key: "invite",
    label: "Convites",
    channelKey: "invite_channel_id",
    toggles: [
      { key: "invite_create", label: "Convite criado" },
      { key: "invite_delete", label: "Convite deletado" },
    ],
  },
  {
    key: "mod",
    label: "Moderação",
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
  const { guildId } = Route.useParams();
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
      <Tabs defaultValue="message" className="space-y-4">
        <TabsList className="flex w-full flex-wrap">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>
              {c.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="general">Geral & filtros</TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 size-3" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {CATEGORIES.map((c) => (
          <TabsContent key={c.key} value={c.key} className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <Label className="text-sm font-medium">Canal — {c.label}</Label>
              <Input
                className="mt-2"
                placeholder="ID do canal (vazio = usa canal global)"
                value={(form[c.channelKey] as string | null) ?? ""}
                onChange={(e) => set(c.channelKey, e.target.value.trim() || null)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Deixe vazio para usar o canal global em <b>Geral</b>.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Eventos</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {c.toggles.map((t) => (
                  <label
                    key={t.key}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span>{t.label}</span>
                    <Switch
                      checked={!!form[t.key]}
                      onCheckedChange={(v) => set(t.key, v)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}

        <TabsContent value="general" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Label className="text-sm font-medium">Canal global (fallback)</Label>
            <Input
              className="mt-2"
              placeholder="ID do canal"
              value={(form.log_channel_id as string | null) ?? ""}
              onChange={(e) => set("log_channel_id", e.target.value.trim() || null)}
            />
          </div>
          <IgnoreList label="Canais ignorados" k="ignored_channels" form={form} set={set} />
          <IgnoreList label="Cargos ignorados" k="ignored_roles" form={form} set={set} />
          <IgnoreList label="Usuários ignorados" k="ignored_users" form={form} set={set} />
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
  form,
  set,
}: {
  label: string;
  k: string;
  form: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  const list = (form[k] as string[] | undefined) ?? [];
  const [draft, setDraft] = useState("");
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="mt-2 flex gap-2">
        <Input
          placeholder="ID (snowflake)"
          value={draft}
          onChange={(e) => setDraft(e.target.value.trim())}
        />
        <Button
          variant="outline"
          onClick={() => {
            if (!/^\d{5,32}$/.test(draft)) return toast.error("ID inválido");
            if (list.includes(draft)) return;
            set(k, [...list, draft]);
            setDraft("");
          }}
        >
          Adicionar
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {list.length === 0 && (
          <span className="text-xs text-muted-foreground">Nenhum.</span>
        )}
        {list.map((id) => (
          <Badge
            key={id}
            variant="outline"
            className="cursor-pointer"
            onClick={() => set(k, list.filter((x) => x !== id))}
          >
            {id} ✕
          </Badge>
        ))}
      </div>
    </div>
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
    <div className="space-y-3">
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
      <div className="overflow-hidden rounded-xl border bg-card/40">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
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
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
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
                <td className="px-3 py-2 font-mono text-xs">
                  {r.channel_id ? `#${r.channel_id}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
