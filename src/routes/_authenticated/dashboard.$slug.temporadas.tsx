import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Trophy,
  Plus,
  Trash2,
  Play,
  Square,
  Crown,
  Medal,
  Award,
  Sparkles,
  Flame,
  CalendarRange,
} from "lucide-react";
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
import {
  AuroraSection,
  AuroraStatCard,
  AuroraField,
} from "@/components/dashboard/aurora-ui";
import { Mascot } from "@/components/Mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/g/$guildId/temporadas")({
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
  const { user } = Route.useLoaderData();
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

  const activeSeason = seasons.find((s) => s.is_active);
  const total = seasons.length;
  const finished = seasons.filter((s) => !s.is_active).length;

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Trophy}
      title="Temporadas"
      description="Períodos de XP com ranking independente e multiplicador mágico."
    >
      <div
        className="aurora-panel relative mb-5 overflow-hidden p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--aurora-peach) 18%, var(--card)), color-mix(in oklab, var(--aurora-pink) 14%, var(--card)))",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--aurora-peach) 70%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <Mascot variant={activeSeason ? "celebrate" : "hero"} size={84} glow />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              {activeSeason ? `Em curso: ${activeSeason.name}` : "Nenhuma temporada ativa"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeSeason
                ? `Boost de XP ×${Number(activeSeason.xp_multiplier).toFixed(2)} para todos os membros.`
                : "Crie uma nova temporada para iniciar um ranking competitivo."}
            </p>
          </div>
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="mr-1 size-4" /> Nova temporada
          </Button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <AuroraStatCard label="Total" value={total} icon={Trophy} tone="peach" />
        <AuroraStatCard label="Ativa" value={activeSeason ? 1 : 0} icon={Flame} tone="pink" hint={activeSeason?.name} />
        <AuroraStatCard label="Encerradas" value={finished} icon={CalendarRange} tone="lavender" />
      </div>

      {open && (
        <AuroraSection title="Criar temporada" icon={Sparkles} tone="pink" className="mb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <AuroraField label="Nome">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Temporada de Verão" />
            </AuroraField>
            <AuroraField label="Multiplicador XP" hint="0.1 a 10x">
              <Input type="number" step="0.1" min="0.1" max="10" value={form.xp_multiplier}
                onChange={(e) => setForm({ ...form, xp_multiplier: Number(e.target.value) })} />
            </AuroraField>
            <div className="sm:col-span-2">
              <AuroraField label="Descrição">
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </AuroraField>
            </div>
            <AuroraField label="Termina em (opcional)">
              <Input type="datetime-local" value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </AuroraField>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={form.activate} onCheckedChange={(v) => setForm({ ...form, activate: v })} />
              <Label>Ativar imediatamente</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
              {create.isPending ? "Criando…" : "Criar temporada"}
            </Button>
          </div>
        </AuroraSection>
      )}

      <AuroraSection title={`Histórico (${total})`} icon={Trophy} tone="peach">
        {seasons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
            <Mascot variant="sleeping" size={84} />
            <p className="mt-3 font-medium">Nenhuma temporada criada ainda</p>
            <p className="text-sm text-muted-foreground">Comece a primeira competição da sua comunidade!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {seasons.map((s) => (
              <div
                key={s.id}
                className="aurora-card-hover rounded-2xl border border-border/60 p-4"
                style={{
                  background: s.is_active
                    ? "linear-gradient(135deg, color-mix(in oklab, var(--aurora-mint) 14%, var(--card)), color-mix(in oklab, var(--aurora-cyan) 8%, var(--card)))"
                    : "color-mix(in oklab, var(--card) 80%, transparent)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate font-display text-base font-semibold">{s.name}</h4>
                      {s.is_active && (
                        <Badge className="border-[color:var(--aurora-mint)]/40 bg-[color:color-mix(in_oklab,var(--aurora-mint)_25%,transparent)] text-foreground">
                          <Flame className="mr-1 size-3" /> Ativa
                        </Badge>
                      )}
                      <Badge variant="outline">×{Number(s.xp_multiplier).toFixed(2)}</Badge>
                    </div>
                    {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(s.starts_at).toLocaleDateString("pt-BR")}
                      {s.ends_at && ` → ${new Date(s.ends_at).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(selected === s.id ? null : s.id)}>
                      <Trophy className="mr-1 size-3.5" /> Ranking
                    </Button>
                    {s.is_active ? (
                      <Button size="icon" variant="ghost" onClick={() => end.mutate(s.id)} title="Encerrar">
                        <Square className="size-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => toggle.mutate({ id: s.id, active: true })} title="Ativar">
                        <Play className="size-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)} title="Remover">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {selected === s.id && <SeasonLeaderboard guildId={guildId} seasonId={s.id} />}
              </div>
            ))}
          </div>
        )}
      </AuroraSection>
    </ModuleLayout>
  );
}

const PODIUM = [
  { icon: Crown, tone: "var(--aurora-peach)" },
  { icon: Medal, tone: "var(--aurora-lavender)" },
  { icon: Award, tone: "var(--aurora-pink)" },
];

function SeasonLeaderboard({ guildId, seasonId }: { guildId: string; seasonId: string }) {
  const getFn = useServerFn(getSeasonLeaderboard);
  const { data, isLoading } = useQuery({
    queryKey: ["season-lb", seasonId],
    queryFn: () => getFn({ data: { guildId, seasonId } }),
  });

  if (isLoading) return <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>;
  if (!data || data.length === 0)
    return <p className="mt-3 text-sm text-muted-foreground">Ninguém pontuou nesta temporada ainda.</p>;

  return (
    <div className="mt-4 space-y-1.5">
      {data.slice(0, 20).map((u, i) => {
        const podium = PODIUM[i];
        const Icon = podium?.icon;
        return (
          <div
            key={u.user_id}
            className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2 text-sm"
            style={
              podium
                ? {
                    background: `linear-gradient(90deg, color-mix(in oklab, ${podium.tone} 18%, transparent), transparent 60%)`,
                  }
                : undefined
            }
          >
            <span className="flex w-8 items-center justify-center font-mono text-xs text-muted-foreground">
              {Icon ? <Icon className="size-4" style={{ color: podium!.tone }} /> : `#${i + 1}`}
            </span>
            <span className="flex-1 truncate font-mono text-xs">{u.user_id}</span>
            <span className="font-display font-semibold">{u.xp.toLocaleString("pt-BR")} XP</span>
            <span className="ml-2 text-xs text-muted-foreground">Nv. {u.level}</span>
          </div>
        );
      })}
    </div>
  );
}
