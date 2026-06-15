import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Save, ScrollText } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { getLogsConfig, updateLogsConfig } from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/logs")({
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

const EVENT_GROUPS: { title: string; items: { key: string; label: string }[] }[] = [
  {
    title: "Membros",
    items: [
      { key: "member_join", label: "Entrada de membros" },
      { key: "member_leave", label: "Saída de membros" },
      { key: "member_ban", label: "Banimentos" },
      { key: "member_unban", label: "Desbanimentos" },
      { key: "member_kick", label: "Expulsões" },
      { key: "member_role_update", label: "Alteração de cargos" },
      { key: "member_nickname_update", label: "Alteração de apelido" },
    ],
  },
  {
    title: "Mensagens",
    items: [
      { key: "message_delete", label: "Mensagens deletadas" },
      { key: "message_edit", label: "Mensagens editadas" },
      { key: "message_bulk_delete", label: "Deleção em massa" },
    ],
  },
  {
    title: "Servidor",
    items: [
      { key: "channel_create", label: "Canal criado" },
      { key: "channel_delete", label: "Canal deletado" },
      { key: "channel_update", label: "Canal atualizado" },
      { key: "role_create", label: "Cargo criado" },
      { key: "role_delete", label: "Cargo deletado" },
      { key: "role_update", label: "Cargo atualizado" },
      { key: "voice_state_update", label: "Mudanças de voz" },
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

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={ScrollText}
      title="Logs avançados"
      description="Canal único para todos os eventos, com toggle individual."
      actions={
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="mr-1.5 size-4" />
          {mutation.isPending ? "Salvando…" : "Salvar"}
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <Label htmlFor="log_channel" className="text-sm font-medium">
            Canal de logs (ID)
          </Label>
          <Input
            id="log_channel"
            className="mt-2"
            placeholder="123456789012345678"
            value={(form.log_channel_id as string | null) ?? ""}
            onChange={(e) =>
              setForm({ ...form, log_channel_id: e.target.value.trim() || null })
            }
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Ative o modo desenvolvedor no Discord para copiar o ID.
          </p>
        </div>

        {EVENT_GROUPS.map((g) => (
          <div key={g.title} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">{g.title}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {g.items.map((it) => (
                <label
                  key={it.key}
                  className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm"
                >
                  <span>{it.label}</span>
                  <Switch
                    checked={!!form[it.key]}
                    onCheckedChange={(v) => setForm({ ...form, [it.key]: v })}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ModuleLayout>
  );
}
