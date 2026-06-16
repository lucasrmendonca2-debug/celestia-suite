import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hash, Volume2, Megaphone, MessagesSquare, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listGuildChannels,
  type DiscordChannel,
} from "@/lib/guild/discord-resources.functions";

interface Props {
  guildId: string;
  value: string | null;
  onChange: (id: string | null) => void;
  /** Tipos permitidos. Padrão: textuais (0, 5, 15). */
  allowedTypes?: number[];
  placeholder?: string;
  disabled?: boolean;
}

const TYPE_ICON: Record<number, typeof Hash> = {
  0: Hash,
  2: Volume2,
  5: Megaphone,
  15: MessagesSquare,
};

const DEFAULT_TEXT = [0, 5, 15];

export function ChannelSelect({
  guildId,
  value,
  onChange,
  allowedTypes = DEFAULT_TEXT,
  placeholder = "Selecione um canal",
  disabled,
}: Props) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["guild-channels", guildId],
    queryFn: () => listGuildChannels({ data: { guildId } }),
    staleTime: 60_000,
  });

  const grouped = useMemo(() => {
    if (!data) return [] as { category: string; items: DiscordChannel[] }[];
    const allowed = new Set(allowedTypes);
    const cats = new Map<string, string>();
    data.filter((c) => c.type === 4).forEach((c) => cats.set(c.id, c.name));
    const buckets = new Map<string, DiscordChannel[]>();
    for (const c of data) {
      if (!allowed.has(c.type)) continue;
      const key = c.parent_id ? cats.get(c.parent_id) ?? "Sem categoria" : "Sem categoria";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(c);
    }
    return [...buckets.entries()].map(([category, items]) => ({ category, items }));
  }, [data, allowedTypes]);

  return (
    <Select
      value={value ?? "__none__"}
      onValueChange={(v) => onChange(v === "__none__" ? null : v)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={
            isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Carregando canais…
              </span>
            ) : isError ? (
              <span className="text-destructive">
                {(error as Error)?.message?.includes("403")
                  ? "Bot sem acesso ao servidor"
                  : "Erro ao carregar canais"}
              </span>
            ) : (
              placeholder
            )
          }
        />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="__none__">
          <span className="text-muted-foreground">— Nenhum —</span>
        </SelectItem>
        {grouped.map((g) => (
          <SelectGroup key={g.category}>
            <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {g.category}
            </SelectLabel>
            {g.items.map((c) => {
              const Icon = TYPE_ICON[c.type] ?? Hash;
              return (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <Icon className="size-3.5 text-muted-foreground" />
                    {c.name}
                  </span>
                </SelectItem>
              );
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
