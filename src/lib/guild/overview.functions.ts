/**
 * Overview agregada do servidor: dados reais do Discord (membros, ícone, permissões
 * do bot) + métricas do banco (tickets abertos, casos de moderação recentes) +
 * status de configuração dos principais módulos para checklist e Saúde do bot.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Bitflags Discord (BigInt)
const P = {
  ADMINISTRATOR: 1n << 3n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  VIEW_AUDIT_LOG: 1n << 7n,
  SEND_MESSAGES: 1n << 11n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  MANAGE_MESSAGES: 1n << 13n,
  MANAGE_ROLES: 1n << 28n,
  MODERATE_MEMBERS: 1n << 40n,
};

export interface PermissionFlag {
  key: keyof typeof P;
  label: string;
  ok: boolean;
}

export interface GuildOverview {
  discord: {
    name: string;
    iconUrl: string | null;
    memberCount: number | null;
    presenceCount: number | null;
  };
  bot: {
    present: boolean;
    isAdmin: boolean;
    permissions: PermissionFlag[];
    highestRolePosition: number;
  };
  config: {
    welcomeEnabled: boolean;
    welcomeChannelSet: boolean;
    logsChannelSet: boolean;
    ticketsEnabled: boolean;
    ticketsConfigured: boolean;
    moderationConfigured: boolean;
    economyEnabled: boolean;
    levelingEnabled: boolean;
  };
  counts: {
    openTickets: number;
    modCases7d: number;
    modCasesOpen: number;
    warnings7d: number;
    customCommands: number;
    activeModules: number;
    economyCirculating: number;
    economyUsers: number;
    suggestionsOpen: number;
    appealsPending: number;
  };
  activity: {
    day: string;
    modCases: number;
    tickets: number;
    warnings: number;
  }[];
  health: {
    lastSeenAt: string | null;
    memberCountTracked: number | null;
  };
}

const PERM_LABELS: Record<keyof typeof P, string> = {
  ADMINISTRATOR: "Administrador",
  KICK_MEMBERS: "Expulsar membros",
  BAN_MEMBERS: "Banir membros",
  MANAGE_CHANNELS: "Gerenciar canais",
  MANAGE_GUILD: "Gerenciar servidor",
  VIEW_AUDIT_LOG: "Ver auditoria",
  SEND_MESSAGES: "Enviar mensagens",
  EMBED_LINKS: "Usar embeds",
  ATTACH_FILES: "Anexar arquivos",
  MANAGE_MESSAGES: "Gerenciar mensagens",
  MANAGE_ROLES: "Gerenciar cargos",
  MODERATE_MEMBERS: "Mute / timeout",
};

export const getGuildOverview = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: z.string().regex(/^\d{5,32}$/) }).parse(d),
  )
  .handler(async ({ data }): Promise<GuildOverview> => {
    const { assertCanManageGuild } = await import("./permissions.server");
    const {
      getBotPresenceForGuild,
      guildIconUrlFromHash,
    } = await import("./bot-presence.server");
    const { getDiscordBotToken } = await import("@/lib/discord/bot-token.server");
    await assertCanManageGuild(data.guildId);

    const token = getDiscordBotToken();
    const clientId = process.env.DISCORD_CLIENT_ID;

    let name = "Servidor";
    let iconUrl: string | null = null;
    let memberCount: number | null = null;
    let presenceCount: number | null = null;
    let present = false;
    let permBits = 0n;
    let highestRolePosition = 0;

    const snapshot = await getBotPresenceForGuild(data.guildId, { withCounts: true });
    present = snapshot.present;
    if (snapshot.guild) {
      name = snapshot.guild.name ?? name;
      iconUrl = guildIconUrlFromHash(data.guildId, snapshot.guild.icon);
      memberCount = snapshot.guild.approximate_member_count ?? null;
      presenceCount = snapshot.guild.approximate_presence_count ?? null;
    }

    if (present && token && clientId) {
      try {
        const headers = { Authorization: `Bot ${token}` };
        const [memberRes, rolesRes] = await Promise.all([
          fetch(
            `https://discord.com/api/v10/guilds/${data.guildId}/members/${clientId}`,
            { headers },
          ),
          fetch(
            `https://discord.com/api/v10/guilds/${data.guildId}/roles`,
            { headers },
          ),
        ]);
        if (memberRes.ok && rolesRes.ok) {
          const member = (await memberRes.json()) as { roles: string[] };
          const roles = (await rolesRes.json()) as {
            id: string;
            permissions: string;
            position: number;
          }[];
          const byId = new Map(roles.map((r) => [r.id, r]));
          // @everyone tem o mesmo id da guild
          const everyone = byId.get(data.guildId);
          if (everyone) permBits |= BigInt(everyone.permissions);
          for (const rid of member.roles) {
            const r = byId.get(rid);
            if (!r) continue;
            permBits |= BigInt(r.permissions);
            if (r.position > highestRolePosition) highestRolePosition = r.position;
          }
        }
      } catch {
        // mantém defaults
      }
    }

    const isAdmin = (permBits & P.ADMINISTRATOR) === P.ADMINISTRATOR;
    const permissions: PermissionFlag[] = (Object.keys(P) as (keyof typeof P)[]).map(
      (key) => ({
        key,
        label: PERM_LABELS[key],
        ok: isAdmin || (permBits & P[key]) === P[key],
      }),
    );

    // Banco
    const { supabaseAdmin } = await import("@/lib/supabase-admin.server");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      welcomeRow,
      logsRow,
      ticketCfgRow,
      modRow,
      ecoRow,
      lvlRow,
      openTicketsCount,
      modCases7dCount,
      customCmdCount,
    ] = await Promise.all([
      supabaseAdmin
        .from("guild_configs")
        .select("welcome_enabled, welcome_channel_id")
        .eq("guild_id", data.guildId)
        .maybeSingle(),
      supabaseAdmin
        .from("guild_logs_config")
        .select("log_channel_id")
        .eq("guild_id", data.guildId)
        .maybeSingle(),
      supabaseAdmin
        .from("ticket_configs")
        .select("enabled, panel_channel_id, category_id, default_support_role_id")
        .eq("guild_id", data.guildId)
        .maybeSingle(),
      supabaseAdmin
        .from("moderation_configs")
        .select("guild_id")
        .eq("guild_id", data.guildId)
        .maybeSingle(),
      supabaseAdmin
        .from("economy_config")
        .select("guild_id")
        .eq("guild_id", data.guildId)
        .maybeSingle(),
      supabaseAdmin
        .from("level_config")
        .select("guild_id")
        .eq("guild_id", data.guildId)
        .maybeSingle(),
      supabaseAdmin
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("guild_id", data.guildId)
        .eq("status", "open"),
      supabaseAdmin
        .from("mod_cases")
        .select("id", { count: "exact", head: true })
        .eq("guild_id", data.guildId)
        .gte("created_at", sevenDaysAgo),
      supabaseAdmin
        .from("custom_commands")
        .select("id", { count: "exact", head: true })
        .eq("guild_id", data.guildId),
    ]);

    const welcomeEnabled = Boolean(welcomeRow.data?.welcome_enabled);
    const welcomeChannelSet = Boolean(welcomeRow.data?.welcome_channel_id);
    const logsChannelSet = Boolean(logsRow.data?.log_channel_id);
    const ticketsEnabled = Boolean(ticketCfgRow.data?.enabled);
    const ticketsConfigured =
      Boolean(ticketCfgRow.data?.panel_channel_id) &&
      Boolean(ticketCfgRow.data?.category_id);
    const moderationConfigured = Boolean(modRow.data);
    const economyEnabled = Boolean(ecoRow.data);
    const levelingEnabled = Boolean(lvlRow.data);

    const activeModules = [
      welcomeEnabled,
      logsChannelSet,
      ticketsEnabled,
      moderationConfigured,
      economyEnabled,
      levelingEnabled,
    ].filter(Boolean).length;

    return {
      discord: { name, iconUrl, memberCount, presenceCount },
      bot: { present, isAdmin, permissions, highestRolePosition },
      config: {
        welcomeEnabled,
        welcomeChannelSet,
        logsChannelSet,
        ticketsEnabled,
        ticketsConfigured,
        moderationConfigured,
        economyEnabled,
        levelingEnabled,
      },
      counts: {
        openTickets: openTicketsCount.count ?? 0,
        modCases7d: modCases7dCount.count ?? 0,
        customCommands: customCmdCount.count ?? 0,
        activeModules,
      },
    };
  });
