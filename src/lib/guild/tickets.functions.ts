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
  max_open_tickets_per_user: 5,
  panel_title: "🎫 Central de Atendimento",
  panel_description:
    "Precisa de ajuda? Selecione no menu abaixo o tipo de atendimento e nossa equipe te responde aqui em instantes.",
  panel_button_label: "Abrir ticket",
  panel_button_emoji: "🎫",
  panel_color: 8141549,
  ticket_welcome_message:
    "Olá {user}! 👋 Obrigado por abrir um ticket.\n\nDescreva com calma o que aconteceu, mande prints se ajudar, e a equipe {staff} responde em instantes. ⏳",
  close_message:
    "Este ticket foi fechado por {staff}. Avalie nosso atendimento ou peça reabertura caso ainda precise de ajuda. 💜",
  transcript_enabled: true,
  rating_enabled: false,
  allow_user_close_ticket: true,
  use_single_panel: true,
  panel_image_url: null as string | null,
  panel_thumbnail_url: null as string | null,
  panel_use_guild_banner: false,
  webhook_id: null as string | null,
  webhook_token: null as string | null,
  webhook_channel_id: null as string | null,
  webhook_name: null as string | null,
  webhook_avatar_url: null as string | null,
};

const TEMPLATE_CATEGORIES = [
  {
    name: "Suporte Geral",
    emoji: "🛠️",
    description: "Dúvidas, problemas e ajuda em geral.",
    welcome_message:
      "Olá {user}! 👋 Conta pra gente qual é a sua dúvida ou problema. A equipe já está a caminho.",
    priority: false,
    position: 0,
  },
  {
    name: "Dúvida",
    emoji: "❓",
    description: "Perguntas rápidas sobre o servidor ou o bot.",
    welcome_message:
      "Olá {user}! 🤔 Pode mandar sua pergunta — quanto mais detalhe, mais rápido a gente responde.",
    priority: false,
    position: 1,
  },
  {
    name: "Denúncia",
    emoji: "🚨",
    description: "Reportar um usuário, mensagem ou comportamento.",
    welcome_message:
      "Olá {user}! 🚨 Descreva o ocorrido, marque o usuário envolvido e envie prints/links como prova. Tudo é confidencial.",
    priority: true,
    position: 2,
  },
  {
    name: "Parcerias",
    emoji: "🤝",
    description: "Propostas comerciais, divulgação ou colaboração.",
    welcome_message:
      "Olá {user}! 🤝 Conta um pouco sobre a sua proposta de parceria e a equipe responsável responde em breve.",
    priority: false,
    position: 3,
  },
];

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
  panel_button_emoji: z.string().min(1).max(64),
  panel_image_url: z.string().url().max(1000).nullable().optional(),
  panel_thumbnail_url: z.string().url().max(1000).nullable().optional(),
  panel_use_guild_banner: z.boolean().optional(),
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
    const payload = {
      guild_id: guildId,
      ...rest,
      panel_image_url: rest.panel_image_url ?? null,
      panel_thumbnail_url: rest.panel_thumbnail_url ?? null,
      panel_use_guild_banner: rest.panel_use_guild_banner ?? false,
    };
    const { data: row, error } = await sb
      .from("ticket_configs")
      .upsert(payload, { onConflict: "guild_id" })
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

/* ----------- Discord REST helpers (escopo do arquivo) ----------- */
const DISCORD = "https://discord.com/api/v10";

