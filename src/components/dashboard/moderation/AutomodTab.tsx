import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, ShieldAlert } from "lucide-react";
import { getAutomodConfig, updateAutomodConfig } from "@/lib/guild/modules.functions";
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
import { MultiChannelPicker, MultiRolePicker } from "@/components/dashboard/tickets/DiscordPickers";

type AutomodPunishment = "delete" | "warn" | "mute" | "kick" | "ban";

interface AutomodForm {
  enabled?: boolean;
  anti_spam_enabled: boolean;
  anti_spam_threshold: number;
  anti_spam_interval: number;
  anti_flood_enabled?: boolean;
  anti_flood_threshold?: number;
  anti_invite_enabled: boolean;
  anti_link_enabled: boolean;
  anti_caps_enabled: boolean;
  anti_caps_threshold: number;
  anti_mention_enabled: boolean;
  anti_mention_threshold: number;
  blacklist_words: string[];
  whitelist_channels: string[];
  whitelist_roles: string[];
  whitelist_users?: string[];
  punishment: AutomodPunishment;
  spam_punishment?: AutomodPunishment;
  link_punishment?: AutomodPunishment;
  invite_punishment?: AutomodPunishment;
  blacklist_punishment?: AutomodPunishment;
  spam_punishment_duration?: number;
  warn_user_on_delete?: boolean;
}

interface AutomodTabProps {
  guildId: string;
  initial: AutomodForm;
}

