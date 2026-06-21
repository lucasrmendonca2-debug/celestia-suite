import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Smile, Trash2, Sparkles } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  addReactionRole,
  listReactionRoles,
  removeReactionRole,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import {
  AuroraSection,
  AuroraStatCard,
  AuroraField,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute(
  "/_authenticated/dashboard/$slug/cargos-reacao",
)({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["rr", guildId],
      queryFn: () => listReactionRoles({ data: { guildId: guildId } }),
    });
    return { guildId, user };
  },
  component: ReactionRolesPage,
});

const MODE_LABEL: Record<string, string> = {
  toggle: "Toggle",
  add: "Apenas adicionar",
  remove: "Apenas remover",
  unique: "Único",
};

function ReactionRolesPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useLoaderData();
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

  const uniqueMessages = new Set((rows as any[]).map((r) => r.message_id)).size;

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Smile}
      title="Cargos por reação"
      description="Vincule emojis a cargos em mensagens específicas. Pura magia."
    >
      <div
        className="aurora-panel relative mb-5 overflow-hidden p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--aurora-peach) 18%, var(--card)), color-mix(in oklab, var(--aurora-pink) 14%, var(--card)))",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--aurora-peach) 70%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <Mascot variant={rows.length > 0 ? "celebrate" : "hero"} size={84} glow />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Reaja, receba, encante
            </h2>
            <p className="text-sm text-muted-foreground">
              {rows.length === 0
                ? "Crie sua primeira vinculação emoji → cargo."
                : `${rows.length} vinculaç${rows.length === 1 ? "ão" : "ões"} ativa${rows.length === 1 ? "" : "s"}.`}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <AuroraStatCard label="Reaction roles" value={rows.length} icon={Smile} tone="peach" />
        <AuroraStatCard label="Mensagens" value={uniqueMessages} icon={Sparkles} tone="pink" />
      </div>

      <div className="space-y-4">
        <AuroraSection title="Adicionar nova" icon={Plus} tone="peach">
          <div className="grid gap-3 sm:grid-cols-2">
            <AuroraField label="ID do canal">
              <Input
                value={form.channel_id}
                onChange={(e) => setForm({ ...form, channel_id: e.target.value.trim() })}
                placeholder="123456789012345678"
              />
            </AuroraField>
            <AuroraField label="ID da mensagem">
              <Input
                value={form.message_id}
                onChange={(e) => setForm({ ...form, message_id: e.target.value.trim() })}
                placeholder="123456789012345678"
              />
            </AuroraField>
            <AuroraField label="Emoji" hint="Unicode (🎉) ou customizado <:nome:id>">
              <Input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                placeholder="🎉"
              />
            </AuroraField>
            <AuroraField label="ID do cargo">
              <Input
                value={form.role_id}
                onChange={(e) => setForm({ ...form, role_id: e.target.value.trim() })}
                placeholder="123456789012345678"
              />
            </AuroraField>
            <AuroraField label="Modo">
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
            </AuroraField>
          </div>
          <div className="flex justify-end">
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
              Criar vinculação
            </Button>
          </div>
        </AuroraSection>

        <AuroraSection title="Vinculações ativas" icon={Smile} tone="pink">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Mascot variant="sleeping" size={72} />
              <p className="text-sm text-muted-foreground">
                Nada por aqui ainda. Crie a primeira acima.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {(rows as any[]).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3 transition hover:border-[color:color-mix(in_oklab,var(--aurora-peach)_45%,var(--border))]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 items-center justify-center rounded-xl text-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, color-mix(in oklab, var(--aurora-peach) 30%, transparent), color-mix(in oklab, var(--aurora-pink) 20%, transparent))",
                      }}
                    >
                      {r.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-sm">@{r.role_id}</p>
                      <p className="text-xs text-muted-foreground">
                        msg <span className="font-mono">{r.message_id}</span> ·{" "}
                        <span className="text-foreground/80">{MODE_LABEL[r.mode] ?? r.mode}</span>
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
        </AuroraSection>
      </div>
    </ModuleLayout>
  );
}
