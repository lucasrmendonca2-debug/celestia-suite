import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Crown, Gift, Sparkles } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getGuildPremiumStatus,
  listPremiumAuditLogs,
  listPremiumPlans,
  redeemGuildCode,
} from "@/lib/guild/premium.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const REDEEM_REASONS: Record<string, string> = {
  not_found: "Código não encontrado.",
  inactive: "Código inativo.",
  expired: "Código expirado.",
  exhausted: "Código já atingiu o limite de usos.",
  plan_mismatch: "Esse código não é de servidor.",
};

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/premium")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["premium-status", params.guildId],
      queryFn: () => getGuildPremiumStatus({ data: { guildId: params.guildId } }),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["premium-plans"],
      queryFn: () => listPremiumPlans(),
    });
    return { user };
  },
  component: PremiumPage,
});

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "Vitalício";
  return new Date(iso).toLocaleString("pt-BR");
}

function daysRemaining(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function PremiumPage() {
  const { guildId } = Route.useParams();
  const qc = useQueryClient();

  const { data: status } = useSuspenseQuery({
    queryKey: ["premium-status", guildId],
    queryFn: () => getGuildPremiumStatus({ data: { guildId } }),
  });
  const { data: plans } = useSuspenseQuery({
    queryKey: ["premium-plans"],
    queryFn: () => listPremiumPlans(),
  });
  const { data: logs } = useQuery({
    queryKey: ["premium-audit", guildId],
    queryFn: () => listPremiumAuditLogs({ data: { guildId } }),
  });

  const redeemFn = useServerFn(redeemGuildCode);
  const [code, setCode] = useState("");

  const redeem = useMutation({
    mutationFn: async () => redeemFn({ data: { guildId, code } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(REDEEM_REASONS[result.reason] ?? "Não foi possível resgatar.");
        return;
      }
      toast.success(`Plano ${result.plan.name} ativado!`);
      setCode("");
      qc.invalidateQueries({ queryKey: ["premium-status", guildId] });
      qc.invalidateQueries({ queryKey: ["premium-audit", guildId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const active = status?.subscription as
    | (typeof status.subscription & { plan?: { name: string; description: string; features: Record<string, unknown> } })
    | null;
  const remaining = daysRemaining(active?.expires_at);

  const guildPlans = plans.filter((p) => p.type === "GUILD_PREMIUM");

  return (
    <ModuleLayout
      icon={Crown}
      title="Premium do Servidor"
      description="Gerencie a assinatura premium, benefícios e códigos deste servidor."
    >
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="benefits">Benefícios</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="codes">Códigos</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card className="p-6">
            {active ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-400" />
                      {active.plan?.name ?? "Plano Premium"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{active.plan?.description}</p>
                  </div>
                  <Badge variant="default">{active.status}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Início</p>
                    <p className="font-medium">{fmtDate(active.starts_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expira</p>
                    <p className="font-medium">{fmtDate(active.expires_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dias restantes</p>
                    <p className="font-medium">{remaining ?? "—"}</p>
                  </div>
                </div>
                {remaining !== null && remaining <= 7 && (
                  <p className="text-sm text-amber-500">⚠️ Sua assinatura expira em breve.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Servidor sem premium</h3>
                <p className="text-sm text-muted-foreground">
                  Ative um plano premium para desbloquear recursos avançados.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-4">
          <Card className="p-6">
            {active?.plan?.features && Object.keys(active.plan.features).length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2 text-sm">
                {Object.entries(active.plan.features).map(([key, value]) => (
                  <li key={key} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <span className="font-mono text-xs">{key}</span>
                    <Badge variant="secondary">{String(value)}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum benefício ativo. Ative um plano para ver os benefícios.
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guildPlans.map((plan) => (
              <Card key={plan.id} className="p-5 flex flex-col gap-3">
                <div>
                  <h4 className="font-semibold text-lg">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="text-sm">
                  <p>
                    <span className="text-2xl font-bold">R$ {Number(plan.price).toFixed(2)}</span>
                    <span className="text-muted-foreground"> / {plan.duration_days}d</span>
                  </p>
                </div>
                <Button disabled variant="outline" size="sm">
                  Em breve
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="codes" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Resgatar código
              </h3>
              <p className="text-sm text-muted-foreground">
                Tem um código premium? Cole abaixo para ativar neste servidor.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label htmlFor="code" className="sr-only">Código</Label>
                <Input
                  id="code"
                  placeholder="PREMIUM-XXXX-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={64}
                />
              </div>
              <Button
                onClick={() => redeem.mutate()}
                disabled={!code.trim() || redeem.isPending}
              >
                {redeem.isPending ? "Ativando..." : "Resgatar"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-2">
          <Card className="p-6">
            {logs && logs.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div>
                      <p className="font-medium">{l.action}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(l.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum log ainda.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}
