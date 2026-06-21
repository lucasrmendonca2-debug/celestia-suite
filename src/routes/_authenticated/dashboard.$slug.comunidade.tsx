import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Users,
  Vote,
  Lightbulb,
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import {
  AuroraSection,
  AuroraStatCard,
  AuroraField,
  AuroraSwitchRow,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { requireUser, listMyGuilds } from "@/lib/auth/auth.functions";
import {
  getCommunityConfig,
  updateCommunityConfig,
  listGuildPolls,
  listGuildSuggestions,
  updateSuggestionStatus,
  cancelPoll,
} from "@/lib/guild/community.functions";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/comunidade")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["community-config", params.guildId],
      queryFn: () => getCommunityConfig({ data: { guildId: params.guildId } }),
    });
    return { user };
  },
  component: CommunityPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro: {(error as Error).message}</div>
  ),
  notFoundComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">Servidor não encontrado.</div>
  ),
});

type ConfigRow = {
  guild_id: string;
  polls_enabled: boolean;
  polls_log_channel_id: string | null;
  polls_max_options: number;
  polls_allow_anonymous: boolean;
  suggestions_enabled: boolean;
  suggestions_channel_id: string | null;
  suggestions_log_channel_id: string | null;
  suggestions_require_reason: boolean;
  suggestions_allow_anonymous: boolean;
  suggestions_allow_voting: boolean;
};

const STATUS_TONE: Record<string, "mint" | "peach" | "pink" | "cyan" | "lavender"> = {
  ACTIVE: "mint",
  PENDING: "peach",
  APPROVED: "mint",
  REJECTED: "pink",
  IMPLEMENTED: "cyan",
  CLOSED: "lavender",
};

function CommunityPage() {
  const { guildId } = Route.useParams();
  const { user } = Route.useLoaderData();

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Users}
      title="Comunidade"
      description="Enquetes, sugestões e ferramentas que mantêm seu servidor borbulhando."
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="polls">
            <Vote className="mr-1.5 size-3.5" /> Enquetes
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Lightbulb className="mr-1.5 size-3.5" /> Sugestões
          </TabsTrigger>
          <TabsTrigger value="settings">
            <SettingsIcon className="mr-1.5 size-3.5" /> Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab guildId={guildId} />
        </TabsContent>
        <TabsContent value="polls">
          <PollsTab guildId={guildId} />
        </TabsContent>
        <TabsContent value="suggestions">
          <SuggestionsTab guildId={guildId} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab guildId={guildId} />
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}

function OverviewTab({ guildId }: { guildId: string }) {
  const { data: config } = useSuspenseQuery({
    queryKey: ["community-config", guildId],
    queryFn: () => getCommunityConfig({ data: { guildId } }) as Promise<ConfigRow>,
  });
  const { data: polls = [] } = useQuery({
    queryKey: ["community-polls", guildId],
    queryFn: () => listGuildPolls({ data: { guildId } }),
  });
  const { data: suggestions = [] } = useQuery({
    queryKey: ["community-suggestions", guildId, "ALL"],
    queryFn: () => listGuildSuggestions({ data: { guildId, status: "ALL" } }),
  });

  const activePolls = polls.filter((p) => p.status === "ACTIVE").length;
  const pendingSuggestions = suggestions.filter((s) => s.status === "PENDING").length;
  const hasActivity = activePolls > 0 || pendingSuggestions > 0;

  return (
    <div className="space-y-5">
      <div
        className="aurora-panel relative overflow-hidden p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--aurora-cyan) 18%, var(--card)), color-mix(in oklab, var(--aurora-mint) 14%, var(--card)))",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--aurora-cyan) 70%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <Mascot variant={hasActivity ? "celebrate" : "hero"} size={84} glow />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Sua comunidade em movimento
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasActivity
                ? `${activePolls} enquete${activePolls === 1 ? "" : "s"} ativa${activePolls === 1 ? "" : "s"} · ${pendingSuggestions} sugest${pendingSuggestions === 1 ? "ão" : "ões"} pendente${pendingSuggestions === 1 ? "" : "s"}.`
                : "Sem atividade no momento — incentive enquetes e sugestões!"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AuroraStatCard
          label="Enquetes ativas"
          value={activePolls}
          hint={`${polls.length} no total`}
          icon={Vote}
          tone="cyan"
        />
        <AuroraStatCard
          label="Sugestões pendentes"
          value={pendingSuggestions}
          hint={`${suggestions.length} no total`}
          icon={Lightbulb}
          tone="peach"
        />
        <AuroraStatCard
          label="Sugestões"
          value={config.suggestions_enabled ? "Ativadas" : "Off"}
          hint={config.suggestions_channel_id ?? "Sem canal"}
          icon={CheckCircle2}
          tone={config.suggestions_enabled ? "mint" : "lavender"}
        />
        <AuroraStatCard
          label="Enquetes"
          value={config.polls_enabled ? "Ativadas" : "Off"}
          hint={`Máx. ${config.polls_max_options} opções`}
          icon={Vote}
          tone={config.polls_enabled ? "mint" : "lavender"}
        />
      </div>
    </div>
  );
}

