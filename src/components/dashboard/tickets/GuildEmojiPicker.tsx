import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Smile } from "lucide-react";
import { listGuildEmojis } from "@/lib/guild/tickets.functions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  guildId: string;
  onPick: (value: string) => void;
  /** When true, returns the mention string `<:name:id>`. When false (default), returns the bare unicode/name. */
  asMention?: boolean;
}

/**
 * Dropdown that lists the custom emojis of the current guild so the user can
 * insert them into an embed/message field.
 */
export function GuildEmojiPicker({ guildId, onPick, asMention = false }: Props) {
  const fetchEmojis = useServerFn(listGuildEmojis);
  const { data, isLoading } = useQuery({
    queryKey: ["guild-emojis", guildId],
    queryFn: () => fetchEmojis({ data: { guildId } }),
    staleTime: 60_000,
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" title="Emojis do servidor">
          <Smile className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <p className="px-1 pb-1 text-xs text-muted-foreground">Emojis do servidor</p>
        {isLoading ? (
          <p className="p-2 text-xs text-muted-foreground">Carregando…</p>
        ) : !data || data.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground">
            Nenhum emoji personalizado encontrado neste servidor.
          </p>
        ) : (
          <div className="grid max-h-60 grid-cols-8 gap-1 overflow-y-auto">
            {data.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onPick(asMention ? e.mention : e.name)}
                title={`:${e.name}:`}
                className="flex size-8 items-center justify-center rounded hover:bg-accent"
              >
                <img src={e.url} alt={e.name} className="size-6" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 px-1 text-[10px] text-muted-foreground">
          Dica: emojis padrão do Discord (😀) também funcionam — basta digitar.
        </p>
      </PopoverContent>
    </Popover>
  );
}