export function AutomodTab({ guildId, initial }: AutomodTabProps) {
  const updateFn = useServerFn(updateAutomodConfig);
  const qc = useQueryClient();
  const [form, setForm] = useState<AutomodForm>(initial);

  const mutation = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          guildId,
          enabled: form.enabled ?? false,
          anti_spam_enabled: form.anti_spam_enabled,
          anti_spam_threshold: Number(form.anti_spam_threshold),
          anti_spam_interval: Number(form.anti_spam_interval),
          anti_flood_enabled: form.anti_flood_enabled ?? false,
          anti_flood_threshold: Number(form.anti_flood_threshold) || 3,
          anti_invite_enabled: form.anti_invite_enabled,
          anti_link_enabled: form.anti_link_enabled,
          anti_caps_enabled: form.anti_caps_enabled,
          anti_caps_threshold: Number(form.anti_caps_threshold),
          anti_mention_enabled: form.anti_mention_enabled,
          anti_mention_threshold: Number(form.anti_mention_threshold),
          blacklist_words: form.blacklist_words,
          whitelist_channels: form.whitelist_channels,
          whitelist_roles: form.whitelist_roles,
          whitelist_users: form.whitelist_users ?? [],
          punishment: form.punishment,
          spam_punishment: form.spam_punishment ?? form.punishment,
          link_punishment: form.link_punishment ?? form.punishment,
          invite_punishment: form.invite_punishment ?? form.punishment,
          blacklist_punishment: form.blacklist_punishment ?? form.punishment,
          spam_punishment_duration: Number(form.spam_punishment_duration) || 600,
          warn_user_on_delete: form.warn_user_on_delete ?? true,
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
    <div className="space-y-4">
      <SectionCard title="AutoMod geral">
        <ToggleRow
          label="AutoMod ativado"
          checked={form.enabled ?? false}
          onChange={(v) => setForm({ ...form, enabled: v })}
        />
        <ToggleRow
          label="Avisar usuário ao deletar mensagem"
          checked={form.warn_user_on_delete ?? true}
          onChange={(v) => setForm({ ...form, warn_user_on_delete: v })}
        />
      </SectionCard>

      <SectionCard title="Spam e Caps">
        <ToggleRow
          label="Anti-spam"
          hint={`Punição automática se o usuário enviar ${form.anti_spam_threshold} msgs em ${form.anti_spam_interval}s`}
          checked={form.anti_spam_enabled}
          onChange={(v) => setForm({ ...form, anti_spam_enabled: v })}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Limite de mensagens</Label>
            <Input
              type="number"
              value={form.anti_spam_threshold}
              onChange={(e) => setForm({ ...form, anti_spam_threshold: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Janela de tempo (segundos)</Label>
            <Input
              type="number"
              value={form.anti_spam_interval}
              onChange={(e) => setForm({ ...form, anti_spam_interval: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="mt-6">
          <ToggleRow
            label="Anti-flood"
            hint={`Detecta repetição rápida acima de ${form.anti_flood_threshold ?? 3} mensagens`}
            checked={form.anti_flood_enabled ?? false}
            onChange={(v) => setForm({ ...form, anti_flood_enabled: v })}
          />
          <div className="mt-3">
            <Label className="text-xs">Limite de flood</Label>
            <Input
              type="number"
              className="max-w-[200px]"
              value={form.anti_flood_threshold ?? 3}
              onChange={(e) => setForm({ ...form, anti_flood_threshold: Number(e.target.value) || 3 })}
            />
          </div>
        </div>

        <div className="mt-6">
          <ToggleRow
            label="Anti-caps"
            hint={`Detecta msgs com mais de ${form.anti_caps_threshold}% de caracteres maiúsculos`}
            checked={form.anti_caps_enabled}
            onChange={(v) => setForm({ ...form, anti_caps_enabled: v })}
          />
          <div className="mt-3">
            <Label className="text-xs">Porcentagem mínima</Label>
            <Input
              type="number"
              className="max-w-[200px]"
              value={form.anti_caps_threshold}
              onChange={(e) => setForm({ ...form, anti_caps_threshold: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Links e Menções">
        <div className="space-y-4">
          <ToggleRow
            label="Anti-convite"
            hint="Bloqueia links de convite do Discord (discord.gg, etc)"
            checked={form.anti_invite_enabled}
            onChange={(v) => setForm({ ...form, anti_invite_enabled: v })}
          />
          <ToggleRow
            label="Anti-link"
            hint="Bloqueia qualquer tipo de URL externa"
            checked={form.anti_link_enabled}
            onChange={(v) => setForm({ ...form, anti_link_enabled: v })}
          />
          <div className="pt-2">
            <ToggleRow
              label="Anti-menções"
              hint={`Limite de ${form.anti_mention_threshold} menções por mensagem`}
              checked={form.anti_mention_enabled}
              onChange={(v) => setForm({ ...form, anti_mention_enabled: v })}
            />
            <div className="mt-3">
              <Label className="text-xs">Máximo de menções</Label>
              <Input
                type="number"
                className="max-w-[200px]"
                value={form.anti_mention_threshold}
                onChange={(e) => setForm({ ...form, anti_mention_threshold: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Filtros de Palavras">
        <Label className="text-sm">Blacklist de palavras</Label>
        <p className="mt-1 mb-2 text-xs text-muted-foreground">
          Palavras que o AutoMod deve filtrar. Uma por linha ou separadas por vírgula.
        </p>
        <Textarea
          rows={4}
          value={(form.blacklist_words ?? []).join("\n")}
          onChange={(e) =>
            setForm({ ...form, blacklist_words: parseList(e.target.value) })
          }
        />
      </SectionCard>

      <SectionCard title="Exceções e Punição">
        <div className="space-y-4">
          <div>
            <Label className="text-sm">Canais isentos</Label>
            <div className="mt-1">
              <MultiChannelPicker
                guildId={guildId}
                value={form.whitelist_channels ?? []}
                onChange={(v) => setForm({ ...form, whitelist_channels: v })}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm">Cargos isentos</Label>
            <div className="mt-1">
              <MultiRolePicker
                guildId={guildId}
                value={form.whitelist_roles ?? []}
                onChange={(v) => setForm({ ...form, whitelist_roles: v })}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm">Punição do AutoMod</Label>
            <Select
              value={form.punishment}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  punishment: v,
                  spam_punishment: v,
                  link_punishment: v,
                  invite_punishment: v,
                  blacklist_punishment: v,
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delete">Apenas deletar mensagem</SelectItem>
                <SelectItem value="warn">Dar advertência (Warn)</SelectItem>
                <SelectItem value="mute">Mute temporário (10 min)</SelectItem>
                <SelectItem value="kick">Expulsar do servidor</SelectItem>
                <SelectItem value="ban">Banir permanentemente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Duração da punição temporária (segundos)</Label>
            <Input
              type="number"
              min={60}
              value={form.spam_punishment_duration ?? 600}
              onChange={(e) =>
                setForm({ ...form, spam_punishment_duration: Number(e.target.value) || 600 })
              }
              className="mt-1 max-w-[240px]"
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          size="lg"
        >
          {mutation.isPending ? "Salvando…" : "Salvar AutoMod"}
          <Save className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card/50 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <ShieldAlert className="size-4" />
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
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
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-background/40 p-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
