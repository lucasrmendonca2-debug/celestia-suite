import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Award, Plus, Trash2, Sparkles, Gift, EyeOff } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  deleteBadge,
  grantBadge,
  listBadges,
  revokeBadgeFn,
  upsertBadge,
} from "@/lib/guild/badges.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
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
import {
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RARITY_STYLE: Record<string, { label: string; ring: string; bg: string }> = {
  common: {
    label: "Comum",
    ring: "ring-zinc-400/50",
    bg: "linear-gradient(135deg, color-mix(in oklab, var(--muted) 60%, transparent), transparent)",
  },
  uncommon: {
    label: "Incomum",
    ring: "ring-[color:var(--aurora-mint)]/60",
    bg: "linear-gradient(135deg, color-mix(in oklab, var(--aurora-mint) 32%, transparent), transparent)",
  },
  rare: {
    label: "Raro",
    ring: "ring-[color:var(--aurora-cyan)]/60",
    bg: "linear-gradient(135deg, color-mix(in oklab, var(--aurora-cyan) 32%, transparent), transparent)",
  },
  epic: {
    label: "Épico",
    ring: "ring-[color:var(--aurora-lavender)]/70",
    bg: "linear-gradient(135deg, color-mix(in oklab, var(--aurora-lavender) 35%, transparent), color-mix(in oklab, var(--aurora-pink) 20%, transparent))",
  },
  legendary: {
    label: "Lendário",
    ring: "ring-[color:var(--aurora-peach)]/70",
    bg: "linear-gradient(135deg, color-mix(in oklab, var(--aurora-peach) 38%, transparent), color-mix(in oklab, var(--aurora-pink) 22%, transparent))",
  },
  mythic: {
    label: "Mítico",
    ring: "ring-[color:var(--aurora-pink)]/80",
    bg: "linear-gradient(135deg, color-mix(in oklab, var(--aurora-pink) 40%, transparent), color-mix(in oklab, var(--aurora-lavender) 28%, transparent))",
  },
};

export const Route = createFileRoute("/_authenticated/dashboard/$slug/badges")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guildId = resolveGuildIdFromSlug(params.slug, guilds);
    if (!guildId) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["badges", guildId],
      queryFn: () => listBadges({ data: { guildId: guildId } }),
    });
    return { guildId, user };
  },
  component: BadgesPage,
});

interface BadgeForm {
  id?: string;
  code: string;
  name: string;
  description: string;
  emoji: string;
  icon_url: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  color: string;
  hidden: boolean;
}

const EMPTY: BadgeForm = {
  code: "",
  name: "",
  description: "",
  emoji: "🏅",
  icon_url: "",
  rarity: "common",
  color: "#5865F2",
  hidden: false,
};

function BadgesPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useLoaderData();
  const qc = useQueryClient();

  const save = useServerFn(upsertBadge);
  const del = useServerFn(deleteBadge);
  const grant = useServerFn(grantBadge);
  const revoke = useServerFn(revokeBadgeFn);

  const [form, setForm] = useState<BadgeForm>(EMPTY);
  const [grantState, setGrantState] = useState({ userId: "", badgeId: "", reason: "" });

  const badges = useSuspenseQuery({
    queryKey: ["badges", guildId],
    queryFn: () => listBadges({ data: { guildId } }),
  });

  const list = (badges.data ?? []) as any[];
  const total = list.length;
  const hidden = list.filter((b) => b.hidden).length;

  const saveM = useMutation({
    mutationFn: () =>
      save({
        data: {
          guildId,
          id: form.id,
          code: form.code,
          name: form.name,
          description: form.description,
          emoji: form.emoji,
          icon_url: form.icon_url || null,
          rarity: form.rarity,
          color: form.color,
          hidden: form.hidden,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Badge atualizada." : "Badge criada.");
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ["badges", guildId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });

  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { guildId, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["badges", guildId] }),
  });

  const grantM = useMutation({
    mutationFn: () =>
      grant({
        data: {
          guildId,
          userId: grantState.userId,
          badgeId: grantState.badgeId,
          reason: grantState.reason || undefined,
        },
      }),
    onSuccess: (r: any) => {
      toast.success(r?.alreadyHad ? "Usuário já possuía essa badge." : "Badge concedida.");
      setGrantState({ userId: "", badgeId: "", reason: "" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro."),
  });

  const revokeM = useMutation({
    mutationFn: () =>
      revoke({ data: { guildId, userId: grantState.userId, badgeId: grantState.badgeId } }),
    onSuccess: () => toast.success("Badge removida."),
    onError: (e: any) => toast.error(e?.message ?? "Erro."),
  });

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Award}
      title="Badges"
      description="Crie emblemas únicos pro seu servidor — com raridades, cores e brilho mágico."
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
          <Mascot variant={total > 0 ? "celebrate" : "hero"} size={84} glow />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">
              Coleção de emblemas
            </h2>
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? "Crie a primeira badge e comece a recompensar seus membros."
                : `${total} badge${total === 1 ? "" : "s"} pront${total === 1 ? "a" : "as"} para distribuir.`}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <AuroraStatCard label="Total" value={total} icon={Award} tone="peach" />
        <AuroraStatCard label="Visíveis" value={total - hidden} icon={Sparkles} tone="mint" />
        <AuroraStatCard label="Ocultas" value={hidden} icon={EyeOff} tone="lavender" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <AuroraSection title={`Configuradas (${total})`} icon={Award} tone="peach">
            {list.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {list.map((b: any) => {
                  const r = RARITY_STYLE[b.rarity] ?? RARITY_STYLE.common;
                  return (
                    <li
                      key={b.id}
                      className={`aurora-card-hover space-y-2 rounded-2xl border border-border/60 p-4 ring-1 ${r.ring}`}
                      style={{ background: r.bg }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-base font-semibold">
                          <span
                            className="flex size-10 items-center justify-center rounded-xl text-2xl"
                            style={{
                              background: `color-mix(in oklab, ${b.color} 25%, transparent)`,
                              boxShadow:
                                "inset 0 1px 0 color-mix(in oklab, white 30%, transparent)",
                            }}
                          >
                            {b.emoji}
                          </span>
                          <span className="font-display">{b.name}</span>
                        </div>
                        <span className="rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                          {r.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <code className="rounded bg-muted px-1">{b.code}</code>
                        {b.hidden && " · oculta"}
                      </p>
                      {b.description && <p className="text-sm">{b.description}</p>}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setForm({ ...b, icon_url: b.icon_url ?? "" })}
                        >
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => delM.mutate(b.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Mascot variant="sleeping" size={72} />
                <p className="text-sm text-muted-foreground">
                  Nenhuma badge ainda. Crie a primeira ao lado!
                </p>
              </div>
            )}
          </AuroraSection>

          <AuroraSection title="Conceder / Revogar manual" icon={Gift} tone="pink">
            <div className="grid gap-3 md:grid-cols-2">
              <AuroraField label="ID do usuário">
                <Input
                  value={grantState.userId}
                  onChange={(e) => setGrantState({ ...grantState, userId: e.target.value })}
                />
              </AuroraField>
              <AuroraField label="Badge">
                <Select
                  value={grantState.badgeId}
                  onValueChange={(v) => setGrantState({ ...grantState, badgeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolher..." />
                  </SelectTrigger>
                  <SelectContent>
                    {list.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.emoji} {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AuroraField>
              <div className="md:col-span-2">
                <AuroraField label="Motivo (opcional)">
                  <Input
                    value={grantState.reason}
                    onChange={(e) => setGrantState({ ...grantState, reason: e.target.value })}
                  />
                </AuroraField>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => grantM.mutate()}
                disabled={!grantState.userId || !grantState.badgeId || grantM.isPending}
              >
                Conceder
              </Button>
              <Button
                variant="outline"
                onClick={() => revokeM.mutate()}
                disabled={!grantState.userId || !grantState.badgeId || revokeM.isPending}
              >
                Revogar
              </Button>
            </div>
          </AuroraSection>
        </div>

        <AuroraSection
          title={form.id ? "Editar badge" : "Nova badge"}
          icon={Plus}
          tone="lavender"
        >
          <AuroraField label="Código (slug)">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="welcome_member"
            />
          </AuroraField>
          <AuroraField label="Nome">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </AuroraField>
          <AuroraField label="Descrição">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </AuroraField>
          <div className="grid grid-cols-2 gap-3">
            <AuroraField label="Emoji">
              <Input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              />
            </AuroraField>
            <AuroraField label="Cor">
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-10 w-14 p-1"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="font-mono"
                />
              </div>
            </AuroraField>
          </div>
          <AuroraField label="URL do ícone (opcional)">
            <Input
              value={form.icon_url}
              onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
              placeholder="https://..."
            />
          </AuroraField>
          <AuroraField label="Raridade">
            <Select
              value={form.rarity}
              onValueChange={(v: any) => setForm({ ...form, rarity: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RARITY_STYLE).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AuroraField>
          <AuroraSwitchRow
            label="Oculta"
            hint="Só aparece para quem já recebeu."
            checked={form.hidden}
            onChange={(v) => setForm({ ...form, hidden: v })}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => saveM.mutate()}
              disabled={!form.code || !form.name || saveM.isPending}
              className="flex-1"
            >
              <Plus className="mr-2 size-4" />
              {form.id ? "Salvar alterações" : "Criar badge"}
            </Button>
            {form.id && (
              <Button variant="outline" onClick={() => setForm(EMPTY)}>
                Cancelar
              </Button>
            )}
          </div>
        </AuroraSection>
      </div>
    </ModuleLayout>
  );
}
