import { useState } from "react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import {
  listAccessLevels,
  upsertAccessLevel,
  deleteAccessLevel,
} from "@/lib/guild/tickets.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleBadge } from "@/components/dashboard/DiscordBadges";
import { ListSkeleton } from "./_skeletons";
import { Mascot } from "@/components/Mascot";

type Level = Awaited<ReturnType<typeof listAccessLevels>>[number];

const blank = (guildId: string): Level =>
  ({
    id: "",
    guild_id: guildId,
    key: "novo_nivel",
    name: "Novo nível",
    rank: 0,
    role_ids: [],
  }) as unknown as Level;

export function LevelsTab({ guildId }: { guildId: string }) {
  const list = useServerFn(listAccessLevels);
  const { data: levels = [], isLoading } = useQuery({
    queryKey: ["ticket-access-levels", guildId],
    queryFn: () => list({ data: { guildId } }),
  });
  const [editing, setEditing] = useState<Level | null>(null);

  if (isLoading) return <ListSkeleton rows={3} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Níveis de acesso</h3>
          <p className="text-xs text-muted-foreground">
            Cargos podem ser agrupados em níveis (ex: vip, staff, mod). Use as chaves nas categorias para limitar quem pode abrir.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing(blank(guildId))} className="gap-2">
          <Plus className="size-4" /> Novo nível
        </Button>
      </div>

      {levels.length === 0 ? (
        <Empty>Nenhum nível criado. Crie um para liberar categorias só pra certos cargos.</Empty>
      ) : (
        <div className="grid gap-2">
          {levels.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setEditing(l)}
              className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3 text-left transition hover:border-primary/40 hover:bg-card/60"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {l.name}{" "}
                  <span className="text-xs text-muted-foreground">({l.key})</span>
                  <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    rank {l.rank}
                  </span>
                </p>
                {l.role_ids.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nenhum cargo vinculado
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {l.role_ids.slice(0, 6).map((rid) => (
                      <RoleBadge key={rid} guildId={l.guild_id} roleId={rid} />
                    ))}
                    {l.role_ids.length > 6 && (
                      <span className="text-xs text-muted-foreground">
                        +{l.role_ids.length - 6}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <Editor guildId={guildId} level={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function Editor({
  guildId,
  level,
  onClose,
}: {
  guildId: string;
  level: Level;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertAccessLevel);
  const remove = useServerFn(deleteAccessLevel);
  const [l, setL] = useState(level);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["ticket-access-levels", guildId] });

  const saving = useMutation({
    mutationFn: () =>
      save({
        data: {
          guildId,
          id: l.id || undefined,
          key: l.key,
          name: l.name,
          rank: l.rank,
          role_ids: l.role_ids,
        },
      }),
    onSuccess: () => {
      toast.success("Nível salvo.");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleting = useMutation({
    mutationFn: () => remove({ data: { guildId, id: l.id } }),
    onSuccess: () => {
      toast.success("Nível removido.");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Modal onClose={onClose} title={l.id ? "Editar nível" : "Novo nível"}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Chave (use em categorias)">
            <Input
              value={l.key}
              onChange={(e) => setL({ ...l, key: e.target.value })}
              maxLength={60}
              className="font-mono text-xs"
            />
          </Field>
          <Field label="Nome amigável">
            <Input
              value={l.name}
              onChange={(e) => setL({ ...l, name: e.target.value })}
              maxLength={80}
            />
          </Field>
        </div>
        <Field label="Rank" hint="Maior rank vence quando o membro encaixa em vários níveis.">
          <Input
            type="number"
            min={0}
            max={1000}
            value={l.rank}
            onChange={(e) => setL({ ...l, rank: Number(e.target.value) || 0 })}
            className="max-w-[120px]"
          />
        </Field>
        <Field label="Cargos do Discord" hint="IDs separados por vírgula. Quem tem qualquer um deles entra nesse nível.">
          <Input
            value={l.role_ids.join(", ")}
            onChange={(e) =>
              setL({
                ...l,
                role_ids: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => /^\d{5,32}$/.test(s)),
              })
            }
            placeholder="ID1, ID2"
            className="font-mono text-xs"
          />
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {l.id ? (
          <ConfirmDeleteButton
            onConfirm={() => deleting.mutate()}
            title={`Apagar nível "${l.name}"?`}
            description="Membros podem perder o acesso configurado por esse nível."
            disabled={deleting.isPending}
            trigger={
              <Button
                variant="ghost"
                className="gap-2 text-destructive hover:text-destructive"
                disabled={deleting.isPending}
              >
                <Trash2 className="size-4" /> Apagar
              </Button>
            }
          />

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

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
