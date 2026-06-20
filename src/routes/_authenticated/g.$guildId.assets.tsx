import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, RefreshCw, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/g/$guildId/assets")({
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
  const { guildId } = Route.useParams();
  const qc = useQueryClient();
  const [active, setActive] = useState<AssetModule>("GLOBAL");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["bot-assets", guildId],
    queryFn: () => listGuildAssets({ data: { guildId } }),
  });

  const byKey = useMemo(() => {
    const m = new Map<string, BotAssetRow>();
    for (const r of rows) {
      // priorizar row da guild atual
      const prev = m.get(r.key);
      if (!prev || r.guild_id === guildId) m.set(r.key, r);
    }
    return m;
  }, [rows, guildId]);

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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Identidade Visual</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre URLs de imagens, banners e GIFs que o bot usa nos embeds.
            Cada item tem uma <strong>key</strong> estável que os comandos chamam.
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
                <p className="text-sm text-muted-foreground">
                  Nenhum asset cadastrado para esse módulo ainda.
                </p>
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
    </div>
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

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{spec.name}</h3>
            <Badge variant="outline" className="text-[10px]">
              {spec.type}
            </Badge>
          </div>
          <button
            onClick={copyKey}
            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
        {url && (
          <div className="size-14 shrink-0 overflow-hidden rounded border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="size-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")}
            />
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
