import { useState } from "react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save, AlertCircle, Sparkles } from "lucide-react";
import {
  listTicketCategories,
  upsertTicketCategory,
  deleteTicketCategory,
  seedTicketTemplates,
} from "@/lib/guild/tickets.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChannelPicker, MultiRolePicker, RolePicker } from "./DiscordPickers";

type Category = Awaited<ReturnType<typeof listTicketCategories>>[number];

const blank = (guildId: string): Category =>
  ({
    id: "",
    guild_id: guildId,
    name: "Suporte",
    description: "",
    emoji: "🎫",
    support_role_id: null,
    discord_category_id: null,
    active: true,
    priority: false,
    required_role_ids: [],
    blocked_role_ids: [],
    allowed_access_levels: [],
    max_open_tickets_per_user: null,
    welcome_message: null,
    position: 0,
    created_at: "",
    updated_at: "",
  }) as unknown as Category;

export function CategoriesTab({ guildId }: { guildId: string }) {
  const list = useServerFn(listTicketCategories);
  const seed = useServerFn(seedTicketTemplates);
  const qc = useQueryClient();
  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["ticket-categories", guildId],
    queryFn: () => list({ data: { guildId } }),
  });
  const [editing, setEditing] = useState<Category | null>(null);

  const seeding = useMutation({
    mutationFn: () => seed({ data: { guildId } }),
    onSuccess: (r) => {
      toast.success(
        r.inserted > 0
          ? `${r.inserted} categorias-modelo adicionadas.`
          : "Você já tem categorias — nada a fazer.",
      );
      qc.invalidateQueries({ queryKey: ["ticket-categories", guildId] });
    },
    onError: (e) =>
      toast.error("Não consegui carregar os modelos.", {
        description: (e as Error).message,
      }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Categorias de ticket</h3>
          <p className="text-xs text-muted-foreground">
            Cada categoria aparece no menu dropdown do painel.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => seeding.mutate()}
            disabled={seeding.isPending || cats.length > 0}
            className="gap-2"
            title={
              cats.length > 0
                ? "Você já tem categorias criadas"
                : "Cria Suporte, Dúvida, Denúncia e Parcerias"
            }
          >
            <Sparkles className="size-4" />
            {seeding.isPending ? "Carregando…" : "Carregar modelos"}
          </Button>
          <Button size="sm" onClick={() => setEditing(blank(guildId))} className="gap-2">
            <Plus className="size-4" /> Nova categoria
          </Button>
        </div>
      </div>

      {cats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
          Nenhuma categoria ainda. Use <strong>Carregar modelos</strong> para começar com tipos prontos
          (Suporte, Dúvida, Denúncia, Parcerias) ou crie a sua.
        </div>
      ) : (
        <div className="grid gap-2">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setEditing(c)}
              className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3 text-left transition hover:border-primary/40 hover:bg-card/60"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.emoji || "🎫"}</span>
                <div>
                  <p className="text-sm font-medium">
                    {c.name}{" "}
                    {!c.active && <span className="text-xs text-muted-foreground">(inativa)</span>}
                    {c.priority && <span className="ml-2 text-xs text-red-500">prioridade</span>}
                  </p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">posição {c.position}</span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <CategoryEditor
          guildId={guildId}
          category={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function CategoryEditor({
  guildId,
  category,
  onClose,
}: {
  guildId: string;
  category: Category;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertTicketCategory);
  const remove = useServerFn(deleteTicketCategory);
  const [c, setC] = useState(category);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["ticket-categories", guildId] });

  const saving = useMutation({
    mutationFn: () =>
      save({
        data: {
          guildId,
          id: c.id || undefined,
          name: c.name,
          description: c.description ?? null,
          emoji: c.emoji || "🎫",
          support_role_id: emptyToNull(c.support_role_id),
          discord_category_id: emptyToNull(c.discord_category_id),
          active: c.active,
          priority: c.priority,
          required_role_ids: c.required_role_ids ?? [],
          blocked_role_ids: c.blocked_role_ids ?? [],
          allowed_access_levels: c.allowed_access_levels ?? [],
          max_open_tickets_per_user: c.max_open_tickets_per_user ?? null,
          welcome_message: c.welcome_message ?? null,
          position: c.position ?? 0,
        },
      }),
    onSuccess: () => {
      toast.success("Categoria salva.");
      invalidate();
      onClose();
    },
    onError: (e) =>
      toast.error("Não consegui salvar.", { description: (e as Error).message }),
  });

  const deleting = useMutation({
    mutationFn: () => remove({ data: { guildId, id: c.id } }),
    onSuccess: () => {
      toast.success("Categoria removida.");
      invalidate();
      onClose();
    },
    onError: (e) =>
      toast.error("Não consegui remover.", { description: (e as Error).message }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {c.id ? "Editar categoria" : "Nova categoria"}
          </h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[80px_1fr]">
            <Labeled label="Emoji">
              <Input
                value={c.emoji ?? "🎫"}
                onChange={(e) => setC({ ...c, emoji: e.target.value })}
                maxLength={8}
              />
            </Labeled>
            <Labeled label="Nome">
              <Input
                value={c.name}
                onChange={(e) => setC({ ...c, name: e.target.value })}
                maxLength={80}
              />
            </Labeled>
          </div>

          <Labeled label="Descrição (opcional)">
            <Textarea
              rows={2}
              value={c.description ?? ""}
              onChange={(e) => setC({ ...c, description: e.target.value })}
              maxLength={500}
            />
          </Labeled>

          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label="Cargo de suporte" hint="Sobrescreve o cargo global.">
              <RolePicker
                guildId={guildId}
                value={c.support_role_id}
                onChange={(v) => setC({ ...c, support_role_id: v })}
                placeholder="Cargo padrão do servidor"
              />
            </Labeled>
            <Labeled label="Categoria Discord" hint="Onde criar o canal.">
              <ChannelPicker
                guildId={guildId}
                value={c.discord_category_id}
                onChange={(v) => setC({ ...c, discord_category_id: v })}
                types={[4]}
                placeholder="Categoria padrão"
              />
            </Labeled>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label="Posição" hint="Ordem no painel (menor primeiro).">
              <Input
                type="number"
                min={0}
                max={999}
                value={c.position}
                onChange={(e) => setC({ ...c, position: Number(e.target.value) || 0 })}
              />
            </Labeled>
            <Labeled
              label="Limite por usuário"
              hint="Vazio = usa o limite global."
            >
              <Input
                type="number"
                min={1}
                max={20}
                value={c.max_open_tickets_per_user ?? ""}
                onChange={(e) =>
                  setC({
                    ...c,
                    max_open_tickets_per_user: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </Labeled>
          </div>

          <SwitchRow
            title="Ativa"
            desc="Quando desligada, some do painel."
            checked={c.active}
            onChange={(v) => setC({ ...c, active: v })}
          />
          <SwitchRow
            title="Prioridade"
            desc="Botão fica em vermelho no painel."
            checked={c.priority}
            onChange={(v) => setC({ ...c, priority: v })}
          />

          <Labeled
            label="Cargos obrigatórios"
            hint="Só quem tem pelo menos UM desses cargos pode abrir. Vazio = todos."
          >
            <MultiRolePicker
              guildId={guildId}
              value={c.required_role_ids ?? []}
              onChange={(v) => setC({ ...c, required_role_ids: v })}
            />
          </Labeled>
          <Labeled
            label="Cargos bloqueados"
            hint="Quem tem qualquer desses cargos é impedido."
          >
            <MultiRolePicker
              guildId={guildId}
              value={c.blocked_role_ids ?? []}
              onChange={(v) => setC({ ...c, blocked_role_ids: v })}
            />
          </Labeled>
          <KeyListField
            label="Níveis de acesso permitidos"
            hint="Use as chaves da aba Níveis. Vazio = todos."
            value={c.allowed_access_levels ?? []}
            onChange={(v) => setC({ ...c, allowed_access_levels: v })}
          />

          <Labeled
            label="Mensagem de boas-vindas (opcional)"
            hint="Se preenchida, sobrescreve a global para essa categoria. Suporta {user}."
          >
            <Textarea
              rows={3}
              value={c.welcome_message ?? ""}
              onChange={(e) => setC({ ...c, welcome_message: e.target.value })}
              maxLength={2000}
            />
          </Labeled>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {c.id ? (
            <Button
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
              disabled={deleting.isPending}
              onClick={() => {
                if (confirm(`Apagar categoria "${c.name}"?`)) deleting.mutate();
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
            <Button
              onClick={() => saving.mutate()}
              disabled={saving.isPending}
              className="gap-2"
            >
              <Save className="size-4" />
              {saving.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>

        {saving.isError && (
          <p className="mt-3 flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="size-3" /> {(saving.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}

function Labeled({
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

function SwitchRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/40 p-3">
      <div>
        <Label className="text-sm font-medium">{title}</Label>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function IdListField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Labeled label={label} hint={hint}>
      <Input
        value={value.join(", ")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => /^\d{5,32}$/.test(s)),
          )
        }
        placeholder="ID1, ID2, ID3"
        className="font-mono text-xs"
      />
    </Labeled>
  );
}

function KeyListField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Labeled label={label} hint={hint}>
      <Input
        value={value.join(", ")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        placeholder="ex: vip, staff, mod"
        className="text-xs"
      />
    </Labeled>
  );
}

function emptyToNull(v: string | null | undefined) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}
