import { supabaseAdmin } from "@/lib/supabase-admin.server";
import { getDiscordBotToken } from "@/lib/discord/bot-token.server";

const DISCORD_API = "https://discord.com/api/v10";

interface PresenceRow {
  guild_id: string;
  name: string | null;
  icon: string | null;
  owner_id: string | null;
  member_count: number | null;
  present: boolean;
}

export interface BotPresenceSnapshot {
  present: boolean;
  source: "bot-registry" | "discord-rest" | "none" | "error";
  status?: number;
  guild?: {
    id: string;
    name: string | null;
    icon: string | null;
    owner_id?: string | null;
    approximate_member_count?: number | null;
    approximate_presence_count?: number | null;
  };
}

export function guildIconUrlFromHash(guildId: string, icon: string | null | undefined): string | null {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}?size=128`;
}

async function readRecordedPresence(guildId: string): Promise<PresenceRow | null> {
  const { data, error } = await supabaseAdmin
    .from("bot_guild_presence")
    .select("guild_id,name,icon,owner_id,member_count,present")
    .eq("guild_id", guildId)
    .maybeSingle();

  if (error) {
    console.warn(`[bot-presence] registry read failed guild=${guildId}: ${error.message}`);
    return null;
  }
  return (data as PresenceRow | null) ?? null;
}

export async function fetchDiscordGuildPresence(
  guildId: string,
  opts: { withCounts?: boolean } = {},
): Promise<BotPresenceSnapshot> {
  const token = getDiscordBotToken();
  if (!token) {
    console.warn("[bot-presence] token do bot ausente — não dá para confirmar via Discord REST");
    return { present: false, source: "none" };
  }

  const suffix = opts.withCounts ? "?with_counts=true" : "";
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}${suffix}`, {
    headers: { Authorization: `Bot ${token}` },
  });

  if (res.ok) {
    const guild = (await res.json()) as BotPresenceSnapshot["guild"];
    return { present: true, source: "discord-rest", guild };
  }

  if (res.status === 403 || res.status === 404) {
    return { present: false, source: "discord-rest", status: res.status };
  }

  const body = await res.text().catch(() => "");
  console.warn(
    `[bot-presence] guild=${guildId} status=${res.status} body=${body.slice(0, 200)}${
      res.status === 401 ? " — token recusado; salve a secret como token puro, sem prefixo Bot" : ""
    }`,
  );
  return { present: false, source: "error", status: res.status };
}

export async function getBotPresenceForGuild(
  guildId: string,
  opts: { withCounts?: boolean } = {},
): Promise<BotPresenceSnapshot> {
  const recorded = await readRecordedPresence(guildId);
  if (recorded?.present) {
    return {
      present: true,
      source: "bot-registry",
      guild: {
        id: recorded.guild_id,
        name: recorded.name,
        icon: recorded.icon,
        owner_id: recorded.owner_id,
        approximate_member_count: recorded.member_count,
        approximate_presence_count: null,
      },
    };
  }

  const live = await fetchDiscordGuildPresence(guildId, opts);
  if (live.present || !recorded) return live;
  return { present: false, source: "bot-registry" };
}
