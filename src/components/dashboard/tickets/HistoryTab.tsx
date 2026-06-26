import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { History, RefreshCw } from "lucide-react";
import { listTicketLogs } from "@/lib/guild/tickets.functions";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "./_skeletons";
import { Mascot } from "@/components/Mascot";

const ACTION_META: Record<string, { label: string; emoji: string; color: string }> = {
  opened: { label: "Aberto", emoji: "🟢", color: "text-emerald-300" },
  closed: { label: "Fechado", emoji: "🔴", color: "text-rose-300" },
  reopened: { label: "Reaberto", emoji: "🔓", color: "text-emerald-300" },
  claimed: { label: "Assumido", emoji: "✋", color: "text-amber-300" },
  user_added: { label: "Usuário adicionado", emoji: "➕", color: "text-sky-300" },
  user_removed: { label: "Usuário removido", emoji: "➖", color: "text-zinc-300" },
};

export function HistoryTab({ guildId }: { guildId: string }) {
  const fetcher = useServerFn(listTicketLogs);
  const { data = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["ticket-logs", guildId],
    queryFn: () => fetcher({ data: { guildId, limit: 100 } }),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Últimas 100 ações</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
          <Mascot variant="sleeping" size={72} />
          <p>
            Nenhuma ação registrada ainda.<br />
            Abra um ticket no Discord pra começar a história.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card/40">
          <ul className="divide-y divide-border">
            {data.map((row) => {
              const meta = ACTION_META[row.action] ?? {
                label: row.action,
                emoji: "•",
                color: "text-muted-foreground",
              };
              return (
                <li key={row.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-lg">{meta.emoji}</span>
                    <div className="min-w-0">
                      <p className={`font-medium ${meta.color}`}>{meta.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        por <code className="font-mono">{row.user_id}</code>
                        {row.ticket_id && (
                          <>
                            {" "}
                            · ticket <code className="font-mono">{row.ticket_id.slice(0, 8)}</code>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("pt-BR")}
                  </time>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
