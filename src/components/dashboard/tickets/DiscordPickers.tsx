import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronsUpDown, Hash, Volume2, Megaphone, Folder, MessagesSquare, AtSign } from "lucide-react";
import {
  listGuildChannels,
  listGuildRoles,
  type GuildChannel,
  type GuildRole,
} from "@/lib/guild/tickets.functions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

function channelIcon(type: number) {
  switch (type) {
    case 0:
      return Hash;
    case 2:
      return Volume2;
    case 4:
      return Folder;
    case 5:
      return Megaphone;
    case 15:
      return MessagesSquare;
    default:
      return Hash;
  }
}

interface ChannelPickerProps {
  guildId: string;
  value: string | null;
  onChange: (id: string | null) => void;
  /** filter by channel type. 0 = text only, 4 = category only. Default: text. */
  types?: number[];
  placeholder?: string;
  allowEmpty?: boolean;
}

export function ChannelPicker({
  guildId,
  value,
  onChange,
  types = [0, 5],
  placeholder = "Selecione um canal",
  allowEmpty = true,
}: ChannelPickerProps) {
  const fetcher = useServerFn(listGuildChannels);
  const { data = [], isLoading } = useQuery({
    queryKey: ["guild-channels", guildId],
    queryFn: () => fetcher({ data: { guildId } }),
    staleTime: 60_000,
  });
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const set = new Set(types);
    const ql = q.trim().toLowerCase();
    return (data as GuildChannel[])
      .filter((c) => set.has(c.type))
      .filter((c) => (ql ? c.name.toLowerCase().includes(ql) : true))
      .sort((a, b) => a.position - b.position);
  }, [data, types, q]);

  const selected = (data as GuildChannel[]).find((c) => c.id === value);
  const Icon = selected ? channelIcon(selected.type) : Hash;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <Icon className="size-3.5 shrink-0 opacity-60" />
            <span className="truncate">
              {selected ? selected.name : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar canal…"
          className="mb-2 h-8 text-xs"
        />
        <div className="max-h-60 overflow-y-auto">
          {allowEmpty && (
            <Row
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              active={!value}
            >
              <span className="text-muted-foreground">— sem canal —</span>
            </Row>
          )}
          {isLoading ? (
            <p className="p-2 text-xs text-muted-foreground">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">Nenhum canal.</p>
          ) : (
            filtered.map((c) => {
              const I = channelIcon(c.type);
              return (
                <Row
                  key={c.id}
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                  active={c.id === value}
                >
                  <I className="size-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{c.name}</span>
                </Row>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface RolePickerProps {
  guildId: string;
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  allowEmpty?: boolean;
}

export function RolePicker({
  guildId,
  value,
  onChange,
  placeholder = "Selecione um cargo",
  allowEmpty = true,
}: RolePickerProps) {
  const fetcher = useServerFn(listGuildRoles);
  const { data = [], isLoading } = useQuery({
    queryKey: ["guild-roles", guildId],
    queryFn: () => fetcher({ data: { guildId } }),
    staleTime: 60_000,
  });
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (data as GuildRole[])
      .filter((r) => !r.managed)
      .filter((r) => (ql ? r.name.toLowerCase().includes(ql) : true));
  }, [data, q]);

  const selected = (data as GuildRole[]).find((r) => r.id === value);
  const swatch = selected
    ? `#${selected.color.toString(16).padStart(6, "0")}`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {swatch && swatch !== "#000000" ? (
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: swatch }}
              />
            ) : (
              <AtSign className="size-3.5 shrink-0 opacity-60" />
            )}
            <span className="truncate">
              {selected ? `@${selected.name}` : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cargo…"
          className="mb-2 h-8 text-xs"
        />
        <div className="max-h-60 overflow-y-auto">
          {allowEmpty && (
            <Row
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              active={!value}
            >
              <span className="text-muted-foreground">— sem cargo —</span>
            </Row>
          )}
          {isLoading ? (
            <p className="p-2 text-xs text-muted-foreground">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">Nenhum cargo.</p>
          ) : (
            filtered.map((r) => {
              const color = `#${r.color.toString(16).padStart(6, "0")}`;
              return (
                <Row
                  key={r.id}
                  onClick={() => {
                    onChange(r.id);
                    setOpen(false);
                  }}
                  active={r.id === value}
                >
                  {color !== "#000000" ? (
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ) : (
                    <AtSign className="size-3.5 shrink-0 opacity-60" />
                  )}
                  <span className="truncate">@{r.name}</span>
                </Row>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Multi-role picker for required/blocked arrays. */
export function MultiRolePicker({
  guildId,
  value,
  onChange,
}: {
  guildId: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const fetcher = useServerFn(listGuildRoles);
  const { data = [], isLoading } = useQuery({
    queryKey: ["guild-roles", guildId],
    queryFn: () => fetcher({ data: { guildId } }),
    staleTime: 60_000,
  });
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (data as GuildRole[])
      .filter((r) => !r.managed)
      .filter((r) => (ql ? r.name.toLowerCase().includes(ql) : true));
  }, [data, q]);
  const selected = (data as GuildRole[]).filter((r) => value.includes(r.id));

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(value.filter((id) => id !== r.id))}
              className="group flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-xs hover:border-destructive/40"
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{
                  backgroundColor:
                    r.color === 0
                      ? "var(--muted-foreground)"
                      : `#${r.color.toString(16).padStart(6, "0")}`,
                }}
              />
              @{r.name}
              <span className="text-muted-foreground group-hover:text-destructive">×</span>
            </button>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-2">
            <AtSign className="size-3.5" /> Adicionar cargo
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cargo…"
            className="mb-2 h-8 text-xs"
          />
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <p className="p-2 text-xs text-muted-foreground">Carregando…</p>
            ) : filtered.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">Nenhum cargo.</p>
            ) : (
              filtered.map((r) => {
                const isOn = value.includes(r.id);
                return (
                  <Row
                    key={r.id}
                    onClick={() => {
                      onChange(
                        isOn ? value.filter((id) => id !== r.id) : [...value, r.id],
                      );
                    }}
                    active={isOn}
                  >
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          r.color === 0
                            ? "var(--muted-foreground)"
                            : `#${r.color.toString(16).padStart(6, "0")}`,
                      }}
                    />
                    <span className="truncate">@{r.name}</span>
                    {isOn && <Check className="ml-auto size-3.5 opacity-70" />}
                  </Row>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Row({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition ${
        active ? "bg-primary/10 text-foreground" : "hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
