import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, RefreshCw, Trash2, ExternalLink, Palette, Image as ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  listGuildAssets,
  upsertGuildAsset,
  removeGuildAsset,
  type BotAssetRow,
} from "@/lib/guild/assets.functions";
import {
  ASSET_CATALOG,
  MODULE_LABEL,
  type AssetModule,
  type AssetSpec,
} from "@/lib/guild/assets.catalog";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import {
  AuroraSection,
  AuroraStatCard,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/assets")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    return { guildId, user };
  },
  component: AssetsPage,
});

const MODULES: AssetModule[] = [
  "GLOBAL",
  "WELCOME",
  "TICKETS",
  "ECONOMY",
  "SOCIAL",
  "PREMIUM",
  "FUN",
  "MODERATION",
  "LOGS",
];

function AssetsPage() {
  const { guildId } = Route.useLoaderData();
  const { user } = Route.useLoaderData();
  const qc = useQueryClient();
  const [active, setActive] = useState<AssetModule>("GLOBAL");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["bot-assets", guildId],
    queryFn: () => listGuildAssets({ data: { guildId } }),
  });

  const byKey = useMemo(() => {
    const m = new Map<string, BotAssetRow>();
    for (const r of rows) {
      const prev = m.get(r.key);
      if (!prev || r.guild_id === guildId) m.set(r.key, r);
    }
    return m;
  }, [rows, guildId]);

  const totalSpecs = ASSET_CATALOG.length;
  const filled = ASSET_CATALOG.filter((s) => byKey.get(s.key)?.url).length;
  const activeCount = ASSET_CATALOG.filter((s) => {
    const r = byKey.get(s.key);
    return r?.url && r.active;
  }).length;

  const upsert = useMutation({
    mutationFn: (v: { spec: AssetSpec; url: string; active?: boolean }) =>
      upsertGuildAsset({
        data: {
          guildId,
          key: v.spec.key,
          name: v.spec.name,
          module: v.spec.module,
          type: v.spec.type,
          url: v.url,
          active: v.active ?? true,
        },
      }),
    onSuccess: () => {
      toast.success("Asset salvo");
      qc.invalidateQueries({ queryKey: ["bot-assets", guildId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (key: string) => removeGuildAsset({ data: { guildId, key } }),
    onSuccess: () => {
      toast.success("Asset removido");
      qc.invalidateQueries({ queryKey: ["bot-assets", guildId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Palette}
      title="Identidade Visual"
      description="Cadastre imagens, banners e GIFs que o bot usa nos embeds. Cada item tem uma key estável."
    >
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
          <Mascot variant={filled > 0 ? "celebrate" : "hero"} size={84} glow />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Galeria mágica do bot
            </h2>
            <p className="text-sm text-muted-foreground">
              {filled === 0
                ? "Nenhum visual cadastrado ainda. Comece adicionando uma URL de imagem."
                : `${filled} de ${totalSpecs} visuais prontos para brilhar.`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ["bot-assets", guildId] })}
          >
            <RefreshCw className="mr-2 size-4" />
            Recarregar
          </Button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <AuroraStatCard label="Cadastrados" value={filled} icon={ImageIcon} tone="cyan" hint={`de ${totalSpecs} no catálogo`} />
        <AuroraStatCard label="Ativos" value={activeCount} icon={Sparkles} tone="mint" />
        <AuroraStatCard label="Módulos" value={MODULES.length} icon={Palette} tone="lavender" />
      </div>

      <AuroraSection title="Catálogo por módulo" icon={Palette} tone="cyan">
        <Tabs value={active} onValueChange={(v) => setActive(v as AssetModule)}>
          <TabsList className="flex w-full flex-wrap justify-start gap-1">
            {MODULES.map((m) => (
              <TabsTrigger key={m} value={m}>
                {MODULE_LABEL[m]}
              </TabsTrigger>
            ))}
          </TabsList>

          {MODULES.map((m) => {
            const specs = ASSET_CATALOG.filter((s) => s.module === m);
            return (
              <TabsContent key={m} value={m} className="mt-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando…</p>
                ) : specs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
                    <Mascot variant="sleeping" size={72} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nenhum asset definido para esse módulo ainda.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {specs.map((spec) => (
                      <AssetCard
                        key={spec.key}
                        spec={spec}
                        row={byKey.get(spec.key) ?? null}
                        saving={upsert.isPending}
                        onSave={(url, active) => upsert.mutate({ spec, url, active })}
                        onRemove={() => remove.mutate(spec.key)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </AuroraSection>
    </ModuleLayout>
  );
}

function AssetCard({
  spec,
  row,
  saving,
  onSave,
  onRemove,
}: {
  spec: AssetSpec;
  row: BotAssetRow | null;
  saving: boolean;
  onSave: (url: string, active: boolean) => void;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState(row?.url ?? "");
  const [active, setActive] = useState(row?.active ?? true);

  const dirty = url !== (row?.url ?? "") || active !== (row?.active ?? true);

  const copyKey = () => {
    navigator.clipboard.writeText(spec.key);
    toast.success("Key copiada");
  };

  const tone = url
    ? "color-mix(in oklab, var(--aurora-mint) 12%, var(--card))"
    : "color-mix(in oklab, var(--aurora-lavender) 8%, var(--card))";

  return (
    <div
      className="aurora-card-hover rounded-2xl border border-border/60 p-4"
      style={{ background: tone }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-sm font-semibold">{spec.name}</h3>
            <Badge variant="outline" className="text-[10px]">
              {spec.type}
            </Badge>
          </div>
          <button
            onClick={copyKey}
            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
            title="Copiar key"
          >
            <code className="font-mono">{spec.key}</code>
            <Copy className="size-3" />
          </button>
          {spec.recommendedSize && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tamanho sugerido: {spec.recommendedSize}
            </p>
          )}
        </div>
        {url ? (
          <div
            className="size-14 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted"
            style={{
              boxShadow: "inset 0 1px 0 color-mix(in oklab, white 25%, transparent)",
            }}
          >
            <img
              src={url}
              alt=""
              className="size-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")}
            />
          </div>
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-border/50 text-muted-foreground/60">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          placeholder="https://… URL da imagem/GIF"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        {url && (
          <Button asChild variant="outline" size="icon" title="Abrir URL">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-3.5 accent-primary"
          />
          Ativo
        </label>
        <div className="flex gap-2">
          {row && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="mr-1 size-3.5" />
              Remover
            </Button>
          )}
          <Button
            size="sm"
            disabled={!url || !dirty || saving}
            onClick={() => onSave(url, active)}
          >
            {row ? "Salvar" : (
              <>
                <Plus className="mr-1 size-3.5" />
                Adicionar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
