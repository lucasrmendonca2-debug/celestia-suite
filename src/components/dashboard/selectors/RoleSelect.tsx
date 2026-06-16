import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listGuildRoles } from "@/lib/guild/discord-resources.functions";

interface Props {
  guildId: string;
  value: string | null;
  onChange: (id: string | null) => void;
  excludeManaged?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

function hex(color: number) {
  if (!color) return "#99aab5";
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function RoleSelect({
  guildId,
  value,
  onChange,
  excludeManaged = false,
  placeholder = "Selecione um cargo",
  disabled,
}: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["guild-roles", guildId],
    queryFn: () => listGuildRoles({ data: { guildId } }),
    staleTime: 60_000,
  });

  const items = (data ?? []).filter((r) => (excludeManaged ? !r.managed : true));

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
                <Loader2 className="size-3.5 animate-spin" /> Carregando cargos…
              </span>
            ) : isError ? (
              <span className="text-destructive">Erro ao carregar cargos</span>
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
        {items.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: hex(r.color) }}
              />
              {r.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
