/**
 * Server functions de configuração por servidor (guild).
 * - Leitura via service_role (precisa ver mesmo sem RLS bater).
 * - Escrita exige sessão Discord + permissão de gerenciar a guild.
 * - O bot externo lê a tabela direto via anon key (policy pública de SELECT).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface WelcomeConfig {
  guild_id: string;
  welcome_enabled: boolean;
  welcome_channel_id: string | null;
  welcome_message: string;
  welcome_embed_enabled: boolean;
  welcome_embed_color: string;
  updated_at: string;
}

const DEFAULTS: Omit<WelcomeConfig, "guild_id" | "updated_at"> = {
  welcome_enabled: false,
  welcome_channel_id: null,
  welcome_message: "Bem-vindo(a) ao {server}, {user}! 🎉",
  welcome_embed_enabled: true,
  welcome_embed_color: "#5865F2",
};

async function assertCanManage(guildId: string): Promise<string> {
  const { getSession } = await import("@/lib/auth/session.server");
  const { fetchUserGuilds, filterManageableGuilds } = await import(
    "@/lib/auth/discord.server"
  );
  const session = await getSession();
  if (!session.data.userId || !session.data.accessToken) {
    throw new Error("Não autenticado.");
  }
  const guilds = await fetchUserGuilds(session.data.accessToken);
  const manageable = filterManageableGuilds(guilds);
  if (!manageable.some((g) => g.id === guildId)) {
    throw new Error("Sem permissão para gerenciar esse servidor.");
  }
  return session.data.userId;
}

export const getGuildConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: z.string().min(1).max(32) }).parse(d),
  )
  .handler(async ({ data }): Promise<WelcomeConfig> => {
    await assertCanManage(data.guildId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("guild_configs")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) {
      return {
        guild_id: data.guildId,
        ...DEFAULTS,
        updated_at: new Date().toISOString(),
      };
    }
    return row as WelcomeConfig;
  });

const WelcomeInput = z.object({
  guildId: z.string().min(1).max(32),
  welcome_enabled: z.boolean(),
  welcome_channel_id: z
    .string()
    .regex(/^\d{5,32}$/, "ID de canal inválido")
    .nullable(),
  welcome_message: z.string().min(1).max(2000),
  welcome_embed_enabled: z.boolean(),
  welcome_embed_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor hex inválida"),
});

export const updateWelcomeConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => WelcomeInput.parse(d))
  .handler(async ({ data }): Promise<WelcomeConfig> => {
    const { assertCanAccessArea, writeAudit } = await import(
      "./permissions-audit.server"
    );
    const actor = await assertCanAccessArea(data.guildId, "welcome");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin
      .from("guild_configs")
      .select("welcome_enabled, welcome_channel_id, welcome_message, welcome_embed_enabled, welcome_embed_color")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    const payload = {
      guild_id: data.guildId,
      welcome_enabled: data.welcome_enabled,
      welcome_channel_id: data.welcome_channel_id,
      welcome_message: data.welcome_message,
      welcome_embed_enabled: data.welcome_embed_enabled,
      welcome_embed_color: data.welcome_embed_color,
      updated_by: actor.id,
    };
    const { data: row, error } = await supabaseAdmin
      .from("guild_configs")
      .upsert(payload, { onConflict: "guild_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit({
      guildId: data.guildId,
      event: "welcome.update",
      actor,
      before: prev as Record<string, unknown> | null,
      after: {
        welcome_enabled: data.welcome_enabled,
        welcome_channel_id: data.welcome_channel_id,
        welcome_message: data.welcome_message,
        welcome_embed_enabled: data.welcome_embed_enabled,
        welcome_embed_color: data.welcome_embed_color,
      },
    });
    return row as WelcomeConfig;
  });
