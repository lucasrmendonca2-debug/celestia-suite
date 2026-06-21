import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, Gift, Sparkles, Zap, CalendarClock, ShieldCheck } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  getGuildPremiumStatus,
  getPremiumGuildConfig,
  getPremiumUsage,
  listPremiumAuditLogs,
  listPremiumPlans,
  redeemGuildCode,
  updatePremiumGuildConfig,
} from "@/lib/guild/premium.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import {
  AuroraSection,
  AuroraStatCard,
  AuroraField,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleSelect } from "@/components/dashboard/selectors/RoleSelect";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";


const REDEEM_REASONS: Record<string, string> = {
  not_found: "Código não encontrado.",
  inactive: "Código inativo.",
  expired: "Código expirado.",
  exhausted: "Código já atingiu o limite de usos.",
  plan_mismatch: "Esse código não é de servidor.",
};

export const Route = createFileRoute("/_authenticated/dashboard/$slug/premium")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["premium-status", guildId],
      queryFn: () => getGuildPremiumStatus({ data: { guildId: guildId } }),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["premium-plans"],
      queryFn: () => listPremiumPlans(),
    });
    return { guildId, user };
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
  const { guildId } = Route.useLoaderData();
  const { user } = Route.useLoaderData();
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
  const { data: config } = useQuery({
    queryKey: ["premium-config", guildId],
    queryFn: () => getPremiumGuildConfig({ data: { guildId } }),
  });
  const { data: usage } = useQuery({
    queryKey: ["premium-usage", guildId],
    queryFn: () => getPremiumUsage({ data: { guildId } }),
  });

  const redeemFn = useServerFn(redeemGuildCode);
  const updateCfgFn = useServerFn(updatePremiumGuildConfig);
  const [code, setCode] = useState("");
  const [vipRoleId, setVipRoleId] = useState("");
  const [premiumRoleId, setPremiumRoleId] = useState("");

  const redeem = useMutation({
    mutationFn: async () => redeemFn({ data: { guildId, code } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(REDEEM_REASONS[result.reason] ?? "Não foi possível resgatar.");
        return;
      }
      toast.success(`Plano ${result.plan?.name ?? "premium"} ativado!`);
      setCode("");
      qc.invalidateQueries({ queryKey: ["premium-status", guildId] });
      qc.invalidateQueries({ queryKey: ["premium-audit", guildId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveConfig = useMutation({
    mutationFn: async () =>
      updateCfgFn({
        data: {
          guildId,
          vip_role_id: vipRoleId.trim() || null,
          premium_role_id: premiumRoleId.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Configuração salva.");
      qc.invalidateQueries({ queryKey: ["premium-config", guildId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    if (config) {
      setVipRoleId(config.vip_role_id ?? "");
      setPremiumRoleId(config.premium_role_id ?? "");
    }
  }, [config]);

  const active = status?.subscription as
    | (typeof status.subscription & { plan?: { name: string; description: string; features: Record<string, unknown> } })
    | null;
  const remaining = daysRemaining(active?.expires_at);
  const guildPlans = plans.filter((p) => p.type === "GUILD_PREMIUM");

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Crown}
      title="Premium do Servidor"
      description="Gerencie a assinatura premium, benefícios mágicos e códigos deste servidor."
    >
      <div
        className="aurora-panel relative mb-5 overflow-hidden p-5 sm:p-6"
        style={{
          background: active
            ? "linear-gradient(135deg, color-mix(in oklab, var(--aurora-peach) 22%, var(--card)), color-mix(in oklab, var(--aurora-pink) 16%, var(--card)))"
            : "linear-gradient(135deg, color-mix(in oklab, var(--aurora-lavender) 18%, var(--card)), color-mix(in oklab, var(--aurora-cyan) 12%, var(--card)))",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full blur-3xl opacity-70"
          style={{
            background: active
              ? "radial-gradient(circle, color-mix(in oklab, var(--aurora-peach) 70%, transparent), transparent 70%)"
              : "radial-gradient(circle, color-mix(in oklab, var(--aurora-lavender) 70%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <Mascot variant={active ? "celebrate" : "hero"} size={84} glow />
          <div className="min-w-0 flex-1">
            <h2 className="font-display flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
              {active ? (
                <>
                  <Crown className="size-5 text-[color:var(--aurora-peach)]" />
                  {active.plan?.name ?? "Plano Premium"}
                </>
              ) : (
                "Servidor sem premium"
              )}
              {active && <Badge variant="default">{active.status}</Badge>}
            </h2>
            <p className="text-sm text-muted-foreground">
              {active
                ? active.plan?.description ?? "Aproveite todos os benefícios mágicos."
                : "Ative um plano premium para desbloquear recursos avançados."}
            </p>
            {remaining !== null && remaining <= 7 && (
              <p className="mt-1 text-sm font-medium text-[color:var(--aurora-peach)]">
                ⚠️ Sua assinatura expira em {remaining} dia{remaining === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        </div>
      </div>

      {active && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <AuroraStatCard label="Início" value={fmtDate(active.starts_at)} icon={CalendarClock} tone="lavender" />
          <AuroraStatCard label="Expira" value={fmtDate(active.expires_at)} icon={CalendarClock} tone="pink" />
          <AuroraStatCard label="Dias restantes" value={remaining ?? "∞"} icon={Sparkles} tone="peach" />
        </div>
      )}

      <Tabs defaultValue="benefits" className="space-y-5">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="benefits">Benefícios</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="codes">Resgatar código</TabsTrigger>
          <TabsTrigger value="usage">Meu uso</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="benefits">
          <AuroraSection title="Benefícios ativos" icon={Sparkles} tone="peach">
            {active?.plan?.features && Object.keys(active.plan.features).length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {Object.entries(active.plan.features).map(([key, value]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs">{key}</span>
                    <Badge variant="secondary">{String(value)}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
                <Mascot variant="sleeping" size={72} />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhum benefício ativo. Ative um plano para ver os benefícios.
                </p>
              </div>
            )}
          </AuroraSection>
        </TabsContent>

        <TabsContent value="plans">
          <AuroraSection title="Planos disponíveis" icon={Crown} tone="lavender">
            {guildPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum plano disponível no momento.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {guildPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="aurora-card-hover flex flex-col gap-3 rounded-2xl border border-border/60 p-5"
                    style={{
                      background:
                        "linear-gradient(160deg, color-mix(in oklab, var(--aurora-peach) 14%, var(--card)), color-mix(in oklab, var(--aurora-pink) 8%, var(--card)))",
                    }}
                  >
                    <div>
                      <h4 className="font-display text-lg font-semibold">{plan.name}</h4>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-sm">
                      <p>
                        <span className="font-display text-2xl font-bold">R$ {Number(plan.price).toFixed(2)}</span>
                        <span className="text-muted-foreground"> / {plan.duration_days}d</span>
                      </p>
                    </div>
                    <Button disabled variant="outline" size="sm">
                      Em breve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </AuroraSection>
        </TabsContent>

        <TabsContent value="codes">
          <AuroraSection
            title="Resgatar código"
            description="Tem um código premium? Cole abaixo para ativar neste servidor."
            icon={Gift}
            tone="pink"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
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
          </AuroraSection>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {usage ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <AuroraSection title="Servidor" icon={Crown} tone="peach">
                  {usage.guild ? (
                    <>
                      <p className="font-display text-lg font-bold">{usage.guild.plan_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Expira: {fmtDate(usage.guild.expires_at)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Plano FREE — sem premium ativo.</p>
                  )}
                </AuroraSection>
                <AuroraSection title="Seu VIP" icon={Sparkles} tone="pink">
                  {usage.user ? (
                    <>
                      <p className="font-display text-lg font-bold">{usage.user.plan_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Expira: {fmtDate(usage.user.expires_at)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Você não tem VIP. Use <code>/vip ativar</code> com um código.
                    </p>
                  )}
                </AuroraSection>
              </div>

              <AuroraSection title="Multiplicadores efetivos (seu VIP)" icon={Zap} tone="cyan">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "XP", v: usage.multipliers.xp, tone: "lavender" as const },
                    { label: "Daily", v: usage.multipliers.daily, tone: "mint" as const },
                    { label: "Work", v: usage.multipliers.work, tone: "cyan" as const },
                    { label: "Crime", v: usage.multipliers.crime, tone: "pink" as const },
                  ].map((m) => (
                    <AuroraStatCard
                      key={m.label}
                      label={m.label}
                      value={`${m.v.toFixed(2)}x`}
                      icon={Zap}
                      tone={m.tone}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  1.00x = sem boost. Boosts vêm do plano VIP/Premium ativo.
                </p>
              </AuroraSection>

              <AuroraSection title="Limites do servidor" icon={ShieldCheck} tone="lavender">
                <ul className="space-y-3 text-sm">
                  {usage.usage.map((u) => (
                    <li key={u.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{u.label}</span>
                        <span className="font-mono text-xs">
                          {u.used} / {u.limit}{" "}
                          <span className="text-muted-foreground">
                            ({u.remaining} restante{u.remaining === 1 ? "" : "s"})
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${u.pct}%`,
                            background:
                              u.pct >= 90
                                ? "linear-gradient(90deg, var(--aurora-pink), #ff5d7a)"
                                : u.pct >= 70
                                ? "linear-gradient(90deg, var(--aurora-peach), var(--aurora-pink))"
                                : "linear-gradient(90deg, var(--aurora-cyan), var(--aurora-lavender))",
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Ative um plano premium para aumentar esses limites.
                </p>
              </AuroraSection>
            </>
          ) : (
            <AuroraSection title="Meu uso" icon={Sparkles} tone="cyan">
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </AuroraSection>
          )}
        </TabsContent>

        <TabsContent value="config">
          <AuroraSection
            title="Cargos automáticos"
            description="IDs dos cargos atribuídos automaticamente a membros VIP e ao servidor premium. O bot precisa de permissão de gerenciar cargos e estar acima."
            icon={ShieldCheck}
            tone="mint"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <AuroraField label="Cargo VIP (usuário)" htmlFor="vipRole">
                <RoleSelect
                  guildId={guildId}
                  value={vipRoleId || null}
                  onChange={(id) => setVipRoleId(id ?? "")}
                  excludeManaged
                  placeholder="Selecione o cargo VIP"
                />
              </AuroraField>
              <AuroraField label="Cargo Premium (servidor)" htmlFor="premiumRole">
                <RoleSelect
                  guildId={guildId}
                  value={premiumRoleId || null}
                  onChange={(id) => setPremiumRoleId(id ?? "")}
                  excludeManaged
                  placeholder="Selecione o cargo Premium"
                />
              </AuroraField>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
                {saveConfig.isPending ? "Salvando..." : "Salvar configuração"}
              </Button>
            </div>
          </AuroraSection>
        </TabsContent>

        <TabsContent value="logs">
          <AuroraSection title="Histórico premium" icon={CalendarClock} tone="lavender">
            {logs && logs.length > 0 ? (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/40">
                {logs.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
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
          </AuroraSection>
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}
