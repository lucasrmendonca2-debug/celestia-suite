import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  useQuery,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Shield, Trash2, Plus, History } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  DASHBOARD_AREAS,
  AREA_LABELS,
  listDashboardPermissions,
  upsertDashboardPermission,
  removeDashboardPermission,
  listAuditLog,
  type DashboardArea,
  type DashboardPermissionRow,
} from "@/lib/guild/permissions.functions";
import { listGuildRoles } from "@/lib/guild/discord-resources.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RoleSelect } from "@/components/dashboard/selectors/RoleSelect";

type AreaKey = DashboardArea | "all";

const PRESETS: { id: string; label: string; areas: AreaKey[] }[] = [
  { id: "owner", label: "Owner", areas: ["all"] },
  {
    id: "admin",
    label: "Admin",
    areas: [...DASHBOARD_AREAS],
  },
  {
    id: "mod",
    label: "Moderador",
    areas: ["overview", "moderation", "automod", "logs"],
  },
  {
    id: "support",
    label: "Suporte",
    areas: ["overview", "tickets", "logs"],
  },
  {
    id: "community",
    label: "Comunidade",
    areas: ["overview", "welcome", "embeds", "community", "leveling", "economy"],
  },
  { id: "viewer", label: "Viewer", areas: ["overview"] },
];

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/permissoes")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["dashboard-perms", params.guildId],
      queryFn: () => listDashboardPermissions({ data: { guildId: params.guildId } }),
    });
    return { user };
  },
  component: PermissionsPage,
});

function PermissionsPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const qc = useQueryClient();

  const { data: rows } = useSuspenseQuery({
    queryKey: ["dashboard-perms", guildId],
    queryFn: () => listDashboardPermissions({ data: { guildId } }),
  });

  const rolesQuery = useQuery({
    queryKey: ["guild-roles", guildId],
    queryFn: () => listGuildRoles({ data: { guildId } }),
    staleTime: 60_000,
  });

  const audit = useQuery({
    queryKey: ["dashboard-audit", guildId],
    queryFn: () => listAuditLog({ data: { guildId, limit: 50 } }),
    staleTime: 30_000,
  });

  const upsertFn = useServerFn(upsertDashboardPermission);
  const removeFn = useServerFn(removeDashboardPermission);

  const upsert = useMutation({
    mutationFn: (vars: { roleId: string; areas: AreaKey[] }) =>
      upsertFn({ data: { guildId, ...vars } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-perms", guildId] });
      qc.invalidateQueries({ queryKey: ["dashboard-audit", guildId] });
      toast.success("Permissão salva.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (roleId: string) => removeFn({ data: { guildId, roleId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-perms", guildId] });
      qc.invalidateQueries({ queryKey: ["dashboard-audit", guildId] });
      toast.success("Cargo removido.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const rolesById = useMemo(
    () => new Map((rolesQuery.data ?? []).map((r) => [r.id, r])),
    [rolesQuery.data],
  );

  const [adding, setAdding] = useState<string | null>(null);

  const toggleArea = (row: DashboardPermissionRow, area: AreaKey) => {
    const set = new Set(row.areas as AreaKey[]);
    if (set.has(area)) set.delete(area);
    else set.add(area);
    upsert.mutate({ roleId: row.role_id, areas: [...set] });
  };

  const applyPreset = (row: DashboardPermissionRow, areas: AreaKey[]) => {
    upsert.mutate({ roleId: row.role_id, areas });
  };

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Shield}
      title="Permissões"
      description="Controle quais cargos acessam quais áreas do dashboard."
    >
      <div className="space-y-6">
        {/* Adicionar cargo */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Adicionar cargo</h2>
              <p className="text-xs text-muted-foreground">
                Sem regras configuradas, qualquer manager (MANAGE_GUILD) acessa tudo.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <RoleSelect
                guildId={guildId}
                value={adding}
                onChange={setAdding}
                excludeManaged
                placeholder="Selecionar cargo"
              />
            </div>
            <Button
              onClick={() => {
                if (!adding) return;
                if (rows.some((r) => r.role_id === adding)) {
                  toast.info("Esse cargo já está na lista.");
                  return;
                }
                upsert.mutate({ roleId: adding, areas: ["overview"] });
                setAdding(null);
              }}
              disabled={!adding || upsert.isPending}
            >
              <Plus className="mr-1.5 size-4" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Matrix */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Cargos configurados</h2>
            <p className="text-xs text-muted-foreground">
              Marque as áreas que cada cargo pode acessar. "Tudo" libera todas.
            </p>
          </div>
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nenhum cargo configurado. Modo aberto pra managers.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((row) => {
                const role = rolesById.get(row.role_id);
                const areasSet = new Set(row.areas as AreaKey[]);
                const all = areasSet.has("all");
                return (
                  <li key={row.id} className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full"
                          style={{
                            backgroundColor: role
                              ? `#${role.color.toString(16).padStart(6, "0")}`
                              : "#99aab5",
                          }}
                        />
                        <span className="font-medium">
                          {role?.name ?? `Cargo ${row.role_id}`}
                        </span>
                        {all && (
                          <Badge variant="default" className="text-[10px]">
                            Acesso total
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {PRESETS.map((p) => (
                          <Button
                            key={p.id}
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => applyPreset(row, p.areas)}
                            disabled={upsert.isPending}
                          >
                            {p.label}
                          </Button>
                        ))}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => remove.mutate(row.role_id)}
                          disabled={remove.isPending}
                          aria-label="Remover"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background/40 px-2 py-1.5 text-xs">
                        <Checkbox
                          checked={all}
                          onCheckedChange={() => toggleArea(row, "all")}
                        />
                        <span className="font-medium">Tudo</span>
                      </label>
                      {DASHBOARD_AREAS.map((a) => (
                        <label
                          key={a}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background/40 px-2 py-1.5 text-xs"
                        >
                          <Checkbox
                            checked={all || areasSet.has(a)}
                            disabled={all}
                            onCheckedChange={() => toggleArea(row, a)}
                          />
                          <span>{AREA_LABELS[a]}</span>
                        </label>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Audit log */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <History className="size-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold">Auditoria</h2>
              <p className="text-xs text-muted-foreground">
                Últimas 50 ações feitas pelo dashboard.
              </p>
            </div>
          </div>
          {!audit.data || audit.data.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Sem registros ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {audit.data.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="font-mono text-xs text-primary">
                        {entry.event}
                      </span>{" "}
                      <span className="text-muted-foreground">por</span>{" "}
                      <span className="font-medium">
                        {entry.actor_tag ?? entry.actor_id ?? "—"}
                      </span>
                      {entry.target_id && (
                        <>
                          {" "}
                          <span className="text-muted-foreground">→</span>{" "}
                          <span className="font-mono text-xs">
                            {rolesById.get(entry.target_id)?.name ?? entry.target_id}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
