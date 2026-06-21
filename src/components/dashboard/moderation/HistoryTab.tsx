import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { History, Search, Pencil, X, Loader2 } from "lucide-react";
import {
  listModerationCases,
  editModerationCaseReason,
  invalidateModerationCase,
} from "@/lib/guild/moderation.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserBadge } from "@/components/dashboard/DiscordBadges";

const ACTION_COLORS: Record<string, string> = {
  BAN: "bg-red-500/20 text-red-300",
  TEMP_BAN: "bg-red-500/10 text-red-300",
  UNBAN: "bg-emerald-500/20 text-emerald-300",
  KICK: "bg-orange-500/20 text-orange-300",
  MUTE: "bg-amber-500/20 text-amber-300",
  TEMP_MUTE: "bg-amber-500/10 text-amber-300",
  UNMUTE: "bg-emerald-500/10 text-emerald-300",
  WARN: "bg-yellow-500/20 text-yellow-300",
  REMOVEWARN: "bg-emerald-500/10 text-emerald-300",
  NOTE: "bg-violet-500/20 text-violet-300",
  PURGE: "bg-slate-500/20 text-slate-300",
  CLEAR: "bg-slate-500/20 text-slate-300",
  NICKNAME: "bg-blue-500/20 text-blue-300",
};

export function HistoryTab({ guildId }: { guildId: string }) {
  const [userFilter, setUserFilter] = useState("");
  const [modFilter, setModFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const list = useServerFn(listModerationCases);
  const editFn = useServerFn(editModerationCaseReason);
  const invalidateFn = useServerFn(invalidateModerationCase);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["mod-cases", guildId, userFilter, modFilter, actionFilter],
    queryFn: () =>
      list({
        data: {
          guildId,
          userId: userFilter.match(/^\d{5,32}$/) ? userFilter : null,
          moderatorId: modFilter.match(/^\d{5,32}$/) ? modFilter : null,
          action: actionFilter || null,
          limit: 100,
        },
      }),
  });

  const [editing, setEditing] = useState<{ caseNumber: number; reason: string } | null>(
    null,
  );
  const [editText, setEditText] = useState("");

  const editMut = useMutation({
    mutationFn: (input: { caseNumber: number; reason: string }) =>
      editFn({
        data: {
          guildId,
          caseNumber: input.caseNumber,
          reason: input.reason,
          editorId: "dashboard",
        },
      }),
    onSuccess: () => {
      toast.success("Motivo atualizado");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["mod-cases", guildId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invalidMut = useMutation({
    mutationFn: (caseNumber: number) =>
      invalidateFn({ data: { guildId, caseNumber } }),
    onSuccess: () => {
      toast.success("Caso marcado como inativo");
      qc.invalidateQueries({ queryKey: ["mod-cases", guildId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = query.data ?? [];

  return (
    <section className="rounded-xl border bg-card/50 p-5">
      <div className="mb-4 flex items-center gap-2">
        <History className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico de moderação
        </h3>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Input
          placeholder="ID do usuário"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value.trim())}
        />
        <Input
          placeholder="ID do moderador"
          value={modFilter}
          onChange={(e) => setModFilter(e.target.value.trim())}
        />
        <Input
          placeholder="Ação (ex: WARN, BAN, NOTE)"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value.trim().toUpperCase())}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          {query.isFetching ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Search className="mr-2 size-4" />
          )}
          Atualizar
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background/40">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Ação</th>
              <th className="px-3 py-2 text-left">Usuário</th>
              <th className="px-3 py-2 text-left">Moderador</th>
              <th className="px-3 py-2 text-left">Motivo</th>
              <th className="px-3 py-2 text-left">Quando</th>
              <th className="px-3 py-2 text-left">Origem</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !query.isLoading && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum caso encontrado.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/10">
                <td className="px-3 py-2 font-mono text-xs">#{r.case_number}</td>
                <td className="px-3 py-2">
                  <Badge className={ACTION_COLORS[r.action] ?? ""}>{r.action}</Badge>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {r.user_tag ?? r.user_id}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {r.moderator_tag ?? r.moderator_id}
                </td>
                <td className="px-3 py-2 max-w-[280px] truncate" title={r.reason ?? ""}>
                  {r.reason || <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-xs">
                  <Badge variant="outline">{r.source}</Badge>
                  {!r.active && (
                    <Badge variant="outline" className="ml-1 opacity-60">
                      inativo
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing({ caseNumber: r.case_number, reason: r.reason ?? "" });
                      setEditText(r.reason ?? "");
                    }}
                  >
                    <Pencil className="size-3" />
                  </Button>
                  {r.active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => invalidMut.mutate(r.case_number)}
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar motivo do caso #{editing?.caseNumber}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                editing &&
                editMut.mutate({ caseNumber: editing.caseNumber, reason: editText })
              }
              disabled={editMut.isPending || !editText.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
