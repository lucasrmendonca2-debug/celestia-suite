import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Users, Vote, Lightbulb, Settings as SettingsIcon } from "lucide-react";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/community")({
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

function CommunityPage() {
  const { guildId } = Route.useParams();
  const { user } = Route.useLoaderData();

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Users}
      title="Comunidade"
      description="Enquetes, sugestões e ferramentas que mantêm seu servidor ativo."
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Enquetes ativas" value={String(activePolls)} hint={`${polls.length} no total`} />
      <StatCard label="Sugestões pendentes" value={String(pendingSuggestions)} hint={`${suggestions.length} no total`} />
      <StatCard
        label="Sugestões"
        value={config.suggestions_enabled ? "Ativadas" : "Desativadas"}
        hint={config.suggestions_channel_id ? `Canal: ${config.suggestions_channel_id}` : "Sem canal configurado"}
      />
      <StatCard
        label="Enquetes"
        value={config.polls_enabled ? "Ativadas" : "Desativadas"}
        hint={`Máx. de opções: ${config.polls_max_options}`}
      />
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
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

  if (!polls.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma enquete criada ainda. Use <code className="rounded bg-muted px-1.5 py-0.5">/enquete criar</code> no Discord para começar.</p>;
  }

  return (
    <div className="space-y-3">
      {polls.map((p) => (
        <Card key={p.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>{p.status}</Badge>
                <span className="truncate text-sm font-medium">{p.question}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.options.length} opções · canal {p.channel_id}
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
          </CardContent>
        </Card>
      ))}
    </div>
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
    mutationFn: (args: { suggestionId: string; status: "APPROVED" | "REJECTED" | "IMPLEMENTED" | "PENDING" }) =>
      updateFn({ data: { guildId, ...args } }),
    onSuccess: () => {
      toast.success("Sugestão atualizada.");
      qc.invalidateQueries({ queryKey: ["community-suggestions", guildId, "ALL"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!suggestions.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma sugestão ainda. Os membros podem enviar com <code className="rounded bg-muted px-1.5 py-0.5">/sugestao enviar</code>.</p>;
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <Card key={s.id}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Badge>{s.status}</Badge>
              <span className="text-xs text-muted-foreground">por {s.author_id}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                👍 {s.upvotes} · 👎 {s.downvotes}
              </span>
            </div>
            <p className="text-sm">{s.content}</p>
            {s.decision_reason && (
              <p className="text-xs text-muted-foreground">Motivo: {s.decision_reason}</p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="default" disabled={update.isPending}
                onClick={() => update.mutate({ suggestionId: s.id, status: "APPROVED" })}>
                Aprovar
              </Button>
              <Button size="sm" variant="destructive" disabled={update.isPending}
                onClick={() => update.mutate({ suggestionId: s.id, status: "REJECTED" })}>
                Reprovar
              </Button>
              <Button size="sm" variant="secondary" disabled={update.isPending}
                onClick={() => update.mutate({ suggestionId: s.id, status: "IMPLEMENTED" })}>
                Marcar como implementada
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enquetes</CardTitle>
          <CardDescription>Configurações do sistema /enquete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleField
            label="Ativar enquetes"
            checked={local.polls_enabled}
            onChange={(v) => setLocal({ ...local, polls_enabled: v })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="polls-log">Canal de log (ID)</Label>
              <Input
                id="polls-log"
                value={local.polls_log_channel_id ?? ""}
                placeholder="ex: 1234567890"
                onChange={(e) => setLocal({ ...local, polls_log_channel_id: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor="polls-max">Máximo de opções</Label>
              <Input
                id="polls-max"
                type="number"
                min={2}
                max={20}
                value={local.polls_max_options}
                onChange={(e) => setLocal({ ...local, polls_max_options: Number(e.target.value) || 10 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sugestões</CardTitle>
          <CardDescription>Configurações do sistema /sugestao.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleField
            label="Ativar sugestões"
            checked={local.suggestions_enabled}
            onChange={(v) => setLocal({ ...local, suggestions_enabled: v })}
          />
          <ToggleField
            label="Permitir votação"
            checked={local.suggestions_allow_voting}
            onChange={(v) => setLocal({ ...local, suggestions_allow_voting: v })}
          />
          <ToggleField
            label="Exigir motivo ao aprovar/reprovar"
            checked={local.suggestions_require_reason}
            onChange={(v) => setLocal({ ...local, suggestions_require_reason: v })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="sug-channel">Canal de sugestões (ID)</Label>
              <Input
                id="sug-channel"
                value={local.suggestions_channel_id ?? ""}
                placeholder="ex: 1234567890"
                onChange={(e) => setLocal({ ...local, suggestions_channel_id: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor="sug-log">Canal de log (ID)</Label>
              <Input
                id="sug-log"
                value={local.suggestions_log_channel_id ?? ""}
                placeholder="ex: 1234567890"
                onChange={(e) => setLocal({ ...local, suggestions_log_channel_id: e.target.value || null })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card/40 px-3 py-2">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
