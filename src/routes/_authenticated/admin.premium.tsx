import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Crown, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/auth.functions";
import {
  adminCreateCode,
  adminDeactivateCode,
  adminPremiumOverview,
  adminRevokeSubscription,
  isPremiumOwner,
} from "@/lib/admin/premium-admin.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/premium")({
  loader: async ({ context }) => {
    const user = await requireUser();
    const owner = await isPremiumOwner();
    if (!owner) throw redirect({ to: "/dashboard" });
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
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold">Premium · Admin Global</h1>
          <p className="text-sm text-muted-foreground">Painel restrito ao owner do bot.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "VIPs ativos", value: data.metrics.activeUserVips },
          { label: "Servidores Premium", value: data.metrics.activeGuildPremiums },
          { label: "Códigos totais", value: data.metrics.totalCodes },
          { label: "Códigos ativos", value: data.metrics.activeCodes },
        ].map((m) => (
          <Card key={m.label} className="p-4">
            <p className="text-xs text-muted-foreground uppercase">{m.label}</p>
            <p className="text-2xl font-bold">{m.value}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="codes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="codes">Códigos</TabsTrigger>
          <TabsTrigger value="subs">Assinaturas</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4" /> Gerar código
            </h3>
            <div className="grid gap-3 sm:grid-cols-5">
              <div className="sm:col-span-2">
                <Label>Plano</Label>
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
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER_VIP">USER_VIP</SelectItem>
                    <SelectItem value="GUILD_PREMIUM">GUILD_PREMIUM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Usos máx.</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div>
                <Label>Dias (override)</Label>
                <Input
                  type="number"
                  placeholder="opcional"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => createCode.mutate()} disabled={!planId || createCode.isPending}>
                {createCode.isPending ? "Gerando..." : "Gerar código"}
              </Button>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-2">Código</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Uso</th>
                  <th className="p-2">Expira</th>
                  <th className="p-2">Status</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.codes.map((c) => (
                  <tr key={c.id} className="border-t border-border/40">
                    <td className="p-2 font-mono text-xs">{c.code}</td>
                    <td className="p-2">{c.type}</td>
                    <td className="p-2">{c.used_count}/{c.max_uses}</td>
                    <td className="p-2">{fmt(c.expires_at)}</td>
                    <td className="p-2">
                      <Badge variant={c.active ? "default" : "secondary"}>
                        {c.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-2 text-right">
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
          </Card>
        </TabsContent>

        <TabsContent value="subs">
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Alvo</th>
                  <th className="p-2">Início</th>
                  <th className="p-2">Expira</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.subscriptions.map((s) => (
                  <tr key={s.id} className="border-t border-border/40">
                    <td className="p-2">{s.type}</td>
                    <td className="p-2 font-mono text-xs">{s.user_id ?? s.guild_id}</td>
                    <td className="p-2">{fmt(s.starts_at)}</td>
                    <td className="p-2">{fmt(s.expires_at)}</td>
                    <td className="p-2 text-right">
                      <Button size="sm" variant="destructive" onClick={() => revoke.mutate(s.id)}>
                        Revogar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="p-4">
            <ul className="space-y-2 text-sm">
              {data.audit.map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div>
                    <p className="font-medium">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{fmt(a.created_at)}</p>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {a.target_user_id ?? a.target_guild_id ?? ""}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
