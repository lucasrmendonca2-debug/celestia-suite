import { useState } from "react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Webhook, Save, Trash2, Wand2 } from "lucide-react";
import {
  createPanelWebhook,
  updatePanelWebhook,
  deletePanelWebhook,
  getTicketConfig,
} from "@/lib/guild/tickets.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChannelPicker } from "./DiscordPickers";

type Cfg = Awaited<ReturnType<typeof getTicketConfig>>;

export function WebhookCard({ guildId, cfg }: { guildId: string; cfg: Cfg }) {
  const create = useServerFn(createPanelWebhook);
  const update = useServerFn(updatePanelWebhook);
  const remove = useServerFn(deletePanelWebhook);
  const qc = useQueryClient();

  const [channelId, setChannelId] = useState(
    cfg.webhook_channel_id ?? cfg.panel_channel_id ?? "",
  );
  const [name, setName] = useState(cfg.webhook_name ?? "Central de Tickets");
  const [avatarUrl, setAvatarUrl] = useState(cfg.webhook_avatar_url ?? "");

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["ticket-config", guildId] });

  const creating = useMutation({
    mutationFn: () =>
      create({
        data: {
          guildId,
          channelId,
          name,
          avatarUrl: avatarUrl || null,
        },
      }),
    onSuccess: (r) => {
      toast.success(r.reused ? "Webhook atualizado." : "Webhook criado!");
      invalidate();
    },
    onError: (e) =>
      toast.error("Não consegui criar o webhook.", {
        description: (e as Error).message,
      }),
  });

  const updating = useMutation({
    mutationFn: () =>
      update({ data: { guildId, name, avatarUrl: avatarUrl || null } }),
    onSuccess: () => {
      toast.success("Webhook personalizado.");
      invalidate();
    },
    onError: (e) =>
      toast.error("Não consegui atualizar.", { description: (e as Error).message }),
  });

  const deleting = useMutation({
    mutationFn: () => remove({ data: { guildId } }),
    onSuccess: () => {
      toast.success("Webhook removido.");
      invalidate();
    },
    onError: (e) =>
      toast.error("Não consegui remover.", { description: (e as Error).message }),
  });

  const exists = !!cfg.webhook_id && !!cfg.webhook_token;

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Webhook className="size-4" /> Webhook do painel
          </h3>
          <p className="text-xs text-muted-foreground">
            O bot cria um webhook no canal escolhido e usa ele pra publicar o painel
            com nome e avatar personalizados.
          </p>
        </div>
        {exists && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
            ativo
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Canal</Label>
          <div className="mt-1">
            <ChannelPicker
              guildId={guildId}
              value={channelId || null}
              onChange={(v) => setChannelId(v ?? "")}
              types={[0, 5]}
              placeholder="Selecione o canal"
              allowEmpty={false}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Nome exibido</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Central de Tickets"
            maxLength={80}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">URL do avatar (opcional)</Label>
        <Input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…/imagem.png"
          className="mt-1 text-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {exists ? (
          <>
            <Button
              type="button"
              onClick={() => updating.mutate()}
              disabled={updating.isPending}
              className="gap-2"
            >
              <Save className="size-4" />
              {updating.isPending ? "Salvando…" : "Salvar personalização"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              disabled={deleting.isPending}
              onClick={() => {
                if (confirm("Apagar o webhook? O painel volta a ser enviado pelo bot.")) {
                  deleting.mutate();
                }
              }}
            >
              <Trash2 className="size-4" /> Apagar webhook
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={() => {
              if (!/^\d{5,32}$/.test(channelId)) {
                toast.error("Cole um ID de canal válido.");
                return;
              }
              creating.mutate();
            }}
            disabled={creating.isPending}
            className="gap-2"
          >
            <Wand2 className="size-4" />
            {creating.isPending ? "Criando…" : "Criar webhook"}
          </Button>
        )}
      </div>
    </div>
  );
}
