import { EmbedBuilder, type Message } from "discord.js";
import type { BotEvent } from "../handlers/events.js";
import { runAutoMod } from "../systems/automod/automod.js";
import { handleMessageXp } from "../systems/level/level.js";
import { handleCustomCommand } from "../systems/custom/custom.js";
import { supabase } from "../../database/supabase.js";
import { logger } from "../utils/logger.js";

const event: BotEvent<"messageCreate"> = {
  name: "messageCreate",
  async execute(_client, message) {
    if (!message.inGuild() || message.author.bot) return;
    const blocked = await runAutoMod(message);
    if (blocked) return;
    await handleCustomCommand(message);
    await handleMessageXp(message);
    await trackTicketActivity(message).catch((err) =>
      logger.debug({ err }, "trackTicketActivity falhou"),
    );
  },
};

async function trackTicketActivity(message: Message): Promise<void> {
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id,user_id,first_response_at,sla_deadline,category_id")
    .eq("channel_id", message.channelId)
    .eq("status", "open")
    .maybeSingle();
  if (!ticket) return;

  const patch: Record<string, unknown> = {};
  if (message.author.id === ticket.user_id) {
    patch.last_user_message_at = new Date().toISOString();
  } else if (!ticket.first_response_at) {
    patch.first_response_at = new Date().toISOString();
  }
  if (Object.keys(patch).length === 0) return;
  await supabase.from("tickets").update(patch).eq("id", ticket.id);

  // posta embed de "primeira resposta" no log? (simples: ignorado por enquanto)
  void EmbedBuilder;
}

export default event;
