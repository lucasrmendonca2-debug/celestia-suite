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

interface AutomodTabProps {
  guildId: string;
  initial: any;
}

export function AutomodTab({ guildId, initial }: AutomodTabProps) {
  const updateFn = useServerFn(updateAutomodConfig);
  const qc = useQueryClient();
  const [form, setForm] = useState(initial);

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
    <div className="space-y-4">
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
              onValueChange={(v) => setForm({ ...form, punishment: v })}
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
