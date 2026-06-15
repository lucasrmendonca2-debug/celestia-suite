import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileCode2, Plus, Save, Trash2 } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  listEmbedTemplates,
  removeEmbedTemplate,
  upsertEmbedTemplate,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { EmbedEditor, type EmbedData } from "@/components/dashboard/EmbedEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/embeds")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["embeds", params.guildId],
      queryFn: () => listEmbedTemplates({ data: { guildId: params.guildId } }),
    });
    return { user };
  },
  component: EmbedsPage,
});

interface EmbedForm {
  id?: string;
  name: string;
  embed: EmbedData;
}

const EMPTY: EmbedForm = {
  name: "",
  embed: { title: "Título", description: "Texto do embed", color: "#5865F2" },
};

function EmbedsPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const qc = useQueryClient();
  const { data: rows } = useSuspenseQuery({
    queryKey: ["embeds", guildId],
    queryFn: () => listEmbedTemplates({ data: { guildId } }),
  });
  const upsert = useServerFn(upsertEmbedTemplate);
  const remove = useServerFn(removeEmbedTemplate);
  const [sel, setSel] = useState<EmbedForm>(EMPTY);

  const save = useMutation({
    mutationFn: () =>
      upsert({
        data: { guildId, id: sel.id, name: sel.name, embed: sel.embed },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["embeds", guildId] });
      toast.success("Embed salvo.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { guildId, id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["embeds", guildId] });
      setSel(EMPTY);
    },
  });

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={FileCode2}
      title="Embeds"
      description="Templates de embeds reutilizáveis com editor visual e preview."
      actions={
        <>
          <Button variant="outline" onClick={() => setSel(EMPTY)}>
            <Plus className="mr-1.5 size-4" /> Novo
          </Button>
          <Button onClick={() => save.mutate()} disabled={!sel.name || save.isPending}>
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
              Sem templates.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {(rows as any[]).map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSel({ id: r.id, name: r.name, embed: r.embed })}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                      sel.id === r.id ? "bg-primary/15" : "hover:bg-accent"
                    }`}
                  >
                    <span className="truncate">{r.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Label className="text-xs">Nome do template</Label>
            <Input
              className="mt-2"
              value={sel.name}
              maxLength={64}
              onChange={(e) => setSel({ ...sel, name: e.target.value })}
              placeholder="ex: aviso-staff"
            />
          </div>
          <EmbedEditor
            value={sel.embed}
            onChange={(v) => setSel({ ...sel, embed: v })}
          />
          {sel.id && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => del.mutate(sel.id!)}>
                <Trash2 className="mr-1.5 size-4" /> Excluir
              </Button>
            </div>
          )}
        </section>
      </div>
    </ModuleLayout>
  );
}
