/**
 * Sistema de Tickets — server functions.
 *
 * - Leitura usa service_role (sem expor admin ao cliente).
 * - Escrita exige sessão Discord com permissão de gerenciar a guild.
 * - Bot lê via service_role no próprio processo (vê ticket.service.ts no bot).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const guildIdSchema = z.string().regex(/^\d{5,32}$/, "guild id inválido");
const snowflakeNullable = z
  .string()
  .regex(/^\d{5,32}$/, "id inválido")
  .nullable();

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
async function perm(guildId: string) {
  const { assertCanManageGuild } = await import("./permissions.server");
  return assertCanManageGuild(guildId);
}

const TICKET_DEFAULTS = {
  enabled: false,
  panel_channel_id: null as string | null,
  panel_message_id: null as string | null,
  category_id: null as string | null,
  default_support_role_id: null as string | null,
  log_channel_id: null as string | null,
  max_open_tickets_per_user: 1,
  panel_title: "🎫 Central de Atendimento",
  panel_description:
    "Precisa de ajuda? Abra um ticket clicando no botão abaixo. Nossa equipe vai te atender por aqui em instantes.",
  panel_button_label: "Abrir ticket",
  panel_button_emoji: "🎫",
  panel_color: 8141549,
  ticket_welcome_message:
    "Olá {user}! 👋 Conta pra gente como podemos te ajudar — alguém da equipe já vem aqui.",
  close_message:
    "Este ticket foi fechado por {staff}. Se precisar continuar o atendimento, peça pra equipe reabrir.",
  transcript_enabled: true,
  rating_enabled: false,
  allow_user_close_ticket: true,
  use_single_panel: true,
};

export const getTicketConfig = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: row, error } = await sb
      .from("ticket_configs")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? { guild_id: data.guildId, ...TICKET_DEFAULTS };
  });

const TicketConfigInput = z.object({
  guildId: guildIdSchema,
  enabled: z.boolean(),
  panel_channel_id: snowflakeNullable,
  category_id: snowflakeNullable,
  default_support_role_id: snowflakeNullable,
  log_channel_id: snowflakeNullable,
  max_open_tickets_per_user: z.number().int().min(1).max(20),
  panel_title: z.string().min(1).max(255),
  panel_description: z.string().min(1).max(4000),
  panel_button_label: z.string().min(1).max(80),
  panel_button_emoji: z.string().min(1).max(8),
  ticket_welcome_message: z.string().min(1).max(2000),
  close_message: z.string().min(1).max(2000),
  transcript_enabled: z.boolean(),
  rating_enabled: z.boolean(),
  allow_user_close_ticket: z.boolean(),
});

export const updateTicketConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TicketConfigInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, ...rest } = data;
    const { data: row, error } = await sb
      .from("ticket_configs")
      .upsert({ guild_id: guildId, ...rest }, { onConflict: "guild_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/* Estatísticas pra cards do header */
export const getTicketStats = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const [openRes, totalRes] = await Promise.all([
      sb
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("guild_id", data.guildId)
        .eq("status", "open"),
      sb
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("guild_id", data.guildId),
    ]);
    return {
      open: openRes.count ?? 0,
      total: totalRes.count ?? 0,
    };
  });

/* ----------- Enviar painel pelo dashboard (via Discord REST) ----------- */
export const sendTicketPanel = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string; channelId?: string | null }) =>
    z
      .object({
        guildId: guildIdSchema,
        channelId: snowflakeNullable.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error("DISCORD_BOT_TOKEN não configurado no servidor.");

    const sb = await admin();
    const { data: cfg, error: cfgErr } = await sb
      .from("ticket_configs")
      .select("*")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (cfgErr) throw new Error(cfgErr.message);
    if (!cfg) throw new Error("Configure e salve o sistema antes de enviar o painel.");
    if (!cfg.enabled) throw new Error("Ative o sistema de tickets antes de enviar o painel.");

    const channelId = data.channelId ?? cfg.panel_channel_id;
    if (!channelId) throw new Error("Defina o canal do painel antes de enviar.");

    const body = {
      embeds: [
        {
          title: cfg.panel_title,
          description: cfg.panel_description,
          color: cfg.panel_color,
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              custom_id: "ticket:open:default",
              label: cfg.panel_button_label,
              emoji: cfg.panel_button_emoji
                ? { name: cfg.panel_button_emoji }
                : undefined,
            },
          ],
        },
      ],
    };

    const res = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Discord recusou (${res.status}). Confira se o bot está no servidor e tem acesso ao canal. ${text.slice(0, 200)}`,
      );
    }
    const msg = (await res.json()) as { id: string };

    await sb
      .from("ticket_configs")
      .update({ panel_channel_id: channelId, panel_message_id: msg.id })
      .eq("guild_id", data.guildId);

    return { ok: true, channelId, messageId: msg.id };
  });
