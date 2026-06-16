/**
 * Worker que fecha automaticamente tickets inativos.
 * Roda a cada 5min. Critério: `last_user_message_at` (ou created_at) + auto_close_hours
 * da categoria. Posta aviso de fechamento e chama o handler padrão de close.
 */
import type { Client, GuildMember, TextChannel } from "discord.js";
import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";
import { closeTicket } from "./handlers.js";

const TICK_MS = 5 * 60_000;

export function startTicketAutocloseScheduler(client: Client): void {
  setInterval(() => {
    void run(client).catch((err) => logger.error({ err }, "Autoclose tick falhou"));
  }, TICK_MS);
  logger.info("🕒 Ticket autoclose scheduler iniciado");
}

async function run(client: Client): Promise<void> {
  const { data: cats } = await supabase
    .from("ticket_categories")
    .select("id,guild_id,auto_close_hours")
    .not("auto_close_hours", "is", null)
    .gt("auto_close_hours", 0);

  if (!cats?.length) return;

  for (const cat of cats) {
    const cutoff = new Date(Date.now() - cat.auto_close_hours * 3600 * 1000).toISOString();
    const { data: tickets } = await supabase
      .from("tickets")
      .select("id,guild_id,channel_id,user_id,last_user_message_at,created_at")
      .eq("status", "open")
      .eq("category_id", cat.id)
      .or(`last_user_message_at.lt.${cutoff},and(last_user_message_at.is.null,created_at.lt.${cutoff})`)
      .limit(20);

    if (!tickets?.length) continue;
    for (const t of tickets) {
      const guild = client.guilds.cache.get(t.guild_id);
      const channel = guild?.channels.cache.get(t.channel_id) as TextChannel | undefined;
      if (!channel?.isTextBased() || !guild) continue;
      const me = guild.members.me as GuildMember | null;
      if (!me) continue;
      try {
        await channel.send({
          content: `🕒 Ticket fechado automaticamente por inatividade (${cat.auto_close_hours}h).`,
        });
        await closeTicket(channel, me, "Auto-close por inatividade");
      } catch (err) {
        logger.warn({ err, ticketId: t.id }, "auto-close falhou");
      }
    }
  }
}