function botHeaders(token: string) {
  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Converts a Discord emoji string into the API shape expected by
 * select-menu options / buttons. Accepts both unicode ("🎫") and custom
 * emoji mentions ("<:name:id>" / "<a:name:id>").
 */
function parseEmoji(
  raw: string | null | undefined,
): { name: string; id?: string; animated?: boolean } | undefined {
  if (!raw) return undefined;
  const m = raw.match(/^<(a?):([\w~]+):(\d{5,32})>$/);
  if (m) return { name: m[2], id: m[3], animated: m[1] === "a" };
  return { name: raw };
}



async function discord<T = unknown>(
  url: string,
  init: RequestInit & { body?: string },
  errPrefix: string,
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${errPrefix} (${res.status}). ${text.slice(0, 220)}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

async function fetchGuildBanner(guildId: string, token: string): Promise<string | null> {
  try {
    const guild = await discord<{ banner?: string | null; icon?: string | null }>(
      `${DISCORD}/guilds/${guildId}`,
      { method: "GET", headers: botHeaders(token) },
      "Não consegui ler o servidor",
    );
    if (guild.banner) {
      const ext = guild.banner.startsWith("a_") ? "gif" : "png";
      return `https://cdn.discordapp.com/banners/${guildId}/${guild.banner}.${ext}?size=1024`;
    }
    if (guild.icon) {
      const ext = guild.icon.startsWith("a_") ? "gif" : "png";
      return `https://cdn.discordapp.com/icons/${guildId}/${guild.icon}.${ext}?size=512`;
    }
  } catch {
    /* ignora */
  }
  return null;
}

/* ----------- Enviar / Editar painel ----------- */
export const sendTicketPanel = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string; channelId?: string | null; mode?: "auto" | "send" | "edit" }) =>
    z
      .object({
        guildId: guildIdSchema,
        channelId: snowflakeNullable.optional(),
        mode: z.enum(["auto", "send", "edit"]).default("auto"),
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

    const { data: cats } = await sb
      .from("ticket_categories")
      .select("id,name,emoji,active,priority,position")
      .eq("guild_id", data.guildId)
      .eq("active", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    const activeCats = cats ?? [];
    const options =
      activeCats.length === 0
        ? [
            {
              label: cfg.panel_button_label || "Abrir ticket",
              value: "default",
              description: "Atendimento geral com a nossa equipe.",
              emoji: parseEmoji(cfg.panel_button_emoji || "🎫"),
            },
          ]
        : activeCats.slice(0, 25).map((c) => ({
            label: c.name.slice(0, 100),
            value: c.id,
            description: c.priority ? "⚡ Prioridade" : undefined,
            emoji: parseEmoji(c.emoji),
          }));

    const components = [
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: "ticket:select",
            placeholder: "Escolha o tipo de atendimento…",
            min_values: 1,
            max_values: 1,
            options,
          },
        ],
      },
    ];

    // imagem grande: URL explícita vence; senão usa banner do servidor se ligado
    let imageUrl: string | null = cfg.panel_image_url ?? null;
    if (!imageUrl && cfg.panel_use_guild_banner) {
      imageUrl = await fetchGuildBanner(data.guildId, token);
    }

    const embed: Record<string, unknown> = {
      title: cfg.panel_title,
      description: cfg.panel_description,
      color: cfg.panel_color,
    };
    if (imageUrl) embed.image = { url: imageUrl };
    if (cfg.panel_thumbnail_url) embed.thumbnail = { url: cfg.panel_thumbnail_url };

    const body = { embeds: [embed], components };

    // decide enviar via webhook (se houver) ou via bot
    const useWebhook =
      !!cfg.webhook_id &&
      !!cfg.webhook_token &&
      cfg.webhook_channel_id === channelId;

    const mode =
      data.mode === "auto" ? (cfg.panel_message_id ? "edit" : "send") : data.mode;

    let messageId = cfg.panel_message_id as string | null;

    if (mode === "edit") {
      if (!messageId) throw new Error("Não há painel anterior para editar. Envie um novo.");
      if (useWebhook) {
        await discord(
          `${DISCORD}/webhooks/${cfg.webhook_id}/${cfg.webhook_token}/messages/${messageId}`,
          { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
          "Discord recusou ao editar pelo webhook",
        );
      } else {
        await discord(
          `${DISCORD}/channels/${channelId}/messages/${messageId}`,
          { method: "PATCH", headers: botHeaders(token), body: JSON.stringify(body) },
          "Discord recusou ao editar a mensagem",
        );
      }
    } else {
      let msg: { id: string };
      if (useWebhook) {
        msg = await discord<{ id: string }>(
          `${DISCORD}/webhooks/${cfg.webhook_id}/${cfg.webhook_token}?wait=true`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...body,
              username: cfg.webhook_name || undefined,
              avatar_url: cfg.webhook_avatar_url || undefined,
            }),
          },
          "Discord recusou ao publicar pelo webhook",
        );
      } else {
        msg = await discord<{ id: string }>(
          `${DISCORD}/channels/${channelId}/messages`,
          { method: "POST", headers: botHeaders(token), body: JSON.stringify(body) },
          "Discord recusou ao publicar o painel",
        );
      }
      messageId = msg.id;
    }

    await sb
      .from("ticket_configs")
      .update({ panel_channel_id: channelId, panel_message_id: messageId })
      .eq("guild_id", data.guildId);

    return { ok: true, channelId, messageId, mode };
  });

