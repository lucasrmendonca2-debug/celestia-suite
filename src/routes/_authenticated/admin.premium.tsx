import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Crown, ShieldAlert, Sparkles, Users, Server, Ticket, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth/auth.functions";
import {
  adminCreateCode,
  adminDeactivateCode,
  adminPremiumOverview,
  adminRevokeSubscription,
  isPremiumOwner,
} from "@/lib/admin/premium-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mascot } from "@/components/Mascot";
import { AuroraSection, AuroraStatCard, AuroraField } from "@/components/dashboard/aurora-ui";

export const Route = createFileRoute("/_authenticated/admin/premium")({
  loader: async ({ context }) => {
    const user = await requireUser();
    const owner = await isPremiumOwner();
    if (!owner) throw redirect({ to: "/servidores" });
    await context.queryClient.ensureQueryData({
      queryKey: ["admin-premium-overview"],
      queryFn: () => adminPremiumOverview(),
    });
    return { user };
  },
  component: AdminPremiumPage,
});

function fmt(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleString("pt-BR") : "—";
}

function AdminPremiumPage() {
  const qc = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: ["admin-premium-overview"],
    queryFn: () => adminPremiumOverview(),
  });

  const createFn = useServerFn(adminCreateCode);
  const deactivateFn = useServerFn(adminDeactivateCode);
  const revokeFn = useServerFn(adminRevokeSubscription);

  const [planId, setPlanId] = useState<string>("");
  const [type, setType] = useState<"USER_VIP" | "GUILD_PREMIUM">("USER_VIP");
  const [maxUses, setMaxUses] = useState(1);
  const [durationDays, setDurationDays] = useState<string>("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-premium-overview"] });

  const createCode = useMutation({
    mutationFn: async () =>
      createFn({
        data: {
          planId,
          type,
          maxUses,
          durationDays: durationDays ? Number(durationDays) : null,
        },
      }),
    onSuccess: (row) => {
      toast.success(`Código criado: ${row?.code}`);
      navigator.clipboard?.writeText(row?.code ?? "").catch(() => {});
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => deactivateFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Código desativado.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Assinatura revogada.");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="aurora-shell min-h-dvh text-foreground">
      <main className="relative z-10 container mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        {/* Hero */}
        <section className="aurora-panel relative overflow-hidden p-5 sm:p-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full blur-3xl opacity-60"
            style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--aurora-peach) 70%, transparent), transparent 70%)" }}
          />
          <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-500">
                <ShieldAlert className="size-3" /> Owner only
              </span>
              <h1 className="font-display mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                <Sparkles className="size-6 text-amber-400" /> Premium · Admin Global
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Painel restrito ao owner do bot — códigos, assinaturas e auditoria.
              </p>
            </div>
            <Mascot variant="celebrate" size={120} glow className="shrink-0" />
          </div>
        </section>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AuroraStatCard label="VIPs ativos" value={data.metrics.activeUserVips} icon={Users} tone="pink" />
          <AuroraStatCard label="Servidores Premium" value={data.metrics.activeGuildPremiums} icon={Server} tone="lavender" />
          <AuroraStatCard label="Códigos totais" value={data.metrics.totalCodes} icon={Ticket} tone="cyan" />
          <AuroraStatCard label="Códigos ativos" value={data.metrics.activeCodes} icon={Zap} tone="mint" />
        </div>

        <Tabs defaultValue="codes" className="space-y-4">
          <TabsList className="aurora-panel bg-transparent p-1">
            <TabsTrigger value="codes">Códigos</TabsTrigger>
            <TabsTrigger value="subs">Assinaturas</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="codes" className="space-y-4">
            <AuroraSection title="Gerar código" icon={Crown} tone="peach" description="Crie um código resgatável para VIP ou Premium de servidor.">
              <div className="grid gap-3 sm:grid-cols-5">
                <div className="sm:col-span-2">
                  <AuroraField label="Plano">
                    <Select value={planId} onValueChange={setPlanId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {data.plans.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </AuroraField>
                </div>
                <AuroraField label="Tipo">
                  <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER_VIP">USER_VIP</SelectItem>
                      <SelectItem value="GUILD_PREMIUM">GUILD_PREMIUM</SelectItem>
                    </SelectContent>
                  </Select>
                </AuroraField>
                <AuroraField label="Usos máx.">
                  <Input
                    type="number"
                    min={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(Math.max(1, Number(e.target.value) || 1))}
                  />
                </AuroraField>
                <AuroraField label="Dias (override)" hint="Opcional">
                  <Input
                    type="number"
                    placeholder="ex: 30"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                  />
                </AuroraField>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => createCode.mutate()} disabled={!planId || createCode.isPending}>
                  {createCode.isPending ? "Gerando..." : "Gerar código"}
                </Button>
              </div>
            </AuroraSection>

            <AuroraSection title="Códigos emitidos" icon={Ticket} tone="cyan">
              {data.codes.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Mascot variant="sleeping" size={90} />
                  <p className="text-sm text-muted-foreground">Nenhum código emitido ainda.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <table className="w-full text-sm">
                    <thead className="bg-background/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Uso</th>
                        <th className="p-3">Expira</th>
                        <th className="p-3">Status</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.codes.map((c) => (
                        <tr key={c.id} className="border-t border-border/40 transition hover:bg-background/30">
                          <td className="p-3 font-mono text-xs">{c.code}</td>
                          <td className="p-3">{c.type}</td>
                          <td className="p-3">{c.used_count}/{c.max_uses}</td>
                          <td className="p-3">{fmt(c.expires_at)}</td>
                          <td className="p-3">
                            <Badge variant={c.active ? "default" : "secondary"}>
                              {c.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            {c.active && (
                              <Button size="sm" variant="outline" onClick={() => deactivate.mutate(c.id)}>
                                Desativar
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AuroraSection>
          </TabsContent>

          <TabsContent value="subs">
            <AuroraSection title="Assinaturas ativas" icon={Crown} tone="pink">
              {data.subscriptions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Mascot variant="sleeping" size={90} />
                  <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <table className="w-full text-sm">
                    <thead className="bg-background/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Alvo</th>
                        <th className="p-3">Início</th>
                        <th className="p-3">Expira</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.subscriptions.map((s) => (
                        <tr key={s.id} className="border-t border-border/40 transition hover:bg-background/30">
                          <td className="p-3">{s.type}</td>
                          <td className="p-3 font-mono text-xs">{s.user_id ?? s.guild_id}</td>
                          <td className="p-3">{fmt(s.starts_at)}</td>
                          <td className="p-3">{fmt(s.expires_at)}</td>
                          <td className="p-3 text-right">
                            <Button size="sm" variant="destructive" onClick={() => revoke.mutate(s.id)}>
                              Revogar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AuroraSection>
          </TabsContent>

          <TabsContent value="audit">
            <AuroraSection title="Auditoria" icon={ShieldAlert} tone="lavender" description="Ações sensíveis do painel admin.">
              {data.audit.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Mascot variant="sleeping" size={90} />
                  <p className="text-sm text-muted-foreground">Sem registros.</p>
                </div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.audit.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                      <div className="min-w-0">
                        <p className="font-medium">{a.action}</p>
                        <p className="text-xs text-muted-foreground">{fmt(a.created_at)}</p>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {a.target_user_id ?? a.target_guild_id ?? ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AuroraSection>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
