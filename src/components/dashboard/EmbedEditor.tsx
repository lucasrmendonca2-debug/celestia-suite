/**
 * Editor visual de embeds reutilizável com preview estilo Discord.
 * Estado é controlado pelo pai via value/onChange.
 */
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Bot } from "lucide-react";

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedData {
  title?: string;
  description?: string;
  color?: string; // hex
  url?: string;
  image?: string;
  thumbnail?: string;
  author?: { name?: string; icon_url?: string; url?: string };
  footer?: { text?: string; icon_url?: string };
  timestamp?: boolean;
  fields?: EmbedField[];
}

interface Props {
  value: EmbedData;
  onChange: (v: EmbedData) => void;
}

export function EmbedEditor({ value, onChange }: Props) {
  const update = (patch: Partial<EmbedData>) => onChange({ ...value, ...patch });
  const fields = value.fields ?? [];
  const id = useId();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
      {/* Editor */}
      <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <Field label="Título" htmlFor={`${id}-title`}>
            <Input
              id={`${id}-title`}
              value={value.title ?? ""}
              maxLength={256}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
          <Field label="Cor" htmlFor={`${id}-color`}>
            <div className="flex items-center gap-2">
              <input
                id={`${id}-color`}
                type="color"
                className="size-9 cursor-pointer rounded-md border border-border bg-transparent"
                value={value.color ?? "#5865F2"}
                onChange={(e) => update({ color: e.target.value })}
              />
              <Input
                value={value.color ?? "#5865F2"}
                onChange={(e) => update({ color: e.target.value })}
                className="font-mono text-xs"
              />
            </div>
          </Field>
        </div>

        <Field label="Descrição" htmlFor={`${id}-desc`}>
          <Textarea
            id={`${id}-desc`}
            rows={5}
            maxLength={4000}
            value={value.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="URL do título">
            <Input
              value={value.url ?? ""}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Imagem (URL)">
            <Input
              value={value.image ?? ""}
              onChange={(e) => update({ image: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Thumbnail (URL)">
            <Input
              value={value.thumbnail ?? ""}
              onChange={(e) => update({ thumbnail: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Autor">
            <Input
              value={value.author?.name ?? ""}
              onChange={(e) =>
                update({ author: { ...value.author, name: e.target.value } })
              }
            />
          </Field>
          <Field label="Footer">
            <Input
              value={value.footer?.text ?? ""}
              onChange={(e) =>
                update({ footer: { ...value.footer, text: e.target.value } })
              }
            />
          </Field>
          <Field label="Footer ícone (URL)">
            <Input
              value={value.footer?.icon_url ?? ""}
              onChange={(e) =>
                update({ footer: { ...value.footer, icon_url: e.target.value } })
              }
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Campos ({fields.length}/25)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fields.length >= 25}
              onClick={() =>
                update({
                  fields: [...fields, { name: "Novo campo", value: "—", inline: false }],
                })
              }
            >
              <Plus className="mr-1 size-3.5" /> Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div
                key={i}
                className="grid gap-2 rounded-md border border-border bg-background/40 p-2 sm:grid-cols-[1fr_2fr_auto_auto]"
              >
                <Input
                  value={f.name}
                  maxLength={256}
                  onChange={(e) => {
                    const next = [...fields];
                    next[i] = { ...f, name: e.target.value };
                    update({ fields: next });
                  }}
                  placeholder="Nome"
                />
                <Input
                  value={f.value}
                  maxLength={1024}
                  onChange={(e) => {
                    const next = [...fields];
                    next[i] = { ...f, value: e.target.value };
                    update({ fields: next });
                  }}
                  placeholder="Valor"
                />
                <label className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={!!f.inline}
                    onChange={(e) => {
                      const next = [...fields];
                      next[i] = { ...f, inline: e.target.checked };
                      update({ fields: next });
                    }}
                  />
                  inline
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover campo"
                  onClick={() => update({ fields: fields.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="size-4" />
                </Button>

              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview — Discord-style */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Pré-visualização
        </p>
        <div className="rounded-2xl border border-border bg-[#313338] p-4">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/90">
              <Bot className="size-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-white">Zenox</span>
                <span className="inline-flex items-center gap-1 rounded-sm bg-indigo-500 px-1.5 py-[1px] text-[10px] font-bold uppercase leading-none text-white">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M7.4 11.17L4.22 8l-1.05 1.05L7.4 13.3l8.4-8.42-1.06-1.05z" />
                  </svg>
                  APP
                </span>
                <span className="text-xs text-[#949ba4]">Hoje</span>
              </div>
              <div className="mt-1">
                <EmbedPreview embed={value} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function EmbedPreview({ embed }: { embed: EmbedData }) {
  const color = embed.color ?? "#5865F2";
  return (
    <div
      className="rounded-md bg-[#2b2d31] p-3 text-sm text-[#dbdee1]"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      {embed.author?.name && (
        <div className="mb-1 flex items-center gap-1.5 text-xs text-white">
          {embed.author.icon_url && (
            <img src={embed.author.icon_url} alt="" loading="lazy" decoding="async" className="size-5 rounded-full" />
          )}
          <span>{embed.author.name}</span>
        </div>
      )}
      {embed.title && (
        <p className="mb-1 font-semibold text-white">
          {embed.url ? (
            <a href={embed.url} className="text-[#00a8fc] hover:underline">
              {embed.title}
            </a>
          ) : (
            embed.title
          )}
        </p>
      )}
      {embed.description && (
        <p className="whitespace-pre-wrap text-sm">{embed.description}</p>
      )}
      {embed.fields && embed.fields.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {embed.fields.map((f, i) => (
            <div
              key={i}
              className={f.inline ? "col-span-1" : "col-span-3"}
              style={{ minWidth: 0 }}
            >
              <p className="text-xs font-semibold text-white">{f.name}</p>
              <p className="whitespace-pre-wrap text-xs">{f.value}</p>
            </div>
          ))}
        </div>
      )}
      {embed.image && (
        <img src={embed.image} alt="" loading="lazy" decoding="async" className="mt-2 max-h-56 rounded-md" />
      )}
      {embed.thumbnail && (
        <img
          src={embed.thumbnail} loading="lazy" decoding="async"
          alt=""
          className="float-right ml-2 size-16 rounded-md"
        />
      )}
      {embed.footer?.text && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#949ba4]">
          {embed.footer.icon_url && (
            <img src={embed.footer.icon_url} alt="" loading="lazy" decoding="async" className="size-4 rounded-full" />
          )}
          <span>{embed.footer.text}</span>
        </div>
      )}
    </div>
  );
}
