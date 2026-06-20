import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  addAutorole,
  listAutoroles,
  removeAutorole,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { RoleSelect } from "@/components/dashboard/selectors/RoleSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/g/$guildId/cargo-automatico")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["autoroles", params.guildId],
      queryFn: () => listAutoroles({ data: { guildId: params.guildId } }),
    });
    return { user };
  },
  component: AutorolePage,
});

function AutorolePage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useParams();
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

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={UserPlus}
      title="Autorole"
      description="Cargos atribuídos automaticamente a novos membros."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
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
            <Button
              onClick={() => add.mutate()}
              disabled={!roleId || add.isPending}
            >
              <Plus className="mr-1.5 size-4" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum cargo configurado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-mono text-sm">{r.role_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Aplicado a {r.target === "bot" ? "bots" : "membros"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove.mutate(r.id)}
                  >
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
