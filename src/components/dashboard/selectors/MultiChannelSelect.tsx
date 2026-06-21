import { useQuery } from "@tanstack/react-query";
import { Hash, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { listGuildChannels } from "@/lib/guild/discord-resources.functions";

interface Props {
  guildId: string;
  value: string[];
  onChange: (ids: string[]) => void;
  /** Tipos permitidos. Padrão: textuais (0, 5, 15). */
  allowedTypes?: number[];
  placeholder?: string;
}

const DEFAULT_TEXT = [0, 5, 15];

export function MultiChannelSelect({
  guildId,
  value,
  onChange,
  allowedTypes = DEFAULT_TEXT,
  placeholder = "Adicionar canais",
}: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["guild-channels", guildId],
    queryFn: () => listGuildChannels({ data: { guildId } }),
    staleTime: 60_000,
  });

  const allowed = new Set(allowedTypes);
  const channels = (data ?? []).filter((c) => allowed.has(c.type));
  const byId = new Map(channels.map((c) => [c.id, c]));

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const c = byId.get(id);
            return (
              <Badge key={id} variant="secondary" className="gap-1.5 pr-1">
                <Hash className="size-3" />
                {c?.name ?? id}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="ml-1 rounded p-0.5 hover:bg-background"
                  aria-label="Remover"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading} className="w-full justify-start">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" /> Carregando…
              </>
            ) : (
              placeholder
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar canal…" />
            <CommandList>
              <CommandEmpty>Nenhum canal.</CommandEmpty>
              <CommandGroup>
                {channels.map((c) => {
                  const checked = value.includes(c.id);
                  return (
                    <CommandItem key={c.id} value={c.name} onSelect={() => toggle(c.id)}>
                      <Hash className="mr-2 size-3.5 text-muted-foreground" />
                      <span className="flex-1">{c.name}</span>
                      {checked && <span className="text-xs text-primary">✓</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