/* ----------- Apagar o painel publicado ----------- */
export const deleteTicketPanel = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error("DISCORD_BOT_TOKEN não configurado no servidor.");
    const sb = await admin();
    const { data: cfg } = await sb
      .from("ticket_configs")
      .select("panel_channel_id,panel_message_id,webhook_id,webhook_token")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (!cfg?.panel_message_id || !cfg.panel_channel_id) {
      return { ok: true, already: true };
    }
    try {
      if (cfg.webhook_id && cfg.webhook_token) {
        await discord(
          `${DISCORD}/webhooks/${cfg.webhook_id}/${cfg.webhook_token}/messages/${cfg.panel_message_id}`,
          { method: "DELETE", headers: { "Content-Type": "application/json" } },
          "Discord recusou ao apagar pelo webhook",
        );
      } else {
        await discord(
          `${DISCORD}/channels/${cfg.panel_channel_id}/messages/${cfg.panel_message_id}`,
          { method: "DELETE", headers: botHeaders(token) },
          "Discord recusou ao apagar a mensagem",
        );
      }
    } catch (e) {
      // mensagem pode já ter sido removida — limpamos mesmo assim
      console.warn("deleteTicketPanel:", (e as Error).message);
    }
    await sb
      .from("ticket_configs")
      .update({ panel_message_id: null })
      .eq("guild_id", data.guildId);
    return { ok: true };
  });

/* ----------- Tickets ativos (listar / apagar) ----------- */
export const listOpenTickets = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("tickets")
      .select("id,channel_id,user_id,username,category_name,priority,created_at")
      .eq("guild_id", data.guildId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteActiveTicket = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string; ticketId: string }) =>
    z
      .object({ guildId: guildIdSchema, ticketId: z.string().uuid() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error("DISCORD_BOT_TOKEN não configurado no servidor.");
    const sb = await admin();
    const { data: ticket, error } = await sb
      .from("tickets")
      .select("id,channel_id,status")
      .eq("id", data.ticketId)
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) throw new Error("Ticket não encontrado.");

    try {
      await discord(
        `${DISCORD}/channels/${ticket.channel_id}`,
        { method: "DELETE", headers: botHeaders(token) },
        "Discord recusou ao apagar o canal",
      );
    } catch (e) {
      // canal pode já ter sido apagado manualmente — segue marcando como deleted
      console.warn("deleteActiveTicket:", (e as Error).message);
    }

    await sb
      .from("tickets")
      .update({ status: "deleted", closed_at: new Date().toISOString() })
      .eq("id", ticket.id);

    return { ok: true };
  });

