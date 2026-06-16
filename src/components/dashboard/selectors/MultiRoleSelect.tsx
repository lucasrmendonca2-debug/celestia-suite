import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
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
import { listGuildRoles } from "@/lib/guild/discord-resources.functions";

interface Props {
  guildId: string;
  value: string[];
  onChange: (ids: string[]) => void;
  excludeManaged?: boolean;
  placeholder?: string;
}

function hex(color: number) {
  if (!color) return "#99aab5";
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function MultiRoleSelect({
  guildId,
  value,
  onChange,
  excludeManaged = false,
  placeholder = "Adicionar cargos",
}: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["guild-roles", guildId],
    queryFn: () => listGuildRoles({ data: { guildId } }),
    staleTime: 60_000,
  });

  const roles = (data ?? []).filter((r) => (excludeManaged ? !r.managed : true));
  const byId = new Map(roles.map((r) => [r.id, r]));

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const r = byId.get(id);
            return (
              <Badge key={id} variant="secondary" className="gap-1.5 pr-1">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: r ? hex(r.color) : "#99aab5" }}
                />
                {r?.name ?? id}
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
            <CommandInput placeholder="Buscar cargo…" />
            <CommandList>
              <CommandEmpty>Nenhum cargo.</CommandEmpty>
              <CommandGroup>
                {roles.map((r) => {
                  const checked = value.includes(r.id);
                  return (
                    <CommandItem
                      key={r.id}
                      value={r.name}
                      onSelect={() => toggle(r.id)}
                    >
                      <span
                        className="mr-2 inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: hex(r.color) }}
                      />
                      <span className="flex-1">{r.name}</span>
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
