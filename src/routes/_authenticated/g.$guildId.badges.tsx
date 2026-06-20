import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Award, Plus, Trash2 } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import {
  deleteBadge,
  grantBadge,
  listBadges,
  revokeBadgeFn,
  upsertBadge,
} from "@/lib/guild/badges.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RARITY_BADGE: Record<string, string> = {
  common: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  uncommon: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  rare: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  epic: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
  legendary: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  mythic: "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

export const Route = createFileRoute("/_authenticated/g/$guildId/badges")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["badges", params.guildId],
      queryFn: () => listBadges({ data: { guildId: params.guildId } }),
    });
    return { user };
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
  const { guildId } = Route.useParams();
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
      description="Crie emblemas exclusivos pro seu servidor. Use raridades, cores e ícones pra dar identidade visual."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Lista */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Badges configuradas ({badges.data?.length ?? 0})
          </h3>
          {badges.data && badges.data.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {badges.data.map((b: any) => (
                <li key={b.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <span className="text-2xl">{b.emoji}</span>
                      <span>{b.name}</span>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${RARITY_BADGE[b.rarity] ?? RARITY_BADGE.common}`}
                    >
                      {b.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <code className="rounded bg-muted px-1">{b.code}</code> · cor{" "}
                    <span style={{ color: b.color }}>{b.color}</span>
                    {b.hidden && " · oculta"}
                  </p>
                  {b.description && <p className="text-sm">{b.description}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setForm({ ...b, icon_url: b.icon_url ?? "" })}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => delM.mutate(b.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma badge ainda. Crie a primeira ao lado!
            </p>
          )}

          {/* Conceder/Revogar */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Conceder / Revogar manual
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>ID do usuário</Label>
                <Input value={grantState.userId} onChange={(e) => setGrantState({ ...grantState, userId: e.target.value })} />
              </div>
              <div>
                <Label>Badge</Label>
                <Select value={grantState.badgeId} onValueChange={(v) => setGrantState({ ...grantState, badgeId: v })}>
                  <SelectTrigger><SelectValue placeholder="Escolher..." /></SelectTrigger>
                  <SelectContent>
                    {(badges.data ?? []).map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.emoji} {b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Motivo (opcional)</Label>
                <Input value={grantState.reason} onChange={(e) => setGrantState({ ...grantState, reason: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => grantM.mutate()} disabled={!grantState.userId || !grantState.badgeId || grantM.isPending}>
                Conceder
              </Button>
              <Button variant="outline" onClick={() => revokeM.mutate()} disabled={!grantState.userId || !grantState.badgeId || revokeM.isPending}>
                Revogar
              </Button>
            </div>
          </div>
        </section>

        {/* Form */}
        <aside className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {form.id ? "Editar badge" : "Nova badge"}
          </h3>
          <div className="space-y-3">
            <Field label="Código (slug)">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="welcome_member" />
            </Field>
            <Field label="Nome">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Descrição">
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Emoji"><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></Field>
              <Field label="Cor"><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#5865F2" /></Field>
            </div>
            <Field label="URL do ícone (opcional)">
              <Input value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="Raridade">
              <Select value={form.rarity} onValueChange={(v: any) => setForm({ ...form, rarity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["common", "uncommon", "rare", "epic", "legendary", "mythic"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/30 px-3 py-2">
              <span className="text-sm">Oculta (só aparece pra quem tem)</span>
              <Switch checked={form.hidden} onCheckedChange={(v) => setForm({ ...form, hidden: v })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveM.mutate()} disabled={!form.code || !form.name || saveM.isPending} className="flex-1">
                <Plus className="mr-2 size-4" /> {form.id ? "Salvar alterações" : "Criar badge"}
              </Button>
              {form.id && (
                <Button variant="outline" onClick={() => setForm(EMPTY)}>Cancelar</Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </ModuleLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