/* ----------- Webhook do painel (criar / editar / apagar) ----------- */
export const createPanelWebhook = createServerFn({ method: "POST" })
  .inputValidator((d: {
    guildId: string;
    channelId: string;
    name?: string;
    avatarUrl?: string | null;
  }) =>
    z
      .object({
        guildId: guildIdSchema,
        channelId: z.string().regex(/^\d{5,32}$/),
        name: z.string().min(1).max(80).default("Central de Tickets"),
        avatarUrl: z.string().url().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error("DISCORD_BOT_TOKEN não configurado no servidor.");
    const sb = await admin();

    // se já existir, atualiza ao invés de duplicar
    const { data: existing } = await sb
      .from("ticket_configs")
      .select("webhook_id,webhook_token,webhook_channel_id")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (existing?.webhook_id && existing.webhook_token) {
      // muda canal se for diferente
      if (existing.webhook_channel_id !== data.channelId) {
        await discord(
          `${DISCORD}/webhooks/${existing.webhook_id}`,
          {
            method: "PATCH",
            headers: botHeaders(token),
            body: JSON.stringify({ channel_id: data.channelId, name: data.name }),
          },
          "Discord recusou ao mover o webhook",
        );
      }
      await sb
        .from("ticket_configs")
        .update({
          webhook_channel_id: data.channelId,
          webhook_name: data.name,
          webhook_avatar_url: data.avatarUrl ?? null,
        })
        .eq("guild_id", data.guildId);
      return { ok: true, reused: true };
    }

    const hook = await discord<{ id: string; token: string }>(
      `${DISCORD}/channels/${data.channelId}/webhooks`,
      {
        method: "POST",
        headers: botHeaders(token),
        body: JSON.stringify({ name: data.name }),
      },
      "Discord recusou ao criar o webhook",
    );

    await sb
      .from("ticket_configs")
      .update({
        webhook_id: hook.id,
        webhook_token: hook.token,
        webhook_channel_id: data.channelId,
        webhook_name: data.name,
        webhook_avatar_url: data.avatarUrl ?? null,
      })
      .eq("guild_id", data.guildId);

    return { ok: true, reused: false };
  });

export const updatePanelWebhook = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string; name?: string; avatarUrl?: string | null }) =>
    z
      .object({
        guildId: guildIdSchema,
        name: z.string().min(1).max(80).optional(),
        avatarUrl: z.string().url().max(1000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: cfg } = await sb
      .from("ticket_configs")
      .select("webhook_id,webhook_token")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (!cfg?.webhook_id || !cfg.webhook_token) {
      throw new Error("Webhook ainda não foi criado.");
    }
    // Atualiza no Discord (nome). Avatar dá pra mudar via webhook URL; mantemos só nos posts.
    if (data.name) {
      await discord(
        `${DISCORD}/webhooks/${cfg.webhook_id}/${cfg.webhook_token}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name }),
        },
        "Discord recusou ao atualizar o webhook",
      );
    }
    const update: { webhook_name?: string; webhook_avatar_url?: string | null } = {};
    if (data.name !== undefined) update.webhook_name = data.name;
    if (data.avatarUrl !== undefined) update.webhook_avatar_url = data.avatarUrl;
    if (Object.keys(update).length) {
      await sb.from("ticket_configs").update(update).eq("guild_id", data.guildId);
    }
    return { ok: true };
  });

export const deletePanelWebhook = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: cfg } = await sb
      .from("ticket_configs")
      .select("webhook_id,webhook_token")
      .eq("guild_id", data.guildId)
      .maybeSingle();
    if (cfg?.webhook_id && cfg.webhook_token) {
      try {
        await discord(
          `${DISCORD}/webhooks/${cfg.webhook_id}/${cfg.webhook_token}`,
          { method: "DELETE", headers: { "Content-Type": "application/json" } },
          "Discord recusou ao apagar o webhook",
        );
      } catch (e) {
        console.warn("deletePanelWebhook:", (e as Error).message);
      }
    }
    await sb
      .from("ticket_configs")
      .update({
        webhook_id: null,
        webhook_token: null,
        webhook_channel_id: null,
        webhook_name: null,
        webhook_avatar_url: null,
      })
      .eq("guild_id", data.guildId);
    return { ok: true };
  });

/* ----------- Carrega categorias-modelo (idempotente) ----------- */
export const seedTicketTemplates = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { count } = await sb
      .from("ticket_categories")
      .select("id", { count: "exact", head: true })
      .eq("guild_id", data.guildId);
    if ((count ?? 0) > 0) {
      return { ok: true, inserted: 0 };
    }
    const rows = TEMPLATE_CATEGORIES.map((t) => ({
      guild_id: data.guildId,
      name: t.name,
      emoji: t.emoji,
      description: t.description,
      welcome_message: t.welcome_message,
      priority: t.priority,
      position: t.position,
      active: true,
      required_role_ids: [],
      blocked_role_ids: [],
      allowed_access_levels: [],
    }));
    const { error } = await sb.from("ticket_categories").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true, inserted: rows.length };
  });

/* =====================================================================
 * FASE 2 — Categorias, Permissões por cargo e Níveis de acesso
 * =================================================================== */

/* ---------------- Categorias ---------------- */

const CategoryInput = z.object({
  guildId: guildIdSchema,
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(80),
  description: z.string().max(500).nullable().optional(),
  emoji: z.string().min(1).max(8).default("🎫"),
  support_role_id: snowflakeNullable.optional(),
  discord_category_id: snowflakeNullable.optional(),
  active: z.boolean().default(true),
  priority: z.boolean().default(false),
  required_role_ids: z.array(z.string().regex(/^\d{5,32}$/)).default([]),
  blocked_role_ids: z.array(z.string().regex(/^\d{5,32}$/)).default([]),
  allowed_access_levels: z.array(z.string().min(1).max(60)).default([]),
  max_open_tickets_per_user: z.number().int().min(1).max(20).nullable().optional(),
  welcome_message: z.string().max(2000).nullable().optional(),
  position: z.number().int().min(0).max(999).default(0),
});

export const listTicketCategories = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("ticket_categories")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertTicketCategory = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CategoryInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, id, ...rest } = data;
    const payload = { guild_id: guildId, ...rest };
    const query = id
      ? sb.from("ticket_categories").update(payload).eq("id", id).eq("guild_id", guildId)
      : sb.from("ticket_categories").insert(payload);
    const { data: row, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteTicketCategory = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string; id: string }) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("ticket_categories")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Níveis de acesso ---------------- */

const AccessLevelInput = z.object({
  guildId: guildIdSchema,
  id: z.string().uuid().optional().nullable(),
  key: z.string().min(1).max(60).regex(/^[a-z0-9_-]+$/i, "use só letras, números, _ ou -"),
  name: z.string().min(1).max(80),
  rank: z.number().int().min(0).max(1000).default(0),
  role_ids: z.array(z.string().regex(/^\d{5,32}$/)).default([]),
});

export const listAccessLevels = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("ticket_access_levels")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("rank", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertAccessLevel = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AccessLevelInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, id, ...rest } = data;
    const payload = { guild_id: guildId, ...rest };
    const query = id
      ? sb.from("ticket_access_levels").update(payload).eq("id", id).eq("guild_id", guildId)
      : sb.from("ticket_access_levels").upsert(payload, { onConflict: "guild_id,key" });
    const { data: row, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteAccessLevel = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string; id: string }) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("ticket_access_levels")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Permissões por cargo ---------------- */

const PermissionRoleInput = z.object({
  guildId: guildIdSchema,
  id: z.string().uuid().optional().nullable(),
  role_id: z.string().regex(/^\d{5,32}$/),
  access_level: z.string().min(1).max(60).default("member"),
  can_view_panel: z.boolean().default(true),
  can_open_ticket: z.boolean().default(true),
  can_open_priority_ticket: z.boolean().default(false),
  can_close_ticket: z.boolean().default(false),
  can_reopen_ticket: z.boolean().default(false),
  can_delete_ticket: z.boolean().default(false),
  can_claim_ticket: z.boolean().default(false),
  can_add_user: z.boolean().default(false),
  can_remove_user: z.boolean().default(false),
  can_generate_transcript: z.boolean().default(false),
  can_view_history: z.boolean().default(false),
  can_view_ratings: z.boolean().default(false),
  can_manage_config: z.boolean().default(false),
});

export const listPermissionRoles = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("ticket_permission_roles")
      .select("*")
      .eq("guild_id", data.guildId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertPermissionRole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PermissionRoleInput.parse(d))
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { guildId, id, ...rest } = data;
    const payload = { guild_id: guildId, ...rest };
    const query = id
      ? sb.from("ticket_permission_roles").update(payload).eq("id", id).eq("guild_id", guildId)
      : sb.from("ticket_permission_roles").upsert(payload, { onConflict: "guild_id,role_id" });
    const { data: row, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePermissionRole = createServerFn({ method: "POST" })
  .inputValidator((d: { guildId: string; id: string }) =>
    z.object({ guildId: guildIdSchema, id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await perm(data.guildId);
    const sb = await admin();
    const { error } = await sb
      .from("ticket_permission_roles")
      .delete()
      .eq("id", data.id)
      .eq("guild_id", data.guildId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ===================== GUILD EMOJIS ===================== */

export interface GuildEmoji {
  id: string;
  name: string;
  animated: boolean;
  /** Mention string to use inside Discord messages (e.g. <:name:id>) */
  mention: string;
  /** CDN URL for preview */
  url: string;
}

export const listGuildEmojis = createServerFn({ method: "GET" })
  .inputValidator((d: { guildId: string }) =>
    z.object({ guildId: guildIdSchema }).parse(d),
  )
  .handler(async ({ data }): Promise<GuildEmoji[]> => {
    await perm(data.guildId);
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error("DISCORD_BOT_TOKEN não configurado no servidor.");
    const res = await fetch(`${DISCORD}/guilds/${data.guildId}/emojis`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) return [];
    const raw = (await res.json()) as Array<{
      id: string;
      name: string;
      animated?: boolean;
      available?: boolean;
    }>;
    return raw
      .filter((e) => e.id && e.name && e.available !== false)
      .map((e) => ({
        id: e.id,
        name: e.name,
        animated: !!e.animated,
        mention: `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`,
        url: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? "gif" : "png"}`,
      }));
  });
