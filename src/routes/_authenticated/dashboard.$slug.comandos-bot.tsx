import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Terminal, Trash2, Sparkles, Power, PowerOff } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  listCustomCommands,
  removeCustomCommand,
  upsertCustomCommand,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { EmbedEditor, type EmbedData } from "@/components/dashboard/EmbedEditor";
import {
  AuroraSection,
  AuroraStatCard,
  AuroraField,
  AuroraSwitchRow,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MultiRoleSelect } from "@/components/dashboard/selectors/MultiRoleSelect";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";


export const Route = createFileRoute("/_authenticated/dashboard/$slug/comandos-bot")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["commands", guildId],
      queryFn: () => listCustomCommands({ data: { guildId: guildId } }),
    });
    return { guildId, user };
  },
  component: CommandsPage,
});

interface CmdForm {
  id?: string;
  name: string;
  description: string;
  response_text: string;
  use_embed: boolean;
  embed: EmbedData;
  enabled: boolean;
  required_roles: string[];
}

const EMPTY: CmdForm = {
  name: "",
  description: "",
  response_text: "",
  use_embed: false,
  embed: { color: "#5865F2", description: "Olá, mundo!" },
  enabled: true,
  required_roles: [],
};


function CommandsPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: rows } = useSuspenseQuery({
    queryKey: ["commands", guildId],
    queryFn: () => listCustomCommands({ data: { guildId } }),
  });
  const upsert = useServerFn(upsertCustomCommand);
  const remove = useServerFn(removeCustomCommand);
  const [selected, setSelected] = useState<CmdForm>(EMPTY);

  const total = rows.length;
  const enabled = (rows as any[]).filter((r) => r.enabled).length;
  const disabled = total - enabled;

  const load = (r: any) =>
    setSelected({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      response_text: r.response_text ?? "",
      use_embed: !!r.embed,
      embed: r.embed ?? EMPTY.embed,
      enabled: r.enabled,
      required_roles: Array.isArray(r.required_roles) ? r.required_roles : [],
    });

  const save = useMutation({
    mutationFn: () =>
      upsert({
        data: {
          guildId,
          id: selected.id,
          name: selected.name,
          description: selected.description,
          response_text: selected.use_embed ? null : selected.response_text,
          embed: selected.use_embed ? selected.embed : null,
          required_roles: selected.required_roles,

          enabled: selected.enabled,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commands", guildId] });
      toast.success("Comando salvo.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { guildId, id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commands", guildId] });
      setSelected(EMPTY);
    },
  });

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Terminal}
      title="Comandos customizados"
      description="Crie /comandos próprios que respondem com texto ou embed mágico."
      actions={
        <>
          <Button variant="outline" onClick={() => setSelected(EMPTY)}>
            <Plus className="mr-1.5 size-4" /> Novo
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={!selected.name || save.isPending}
          >
            <Save className="mr-1.5 size-4" />
            {save.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {/* Hero banner */}
      <div
        className="aurora-panel relative mb-5 overflow-hidden p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--aurora-cyan) 18%, var(--card)), color-mix(in oklab, var(--aurora-lavender) 14%, var(--card)))",
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
          <Mascot variant={total > 0 ? "celebrate" : "hero"} size={84} glow />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Sua própria coleção de feitiços
            </h2>
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? "Nenhum comando criado ainda — comece com um /olá!"
                : `Você tem ${total} comando${total === 1 ? "" : "s"} configurado${total === 1 ? "" : "s"}.`}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <AuroraStatCard label="Total" value={total} icon={Sparkles} tone="lavender" />
        <AuroraStatCard label="Ativos" value={enabled} icon={Power} tone="mint" />
        <AuroraStatCard label="Desativados" value={disabled} icon={PowerOff} tone="peach" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <AuroraSection title="Comandos" icon={Terminal} tone="lavender">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Mascot variant="sleeping" size={64} />
              <p className="text-xs text-muted-foreground">Nenhum ainda.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {(rows as any[]).map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => load(r)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                      selected.id === r.id
                        ? "bg-[color:color-mix(in_oklab,var(--aurora-lavender)_22%,transparent)] text-foreground shadow-sm"
                        : "hover:bg-[color:color-mix(in_oklab,var(--aurora-lavender)_10%,transparent)]"
                    }`}
                  >
                    <span className="font-mono">/{r.name}</span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        r.enabled ? "text-[color:var(--aurora-mint)]" : "text-muted-foreground"
                      }`}
                    >
                      {r.enabled ? "on" : "off"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AuroraSection>

        <div className="space-y-4">
          <AuroraSection title="Configuração" icon={Sparkles} tone="pink">
            <div className="grid gap-3 sm:grid-cols-2">
              <AuroraField label="Nome (sem barra)">
                <Input
                  value={selected.name}
                  maxLength={32}
                  placeholder="ola"
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                    })
                  }
                />
              </AuroraField>
              <AuroraField label="Descrição">
                <Input
                  value={selected.description}
                  placeholder="O que esse comando faz?"
                  onChange={(e) =>
                    setSelected({ ...selected, description: e.target.value })
                  }
                />
              </AuroraField>
            </div>
            <AuroraSwitchRow
              label="Comando ativo"
              hint="Quando desligado, o /comando deixa de responder no Discord."
              checked={selected.enabled}
              onChange={(v) => setSelected({ ...selected, enabled: v })}
            />
          </AuroraSection>

          <AuroraSection title="Resposta" icon={Terminal} tone="cyan">
            <Tabs
              value={selected.use_embed ? "embed" : "text"}
              onValueChange={(v) =>
                setSelected({ ...selected, use_embed: v === "embed" })
              }
            >
              <TabsList>
                <TabsTrigger value="text">Texto</TabsTrigger>
                <TabsTrigger value="embed">Embed</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="mt-4">
                <Textarea
                  rows={8}
                  placeholder="Resposta do comando…"
                  value={selected.response_text}
                  onChange={(e) =>
                    setSelected({ ...selected, response_text: e.target.value })
                  }
                />
              </TabsContent>
              <TabsContent value="embed" className="mt-4">
                <EmbedEditor
                  value={selected.embed}
                  onChange={(v) => setSelected({ ...selected, embed: v })}
                />
              </TabsContent>
            </Tabs>
          </AuroraSection>

          {selected.id && (
            <div className="flex justify-end">
              <ConfirmDeleteButton
                onConfirm={() => del.mutate(selected.id!)}
                title="Excluir comando?"
                description={`O comando "/${selected.name}" será removido permanentemente.`}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Trash2 className="mr-1.5 size-4" />
                    Excluir comando
                  </Button>
                }
              />

            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
