import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trophy, Plus, Trash2, Play, Square } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  createSeason,
  deleteSeason,
  endSeason,
  getSeasonLeaderboard,
  listSeasons,
  setSeasonActive,
} from "@/lib/guild/seasons.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/seasons")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["seasons", params.guildId],
      queryFn: () => listSeasons({ data: { guildId: params.guildId } }),
    });
    return { user };
  },
  component: SeasonsPage,
});

function SeasonsPage() {
  const { guildId } = Route.useParams();
  const qc = useQueryClient();

  const { data: seasons } = useSuspenseQuery({
    queryKey: ["seasons", guildId],
    queryFn: () => listSeasons({ data: { guildId } }),
  });

  const createFn = useServerFn(createSeason);
  const setActiveFn = useServerFn(setSeasonActive);
  const endFn = useServerFn(endSeason);
  const deleteFn = useServerFn(deleteSeason);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["seasons", guildId] });

  const create = useMutation({
    mutationFn: async (vars: { name: string; description: string; xp_multiplier: number; ends_at: string | null; activate: boolean }) =>
      createFn({ data: { guildId, ...vars } }),
    onSuccess: () => { toast.success("Temporada criada"); setOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: async (vars: { id: string; active: boolean }) => setActiveFn({ data: { guildId, ...vars } }),
    onSuccess: invalidate,
  });
  const end = useMutation({
    mutationFn: async (id: string) => endFn({ data: { guildId, id } }),
    onSuccess: () => { toast.success("Temporada encerrada"); invalidate(); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { guildId, id } }),
    onSuccess: () => { toast.success("Temporada removida"); invalidate(); },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", xp_multiplier: 1.5, ends_at: "", activate: true });

  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ModuleLayout title="Temporadas" description="Períodos de XP com ranking independente e multiplicador.">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Cada temporada acumula XP em separado do total. Apenas uma pode estar ativa.
          </p>
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="size-4 mr-1" /> Nova temporada
          </Button>
        </div>

        {open && (
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold">Criar temporada</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Temporada de Verão" />
              </div>
              <div className="space-y-1">
                <Label>Multiplicador XP</Label>
                <Input type="number" step="0.1" min="0.1" max="10" value={form.xp_multiplier}
                  onChange={(e) => setForm({ ...form, xp_multiplier: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Termina em (opcional)</Label>
                <Input type="datetime-local" value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={form.activate} onCheckedChange={(v) => setForm({ ...form, activate: v })} />
                <Label>Ativar imediatamente</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button
                disabled={!form.name || create.isPending}
                onClick={() =>
                  create.mutate({
                    name: form.name,
                    description: form.description,
                    xp_multiplier: form.xp_multiplier,
                    ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
                    activate: form.activate,
                  })
                }
              >
                Criar
              </Button>
            </div>
          </div>
        )}

        {seasons.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/30 p-10 text-center">
            <Trophy className="size-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma temporada criada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {seasons.map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold truncate">{s.name}</h4>
                      {s.is_active && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">Ativa</Badge>}
                      <Badge variant="outline">×{Number(s.xp_multiplier).toFixed(2)}</Badge>
                    </div>
                    {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(s.starts_at).toLocaleDateString("pt-BR")}
                      {s.ends_at && ` → ${new Date(s.ends_at).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(selected === s.id ? null : s.id)}>
                      Ranking
                    </Button>
                    {s.is_active ? (
                      <Button size="sm" variant="ghost" onClick={() => end.mutate(s.id)}>
                        <Square className="size-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => toggle.mutate({ id: s.id, active: true })}>
                        <Play className="size-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(s.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {selected === s.id && <SeasonLeaderboard guildId={guildId} seasonId={s.id} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}

function SeasonLeaderboard({ guildId, seasonId }: { guildId: string; seasonId: string }) {
  const { data, isLoading } = useSuspenseQueryOrFetch(guildId, seasonId);
  if (isLoading) return <p className="text-sm text-muted-foreground mt-3">Carregando…</p>;
  if (!data || data.length === 0)
    return <p className="text-sm text-muted-foreground mt-3">Ninguém pontuou nesta temporada ainda.</p>;
  return (
    <div className="mt-4 rounded-md border border-border divide-y divide-border">
      {data.slice(0, 20).map((u, i) => (
        <div key={u.user_id} className="flex items-center justify-between px-3 py-2 text-sm">
          <span className="font-mono text-muted-foreground w-8">#{i + 1}</span>
          <span className="flex-1 font-mono text-xs truncate">{u.user_id}</span>
          <span className="font-semibold">{u.xp.toLocaleString("pt-BR")} XP</span>
          <span className="text-muted-foreground ml-3">Nv. {u.level}</span>
        </div>
      ))}
    </div>
  );
}

function useSuspenseQueryOrFetch(guildId: string, seasonId: string) {
  const getFn = useServerFn(getSeasonLeaderboard);
  // Wrap useQuery for lazy fetch on expand
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useQuery } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
  return useQuery({
    queryKey: ["season-lb", seasonId],
    queryFn: () => getFn({ data: { guildId, seasonId } }),
  });
}