function PollsTab({ guildId }: { guildId: string }) {
  const qc = useQueryClient();
  const { data: polls = [] } = useQuery({
    queryKey: ["community-polls", guildId],
    queryFn: () => listGuildPolls({ data: { guildId } }),
  });
  const cancelFn = useServerFn(cancelPoll);
  const cancel = useMutation({
    mutationFn: (pollId: string) => cancelFn({ data: { guildId, pollId } }),
    onSuccess: () => {
      toast.success("Enquete cancelada.");
      qc.invalidateQueries({ queryKey: ["community-polls", guildId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <AuroraSection title="Enquetes" icon={Vote} tone="cyan">
      {!polls.length ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Mascot variant="sleeping" size={72} />
          <p className="text-sm text-muted-foreground">
            Nenhuma enquete ainda. Use{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">/enquete criar</code> no Discord.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {polls.map((p) => {
            const tone = STATUS_TONE[p.status] ?? "lavender";
            return (
              <li
                key={p.id}
                className="aurora-card-hover flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  background: `linear-gradient(135deg, color-mix(in oklab, var(--aurora-${tone}) 10%, var(--card)), var(--card))`,
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                    <span className="truncate text-sm font-medium">{p.question}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Array.isArray(p.options) ? p.options.length : 0} opções · canal {p.channel_id}
                    {p.ends_at ? ` · termina ${new Date(p.ends_at).toLocaleString("pt-BR")}` : ""}
                  </p>
                </div>
                {p.status === "ACTIVE" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(p.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AuroraSection>
  );
}

function SuggestionsTab({ guildId }: { guildId: string }) {
  const qc = useQueryClient();
  const { data: suggestions = [] } = useQuery({
    queryKey: ["community-suggestions", guildId, "ALL"],
    queryFn: () => listGuildSuggestions({ data: { guildId, status: "ALL" } }),
  });
  const updateFn = useServerFn(updateSuggestionStatus);
  const update = useMutation({
    mutationFn: (args: {
      suggestionId: string;
      status: "APPROVED" | "REJECTED" | "IMPLEMENTED" | "PENDING";
    }) => updateFn({ data: { guildId, ...args } }),
    onSuccess: () => {
      toast.success("Sugestão atualizada.");
      qc.invalidateQueries({ queryKey: ["community-suggestions", guildId, "ALL"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <AuroraSection title="Sugestões" icon={Lightbulb} tone="peach">
      {!suggestions.length ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Mascot variant="sleeping" size={72} />
          <p className="text-sm text-muted-foreground">
            Nenhuma sugestão ainda. Os membros podem enviar com{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">/sugestao enviar</code>.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => {
            const tone = STATUS_TONE[s.status] ?? "lavender";
            return (
              <li
                key={s.id}
                className="aurora-card-hover space-y-2 rounded-xl border border-border bg-card/40 p-4"
                style={{
                  background: `linear-gradient(135deg, color-mix(in oklab, var(--aurora-${tone}) 10%, var(--card)), var(--card))`,
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{s.status}</Badge>
                  <span className="text-xs text-muted-foreground">por {s.author_id}</span>
                  <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span>👍 {s.upvotes}</span>
                    <span>👎 {s.downvotes}</span>
                    <Clock className="size-3" />
                  </span>
                </div>
                <p className="text-sm">{s.content}</p>
                {s.decision_reason && (
                  <p className="text-xs text-muted-foreground">Motivo: {s.decision_reason}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ suggestionId: s.id, status: "APPROVED" })}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ suggestionId: s.id, status: "REJECTED" })}
                  >
                    Reprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ suggestionId: s.id, status: "IMPLEMENTED" })}
                  >
                    Marcar como implementada
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AuroraSection>
  );
}

function SettingsTab({ guildId }: { guildId: string }) {
  const qc = useQueryClient();
  const { data: config } = useSuspenseQuery({
    queryKey: ["community-config", guildId],
    queryFn: () => getCommunityConfig({ data: { guildId } }) as Promise<ConfigRow>,
  });

  const [local, setLocal] = useState<ConfigRow>(config);
  const updateFn = useServerFn(updateCommunityConfig);
  const save = useMutation({
    mutationFn: () => updateFn({ data: { guildId, ...local } }),
    onSuccess: () => {
      toast.success("Configuração salva.");
      qc.invalidateQueries({ queryKey: ["community-config", guildId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4">
      <AuroraSection
        title="Enquetes"
        icon={Vote}
        tone="cyan"
        description="Configurações do sistema /enquete."
      >
        <AuroraSwitchRow
          label="Ativar enquetes"
          checked={local.polls_enabled}
          onChange={(v) => setLocal({ ...local, polls_enabled: v })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <AuroraField label="Canal de log (ID)">
            <Input
              value={local.polls_log_channel_id ?? ""}
              placeholder="ex: 1234567890"
              onChange={(e) =>
                setLocal({ ...local, polls_log_channel_id: e.target.value || null })
              }
            />
          </AuroraField>
          <AuroraField label="Máximo de opções">
            <Input
              type="number"
              min={2}
              max={20}
              value={local.polls_max_options}
              onChange={(e) =>
                setLocal({ ...local, polls_max_options: Number(e.target.value) || 10 })
              }
            />
          </AuroraField>
        </div>
      </AuroraSection>

      <AuroraSection
        title="Sugestões"
        icon={Lightbulb}
        tone="peach"
        description="Configurações do sistema /sugestao."
      >
        <AuroraSwitchRow
          label="Ativar sugestões"
          checked={local.suggestions_enabled}
          onChange={(v) => setLocal({ ...local, suggestions_enabled: v })}
        />
        <AuroraSwitchRow
          label="Permitir votação"
          checked={local.suggestions_allow_voting}
          onChange={(v) => setLocal({ ...local, suggestions_allow_voting: v })}
        />
        <AuroraSwitchRow
          label="Exigir motivo ao aprovar/reprovar"
          checked={local.suggestions_require_reason}
          onChange={(v) => setLocal({ ...local, suggestions_require_reason: v })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <AuroraField label="Canal de sugestões (ID)">
            <Input
              value={local.suggestions_channel_id ?? ""}
              placeholder="ex: 1234567890"
              onChange={(e) =>
                setLocal({ ...local, suggestions_channel_id: e.target.value || null })
              }
            />
          </AuroraField>
          <AuroraField label="Canal de log (ID)">
            <Input
              value={local.suggestions_log_channel_id ?? ""}
              placeholder="ex: 1234567890"
              onChange={(e) =>
                setLocal({ ...local, suggestions_log_channel_id: e.target.value || null })
              }
            />
          </AuroraField>
        </div>
      </AuroraSection>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-1.5 size-4" />
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
