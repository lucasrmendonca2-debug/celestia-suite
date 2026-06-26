import { useServerFn } from "@tanstack/react-start";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  listOpenTickets,
  deleteActiveTicket,
} from "@/lib/guild/tickets.functions";
import { Button } from "@/components/ui/button";
import { ChannelBadge } from "@/components/dashboard/DiscordBadges";
import { ListSkeleton } from "./_skeletons";
import { Mascot } from "@/components/Mascot";

export function ActiveTicketsCard({ guildId }: { guildId: string }) {
  const list = useServerFn(listOpenTickets);
  const remove = useServerFn(deleteActiveTicket);
  const qc = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["ticket-active", guildId],
    queryFn: () => list({ data: { guildId } }),
  });

  const del = useMutation({
    mutationFn: (ticketId: string) => remove({ data: { guildId, ticketId } }),
    onSuccess: () => {
      toast.success("Ticket apagado.");
      qc.invalidateQueries({ queryKey: ["ticket-active", guildId] });
      qc.invalidateQueries({ queryKey: ["ticket-stats", guildId] });
    },
    onError: (e) =>
      toast.error("Não consegui apagar.", { description: (e as Error).message }),
  });

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Tickets ativos</h3>
          <p className="text-xs text-muted-foreground">
            Apague um ticket pra deletar o canal no Discord e encerrar o atendimento.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => qc.invalidateQueries({ queryKey: ["ticket-active", guildId] })}
        >
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-background/30 p-8 text-center text-sm text-muted-foreground">
          <Mascot variant="celebrate" size={64} />
          <p>Nenhum ticket aberto agora. Tudo em paz por aqui ✨</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {tickets.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {t.username}{" "}
                  {t.priority && (
                    <span className="ml-1 text-xs text-red-500">prioridade</span>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{t.category_name ?? "Geral"}</span>
                  <span>·</span>
                  <ChannelBadge guildId={guildId} channelId={t.channel_id} />
                </div>
              </div>
              <ConfirmDeleteButton
                onConfirm={() => del.mutate(t.id)}
                title={`Apagar ticket de ${t.username}?`}
                description="O canal do ticket será removido do Discord."
                confirmLabel="Apagar ticket"
                disabled={del.isPending}
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 text-destructive hover:text-destructive"
                    disabled={del.isPending}
                  >
                    <Trash2 className="size-4" /> Apagar
                  </Button>
                }
              />

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
