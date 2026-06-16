import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import {
  listPermissionRoles,
  upsertPermissionRole,
  deletePermissionRole,
} from "@/lib/guild/tickets.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Modal, Field, Empty } from "./LevelsTab";

type Perm = Awaited<ReturnType<typeof listPermissionRoles>>[number];

const blank = (guildId: string): Perm =>
  ({
    id: "",
    guild_id: guildId,
    role_id: "",
    access_level: "member",
    can_view_panel: true,
    can_open_ticket: true,
    can_open_priority_ticket: false,
    can_close_ticket: false,
    can_reopen_ticket: false,
    can_delete_ticket: false,
    can_claim_ticket: false,
    can_add_user: false,
    can_remove_user: false,
    can_generate_transcript: false,
    can_view_history: false,
    can_view_ratings: false,
    can_manage_config: false,
  }) as unknown as Perm;

const TOGGLES: { key: keyof Perm; label: string; hint?: string }[] = [
  { key: "can_open_ticket", label: "Abrir ticket" },
  { key: "can_open_priority_ticket", label: "Abrir prioritário" },
  { key: "can_close_ticket", label: "Fechar ticket (mesmo sem ser dono)" },
  { key: "can_reopen_ticket", label: "Reabrir ticket" },
  { key: "can_delete_ticket", label: "Apagar ticket" },
  { key: "can_claim_ticket", label: "Assumir ticket" },
  { key: "can_add_user", label: "Adicionar usuário ao ticket" },
  { key: "can_remove_user", label: "Remover usuário do ticket" },
  { key: "can_generate_transcript", label: "Gerar transcript" },
  { key: "can_view_history", label: "Ver histórico" },
  { key: "can_view_ratings", label: "Ver avaliações" },
  { key: "can_manage_config", label: "Gerenciar configuração" },
];

export function PermissionsTab({ guildId }: { guildId: string }) {
  const list = useServerFn(listPermissionRoles);
  const { data: perms = [], isLoading } = useQuery({
    queryKey: ["ticket-permission-roles", guildId],
    queryFn: () => list({ data: { guildId } }),
  });
  const [editing, setEditing] = useState<Perm | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Permissões por cargo</h3>
          <p className="text-xs text-muted-foreground">
            Diga o que cada cargo pode fazer e a qual nível de acesso ele pertence.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing(blank(guildId))} className="gap-2">
          <Plus className="size-4" /> Adicionar cargo
        </Button>
      </div>

      {perms.length === 0 ? (
        <Empty>Nenhum cargo configurado ainda.</Empty>
      ) : (
        <div className="grid gap-2">
          {perms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setEditing(p)}
              className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3 text-left transition hover:border-primary/40 hover:bg-card/60"
            >
              <div>
                <p className="font-mono text-xs text-muted-foreground">{p.role_id}</p>
                <p className="text-sm font-medium">
                  nível: <span className="font-mono">{p.access_level}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {TOGGLES.filter((t) => p[t.key]).length} permissão(ões)
              </p>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <Editor guildId={guildId} perm={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function Editor({
  guildId,
  perm,
  onClose,
}: {
  guildId: string;
  perm: Perm;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertPermissionRole);
  const remove = useServerFn(deletePermissionRole);
  const [p, setP] = useState(perm);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["ticket-permission-roles", guildId] });

  const saving = useMutation({
    mutationFn: () =>
      save({
        data: {
          guildId,
          id: p.id || undefined,
          role_id: p.role_id,
          access_level: p.access_level,
          can_view_panel: p.can_view_panel,
          can_open_ticket: p.can_open_ticket,
          can_open_priority_ticket: p.can_open_priority_ticket,
          can_close_ticket: p.can_close_ticket,
          can_reopen_ticket: p.can_reopen_ticket,
          can_delete_ticket: p.can_delete_ticket,
          can_claim_ticket: p.can_claim_ticket,
          can_add_user: p.can_add_user,
          can_remove_user: p.can_remove_user,
          can_generate_transcript: p.can_generate_transcript,
          can_view_history: p.can_view_history,
          can_view_ratings: p.can_view_ratings,
          can_manage_config: p.can_manage_config,
        },
      }),
    onSuccess: () => {
      toast.success("Permissão salva.");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleting = useMutation({
    mutationFn: () => remove({ data: { guildId, id: p.id } }),
    onSuccess: () => {
      toast.success("Removido.");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Modal onClose={onClose} title={p.id ? "Editar cargo" : "Novo cargo"}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ID do cargo">
            <Input
              value={p.role_id}
              onChange={(e) => setP({ ...p, role_id: e.target.value })}
              placeholder="123456789012345678"
              className="font-mono text-xs"
            />
          </Field>
          <Field label="Nível de acesso" hint="Use uma chave da aba Níveis (ex: vip, staff).">
            <Input
              value={p.access_level}
              onChange={(e) => setP({ ...p, access_level: e.target.value })}
              className="font-mono text-xs"
            />
          </Field>
        </div>

        <div className="space-y-2">
          {TOGGLES.map((t) => (
            <div
              key={String(t.key)}
              className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-3"
            >
              <Label className="text-sm">{t.label}</Label>
              <Switch
                checked={Boolean(p[t.key])}
                onCheckedChange={(v) => setP({ ...p, [t.key]: v } as Perm)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {p.id ? (
          <Button
            variant="ghost"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={deleting.isPending}
            onClick={() => {
              if (confirm("Apagar essa permissão?")) deleting.mutate();
            }}
          >
            <Trash2 className="size-4" /> Apagar
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => saving.mutate()} disabled={saving.isPending} className="gap-2">
            <Save className="size-4" /> {saving.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
