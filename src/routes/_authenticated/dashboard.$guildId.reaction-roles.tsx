import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Smile, Trash2 } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  addReactionRole,
  listReactionRoles,
  removeReactionRole,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute(
  "/_authenticated/dashboard/$guildId/reaction-roles",
)({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["rr", params.guildId],
      queryFn: () => listReactionRoles({ data: { guildId: params.guildId } }),
    });
    return { user };
  },
  component: ReactionRolesPage,
});

function ReactionRolesPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const qc = useQueryClient();
  const { data: rows } = useSuspenseQuery({
    queryKey: ["rr", guildId],
    queryFn: () => listReactionRoles({ data: { guildId } }),
  });
  const addFn = useServerFn(addReactionRole);
  const removeFn = useServerFn(removeReactionRole);

  const [form, setForm] = useState({
    channel_id: "",
    message_id: "",
    emoji: "",
    role_id: "",
    mode: "toggle" as "toggle" | "add" | "remove" | "unique",
  });

  const add = useMutation({
    mutationFn: () => addFn({ data: { guildId, ...form } }),
    onSuccess: () => {
      setForm({ channel_id: "", message_id: "", emoji: "", role_id: "", mode: "toggle" });
      qc.invalidateQueries({ queryKey: ["rr", guildId] });
      toast.success("Reaction role criada.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { guildId, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rr", guildId] }),
  });

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Smile}
      title="Cargos por reação"
      description="Vincule emojis a cargos numa mensagem específica."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Adicionar</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ID do canal">
              <Input
                value={form.channel_id}
                onChange={(e) => setForm({ ...form, channel_id: e.target.value.trim() })}
              />
            </Field>
            <Field label="ID da mensagem">
              <Input
                value={form.message_id}
                onChange={(e) => setForm({ ...form, message_id: e.target.value.trim() })}
              />
            </Field>
            <Field label="Emoji (unicode ou <:nome:id>)">
              <Input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              />
            </Field>
            <Field label="ID do cargo">
              <Input
                value={form.role_id}
                onChange={(e) => setForm({ ...form, role_id: e.target.value.trim() })}
              />
            </Field>
            <Field label="Modo">
              <Select
                value={form.mode}
                onValueChange={(v) => setForm({ ...form, mode: v as typeof form.mode })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toggle">Toggle (pega/tira)</SelectItem>
                  <SelectItem value="add">Apenas adicionar</SelectItem>
                  <SelectItem value="remove">Apenas remover</SelectItem>
                  <SelectItem value="unique">Único (só um da mensagem)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => add.mutate()}
              disabled={
                add.isPending ||
                !form.channel_id ||
                !form.message_id ||
                !form.emoji ||
                !form.role_id
              }
            >
              <Plus className="mr-1.5 size-4" />
              Criar
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma reaction role configurada.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.emoji}</span>
                    <div>
                      <p className="font-mono text-sm">{r.role_id}</p>
                      <p className="text-xs text-muted-foreground">
                        msg {r.message_id} · modo {r.mode}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
