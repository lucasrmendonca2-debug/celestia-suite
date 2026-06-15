import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Terminal, Trash2 } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  listCustomCommands,
  removeCustomCommand,
  upsertCustomCommand,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { EmbedEditor, type EmbedData } from "@/components/dashboard/EmbedEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/commands")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["commands", params.guildId],
      queryFn: () => listCustomCommands({ data: { guildId: params.guildId } }),
    });
    return { user };
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
}

const EMPTY: CmdForm = {
  name: "",
  description: "",
  response_text: "",
  use_embed: false,
  embed: { color: "#5865F2", description: "Olá, mundo!" },
  enabled: true,
};

function CommandsPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const qc = useQueryClient();
  const { data: rows } = useSuspenseQuery({
    queryKey: ["commands", guildId],
    queryFn: () => listCustomCommands({ data: { guildId } }),
  });
  const upsert = useServerFn(upsertCustomCommand);
  const remove = useServerFn(removeCustomCommand);
  const [selected, setSelected] = useState<CmdForm>(EMPTY);

  const load = (r: any) =>
    setSelected({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      response_text: r.response_text ?? "",
      use_embed: !!r.embed,
      embed: r.embed ?? EMPTY.embed,
      enabled: r.enabled,
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
          required_roles: [],
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
      description="Crie /comandos próprios que respondem com texto ou embed."
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
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-2">
          {rows.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              Sem comandos.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {(rows as any[]).map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => load(r)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                      selected.id === r.id
                        ? "bg-primary/15 text-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <span>/{r.name}</span>
                    {!r.enabled && (
                      <span className="text-[10px] text-muted-foreground">off</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome (sem barra)">
                <Input
                  value={selected.name}
                  maxLength={32}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                    })
                  }
                />
              </Field>
              <Field label="Descrição (na lista do Discord)">
                <Input
                  value={selected.description}
                  onChange={(e) =>
                    setSelected({ ...selected, description: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <Label className="text-sm">Ativo</Label>
              <Switch
                checked={selected.enabled}
                onCheckedChange={(v) => setSelected({ ...selected, enabled: v })}
              />
            </div>
          </div>

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

          {selected.id && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => del.mutate(selected.id!)}
              >
                <Trash2 className="mr-1.5 size-4" />
                Excluir comando
              </Button>
            </div>
          )}
        </section>
      </div>
    </ModuleLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
