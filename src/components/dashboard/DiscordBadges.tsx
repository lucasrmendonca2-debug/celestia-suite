import { useQuery } from "@tanstack/react-query";
import { Hash, AtSign, Loader2, Volume2 } from "lucide-react";
import {
  listGuildRoles,
  listGuildChannels,
} from "@/lib/guild/discord-resources.functions";

function hex(color: number) {
  if (!color) return "#99aab5";
  return `#${color.toString(16).padStart(6, "0")}`;
}

/**
 * Mostra o nome + cor de um cargo a partir do ID.
 * Usa o cache compartilhado de ["guild-roles", guildId].
 */
export function RoleBadge({
  guildId,
  roleId,
  className = "",
}: {
  guildId: string;
  roleId: string;
  className?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["guild-roles", guildId],
    queryFn: () => listGuildRoles({ data: { guildId } }),
    staleTime: 60_000,
  });

  const role = data?.find((r) => r.id === roleId);
  const color = role ? hex(role.color) : "#99aab5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
      style={{
        borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
        background: `color-mix(in oklab, ${color} 12%, transparent)`,
        color: "var(--foreground)",
      }}
    >
      <AtSign className="size-3" style={{ color }} />
      {isLoading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : role ? (
        role.name
      ) : (
        <span className="font-mono opacity-70">{roleId}</span>
      )}
    </span>
  );
}

/**
 * Mostra o nome de um canal a partir do ID, com ícone correto (texto/voz).
 */
export function ChannelBadge({
  guildId,
  channelId,
  className = "",
}: {
  guildId: string;
  channelId: string;
  className?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["guild-channels", guildId],
    queryFn: () => listGuildChannels({ data: { guildId } }),
    staleTime: 60_000,
  });

  const ch = data?.find((c) => c.id === channelId);
  const isVoice = ch?.type === 2 || ch?.type === 13;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {isVoice ? (
        <Volume2 className="size-3 text-muted-foreground" />
      ) : (
        <Hash className="size-3 text-muted-foreground" />
      )}
      {isLoading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : ch ? (
        ch.name
      ) : (
        <span className="font-mono opacity-70">{channelId}</span>
      )}
    </span>
  );
}
