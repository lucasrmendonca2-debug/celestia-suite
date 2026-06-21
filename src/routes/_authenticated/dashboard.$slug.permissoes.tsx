import { createFileRoute, notFound } from "@tanstack/react-router";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { useServerFn } from "@tanstack/react-start";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  useQuery,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Shield, Trash2, Plus, History, KeyRound, Users } from "lucide-react";
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
import {
  AuroraSection,
  AuroraStatCard,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RoleSelect } from "@/components/dashboard/selectors/RoleSelect";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";

type AreaKey = DashboardArea | "all";

const PRESETS: { id: string; label: string; areas: AreaKey[] }[] = [
  { id: "owner", label: "Owner", areas: ["all"] },
  { id: "admin", label: "Admin", areas: [...DASHBOARD_AREAS] },
  { id: "mod", label: "Moderador", areas: ["overview", "moderation", "automod", "logs"] },
  { id: "support", label: "Suporte", areas: ["overview", "tickets", "logs"] },
  { id: "community", label: "Comunidade", areas: ["overview", "welcome", "embeds", "community", "leveling", "economy"] },
  { id: "viewer", label: "Viewer", areas: ["overview"] },
];

export const Route = createFileRoute("/_authenticated/dashboard/$slug/permissoes")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["dashboard-perms", guildId],
      queryFn: () => listDashboardPermissions({ data: { guildId: guildId } }),
    });
    return { guildId, user };
  },
  component: PermissionsPage,
});

function PermissionsPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useLoaderData();
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

  const fullAccess = rows.filter((r) => (r.areas as AreaKey[]).includes("all")).length;

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Shield}
      title="Permissões"
      description="Controle quais cargos acessam quais áreas do dashboard mágico."
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
          <Mascot variant={rows.length > 0 ? "hero" : "sleeping"} size={84} glow />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Cofre de permissões
            </h2>
            <p className="text-sm text-muted-foreground">
              {rows.length === 0
                ? "Sem regras configuradas — qualquer manager (MANAGE_GUILD) acessa tudo."
                : `${rows.length} cargo${rows.length === 1 ? "" : "s"} com acessos personalizados.`}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <AuroraStatCard label="Cargos" value={rows.length} icon={Users} tone="lavender" />
        <AuroraStatCard label="Acesso total" value={fullAccess} icon={KeyRound} tone="peach" />
        <AuroraStatCard label="Áreas" value={DASHBOARD_AREAS.length} icon={Shield} tone="cyan" />
      </div>

      <div className="space-y-5">
        <AuroraSection title="Adicionar cargo" icon={Plus} tone="cyan">
          <div className="flex flex-col gap-2 sm:flex-row">
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
        </AuroraSection>

        <AuroraSection title={`Cargos configurados (${rows.length})`} icon={Shield} tone="lavender">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
              <Mascot variant="sleeping" size={72} />
              <p className="mt-3 text-sm text-muted-foreground">
                Nenhum cargo configurado. Modo aberto pra managers.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => {
                const role = rolesById.get(row.role_id);
                const areasSet = new Set(row.areas as AreaKey[]);
                const all = areasSet.has("all");
                return (
                  <li
                    key={row.id}
                    className="aurora-card-hover rounded-2xl border border-border/60 p-4"
                    style={{
                      background: all
                        ? "linear-gradient(135deg, color-mix(in oklab, var(--aurora-peach) 14%, var(--card)), color-mix(in oklab, var(--aurora-pink) 8%, var(--card)))"
                        : "color-mix(in oklab, var(--card) 80%, transparent)",
                    }}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full ring-2 ring-background"
                          style={{
                            backgroundColor: role
                              ? `#${role.color.toString(16).padStart(6, "0")}`
                              : "#99aab5",
                          }}
                        />
                        <span className="font-display font-semibold">
                          {role?.name ?? `Cargo ${row.role_id}`}
                        </span>
                        {all && (
                          <Badge className="border-[color:var(--aurora-peach)]/40 bg-[color:color-mix(in_oklab,var(--aurora-peach)_25%,transparent)] text-foreground">
                            <KeyRound className="mr-1 size-3" /> Acesso total
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
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-2 py-1.5 text-xs transition hover:border-[color:color-mix(in_oklab,var(--aurora-lavender)_40%,var(--border))]">
                        <Checkbox
                          checked={all}
                          onCheckedChange={() => toggleArea(row, "all")}
                        />
                        <span className="font-semibold">Tudo</span>
                      </label>
                      {DASHBOARD_AREAS.map((a) => (
                        <label
                          key={a}
                          className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-2 py-1.5 text-xs transition hover:border-[color:color-mix(in_oklab,var(--aurora-lavender)_40%,var(--border))]"
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
        </AuroraSection>

        <AuroraSection
          title="Auditoria"
          description="Últimas 50 ações feitas pelo dashboard."
          icon={History}
          tone="peach"
        >
          {!audit.data || audit.data.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
              Sem registros ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/40">
              {audit.data.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="font-mono text-xs text-primary">{entry.event}</span>{" "}
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
        </AuroraSection>
      </div>
    </ModuleLayout>
  );
}
