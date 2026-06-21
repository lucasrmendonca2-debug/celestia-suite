import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus, Bot, Users } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  addAutorole,
  listAutoroles,
  removeAutorole,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { Button } from "@/components/ui/button";
import { RoleSelect } from "@/components/dashboard/selectors/RoleSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuroraSection, AuroraStatCard } from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/cargo-automatico")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["autoroles", guildId],
      queryFn: () => listAutoroles({ data: { guildId: guildId } }),
    });
    return { guildId, user };
  },
  component: AutorolePage,
});

function AutorolePage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: rows } = useSuspenseQuery({
    queryKey: ["autoroles", guildId],
    queryFn: () => listAutoroles({ data: { guildId } }),
  });
  const addFn = useServerFn(addAutorole);
  const removeFn = useServerFn(removeAutorole);
  const [roleId, setRoleId] = useState("");
  const [target, setTarget] = useState<"member" | "bot">("member");

  const add = useMutation({
    mutationFn: () => addFn({ data: { guildId, roleId, target } }),
    onSuccess: () => {
      setRoleId("");
      qc.invalidateQueries({ queryKey: ["autoroles", guildId] });
      toast.success("Cargo adicionado.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { guildId, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autoroles", guildId] }),
  });

  const memberRoles = (rows as any[]).filter((r) => r.target !== "bot");
  const botRoles = (rows as any[]).filter((r) => r.target === "bot");

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={UserPlus}
      title="Autorole"
      description="Cargos atribuídos automaticamente a novos membros ou bots."
    >
      <div className="aurora-panel relative mb-6 flex items-center gap-4 overflow-hidden p-5">
        <div className="aurora-float">
          <Mascot variant="celebrate" size={76} glow />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Boas-vindas com cargo automático 🎀
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sempre que alguém entrar, esses cargos são aplicados na hora. Sem comandos, sem complicação.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <AuroraStatCard label="Para membros" value={memberRoles.length} icon={Users} tone="lavender" />
        <AuroraStatCard label="Para bots" value={botRoles.length} icon={Bot} tone="cyan" />
      </div>

      <div className="space-y-5">
        <AuroraSection title="Adicionar cargo" icon={Plus} tone="mint">
          <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
            <RoleSelect
              guildId={guildId}
              value={roleId || null}
              onChange={(id) => setRoleId(id ?? "")}
              excludeManaged
              placeholder="Selecionar cargo"
            />
            <Select value={target} onValueChange={(v) => setTarget(v as "member" | "bot")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membros</SelectItem>
                <SelectItem value="bot">Bots</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => add.mutate()} disabled={!roleId || add.isPending}>
              <Plus className="mr-1.5 size-4" /> Adicionar
            </Button>
          </div>
        </AuroraSection>

        <AuroraSection title={`Cargos configurados (${rows.length})`} icon={UserPlus} tone="pink">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <Mascot variant="sleeping" size={64} />
              <p className="text-sm text-muted-foreground">
                Nenhum cargo configurado. Adicione o primeiro acima!
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(rows as any[]).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-3 transition first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-9 items-center justify-center rounded-xl"
                      style={{
                        background: `color-mix(in oklab, var(--aurora-${r.target === "bot" ? "cyan" : "lavender"}) 25%, transparent)`,
                      }}
                    >
                      {r.target === "bot" ? <Bot className="size-4" /> : <Users className="size-4" />}
                    </span>
                    <div>
                      <p className="font-mono text-sm">{r.role_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.target === "bot" ? "Aplicado a bots" : "Aplicado a membros"}
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
