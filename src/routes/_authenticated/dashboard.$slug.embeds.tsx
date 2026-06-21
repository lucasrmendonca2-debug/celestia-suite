import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileCode2, Plus, Save, Trash2, Palette } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  listEmbedTemplates,
  removeEmbedTemplate,
  upsertEmbedTemplate,
} from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { EmbedEditor, type EmbedData } from "@/components/dashboard/EmbedEditor";
import {
  AuroraSection,
  AuroraStatCard,
  AuroraField,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/embeds")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["embeds", guildId],
      queryFn: () => listEmbedTemplates({ data: { guildId: guildId } }),
    });
    return { guildId, user };
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
  const { guildId } = Route.useLoaderData();
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
      description="Templates de embeds reutilizáveis com editor visual e preview ao vivo."
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
      <div
        className="aurora-panel relative mb-5 overflow-hidden p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--aurora-pink) 18%, var(--card)), color-mix(in oklab, var(--aurora-peach) 14%, var(--card)))",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--aurora-pink) 70%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <Mascot variant="hero" size={84} glow />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Designer de mensagens encantadas
            </h2>
            <p className="text-sm text-muted-foreground">
              {rows.length === 0
                ? "Crie seu primeiro embed e use-o em qualquer módulo."
                : `${rows.length} template${rows.length === 1 ? "" : "s"} pront${rows.length === 1 ? "o" : "os"} para reaproveitar.`}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <AuroraStatCard label="Templates" value={rows.length} icon={FileCode2} tone="pink" />
        <AuroraStatCard
          label="Em edição"
          value={sel.id ? sel.name || "Sem nome" : "Novo"}
          icon={Palette}
          tone="peach"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <AuroraSection title="Seus templates" icon={FileCode2} tone="pink">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Mascot variant="sleeping" size={64} />
              <p className="text-xs text-muted-foreground">Nenhum template ainda.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {(rows as any[]).map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSel({ id: r.id, name: r.name, embed: r.embed })}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      sel.id === r.id
                        ? "bg-[color:color-mix(in_oklab,var(--aurora-pink)_22%,transparent)] text-foreground"
                        : "hover:bg-[color:color-mix(in_oklab,var(--aurora-pink)_10%,transparent)]"
                    }`}
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: r.embed?.color ?? "#5865F2" }}
                    />
                    <span className="truncate">{r.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AuroraSection>

        <div className="space-y-4">
          <AuroraSection title="Identificação" icon={Palette} tone="peach">
            <AuroraField label="Nome do template" hint="Use kebab-case, ex: aviso-staff">
              <Input
                value={sel.name}
                maxLength={64}
                onChange={(e) => setSel({ ...sel, name: e.target.value })}
                placeholder="ex: aviso-staff"
              />
            </AuroraField>
          </AuroraSection>

          <AuroraSection title="Editor visual" icon={FileCode2} tone="lavender">
            <EmbedEditor
              value={sel.embed}
              onChange={(v) => setSel({ ...sel, embed: v })}
            />
          </AuroraSection>

          {sel.id && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => del.mutate(sel.id!)}>
                <Trash2 className="mr-1.5 size-4" /> Excluir
              </Button>
            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
