/**
 * Worker que alerta SLA estourado em tickets sem primeira resposta.
 * Roda a cada 60s. Para cada categoria com `first_response_minutes` configurado
 * e `sla_alert_role_id`, alerta o cargo no canal do ticket uma única vez.
 */
import type { Client, TextChannel } from "discord.js";
import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";

const TICK_MS = 60_000;
const NOTIFIED = new Set<string>(); // ticket_id já alertado nesta sessão

export function startTicketSlaScheduler(client: Client): void {
  setInterval(() => {
    void run(client).catch((err) => logger.error({ err }, "SLA scheduler tick falhou"));
  }, TICK_MS);
  logger.info("⏱️  Ticket SLA scheduler iniciado");
}

async function run(client: Client): Promise<void> {
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id,guild_id,channel_id,category_id,created_at,first_response_at,sla_deadline")
    .eq("status", "open")
    .is("first_response_at", null)
    .not("sla_deadline", "is", null)
    .lt("sla_deadline", new Date().toISOString())
    .limit(50);

  if (!tickets?.length) return;

  for (const t of tickets) {
    if (NOTIFIED.has(t.id)) continue;
    const { data: cat } = await supabase
      .from("ticket_categories")
      .select("sla_alert_role_id,name")
      .eq("id", t.category_id ?? "")
      .maybeSingle();
    const alertRole = cat?.sla_alert_role_id;
    if (!alertRole) continue;

    const guild = client.guilds.cache.get(t.guild_id);
    const channel = guild?.channels.cache.get(t.channel_id) as TextChannel | undefined;
    if (!channel?.isTextBased()) continue;

    await channel
      .send({
        content: `⏰ <@&${alertRole}> SLA estourado — sem primeira resposta neste ticket.`,
        allowedMentions: { roles: [alertRole] },
      })
      .catch(() => {});
    NOTIFIED.add(t.id);
  }
}
