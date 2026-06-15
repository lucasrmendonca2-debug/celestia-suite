import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { getAutomodConfig, updateAutomodConfig } from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/automod")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    const config = await context.queryClient.ensureQueryData({
      queryKey: ["automod", params.guildId],
      queryFn: () => getAutomodConfig({ data: { guildId: params.guildId } }),
    });
    return { user, config };
  },
  component: AutomodPage,
});

function AutomodPage() {
  const { user, config } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const updateFn = useServerFn(updateAutomodConfig);
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(config);

  const mutation = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          guildId,
          anti_spam_enabled: form.anti_spam_enabled,
          anti_spam_threshold: Number(form.anti_spam_threshold),
          anti_spam_interval: Number(form.anti_spam_interval),
          anti_invite_enabled: form.anti_invite_enabled,
          anti_link_enabled: form.anti_link_enabled,
          anti_caps_enabled: form.anti_caps_enabled,
          anti_caps_threshold: Number(form.anti_caps_threshold),
          anti_mention_enabled: form.anti_mention_enabled,
          anti_mention_threshold: Number(form.anti_mention_threshold),
          blacklist_words: form.blacklist_words,
          whitelist_channels: form.whitelist_channels,
          whitelist_roles: form.whitelist_roles,
          punishment: form.punishment,
        },
      }),
    onSuccess: (saved) => {
      setForm(saved);
      qc.setQueryData(["automod", guildId], saved);
      toast.success("AutoMod salvo.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const parseList = (s: string) =>
    s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Lock}
      title="AutoMod"
      description="Proteção automática contra spam, links, invites, caps e palavras."
      actions={
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <Save className="mr-1.5 size-4" />
          {mutation.isPending ? "Salvando…" : "Salvar"}
        </Button>
      }
    >
      <div className="space-y-4">
        <Card>
          <ToggleRow
            label="Anti-spam"
            hint={`Bane / pune quem manda ${form.anti_spam_threshold} msgs em ${form.anti_spam_interval}s`}
            checked={form.anti_spam_enabled}
            onChange={(v) => setForm({ ...form, anti_spam_enabled: v })}
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <NumField
              label="Mensagens"
              value={form.anti_spam_threshold}
              onChange={(v) => setForm({ ...form, anti_spam_threshold: v })}
            />
            <NumField
              label="Janela (segundos)"
              value={form.anti_spam_interval}
              onChange={(v) => setForm({ ...form, anti_spam_interval: v })}
            />
          </div>
        </Card>

        <Card>
          <ToggleRow
            label="Anti-convite"
            hint="Bloqueia links discord.gg / discord.com/invite"
            checked={form.anti_invite_enabled}
            onChange={(v) => setForm({ ...form, anti_invite_enabled: v })}
          />
        </Card>

        <Card>
          <ToggleRow
            label="Anti-link"
            hint="Bloqueia qualquer URL"
            checked={form.anti_link_enabled}
            onChange={(v) => setForm({ ...form, anti_link_enabled: v })}
          />
        </Card>

        <Card>
          <ToggleRow
            label="Anti-caps"
            hint={`Pune msgs com mais de ${form.anti_caps_threshold}% maiúsculas`}
            checked={form.anti_caps_enabled}
            onChange={(v) => setForm({ ...form, anti_caps_enabled: v })}
          />
          <div className="mt-3">
            <NumField
              label="% mínima"
              value={form.anti_caps_threshold}
              onChange={(v) => setForm({ ...form, anti_caps_threshold: v })}
            />
          </div>
        </Card>

        <Card>
          <ToggleRow
            label="Anti-mention"
            hint={`Pune msgs com mais de ${form.anti_mention_threshold} mentions`}
            checked={form.anti_mention_enabled}
            onChange={(v) => setForm({ ...form, anti_mention_enabled: v })}
          />
          <div className="mt-3">
            <NumField
              label="Mentions máx"
              value={form.anti_mention_threshold}
              onChange={(v) => setForm({ ...form, anti_mention_threshold: v })}
            />
          </div>
        </Card>

        <Card>
          <Label className="text-sm font-medium">Palavras proibidas</Label>
          <p className="mt-1 mb-2 text-xs text-muted-foreground">
            Uma por linha ou separadas por vírgula.
          </p>
          <Textarea
            rows={4}
            value={(form.blacklist_words ?? []).join("\n")}
            onChange={(e) =>
              setForm({ ...form, blacklist_words: parseList(e.target.value) })
            }
          />
        </Card>

        <Card>
          <Label className="text-sm font-medium">Canais isentos (IDs)</Label>
          <Textarea
            rows={2}
            className="mt-2"
            value={(form.whitelist_channels ?? []).join("\n")}
            onChange={(e) =>
              setForm({ ...form, whitelist_channels: parseList(e.target.value) })
            }
          />
        </Card>

        <Card>
          <Label className="text-sm font-medium">Cargos isentos (IDs)</Label>
          <Textarea
            rows={2}
            className="mt-2"
            value={(form.whitelist_roles ?? []).join("\n")}
            onChange={(e) =>
              setForm({ ...form, whitelist_roles: parseList(e.target.value) })
            }
          />
        </Card>

        <Card>
          <Label className="text-sm font-medium">Punição padrão</Label>
          <Select
            value={form.punishment}
            onValueChange={(v) => setForm({ ...form, punishment: v })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delete">Apenas deletar</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="mute">Mute (timeout 10min)</SelectItem>
              <SelectItem value="kick">Kick</SelectItem>
              <SelectItem value="ban">Ban</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </div>
    </ModuleLayout>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5">{children}</div>;
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
