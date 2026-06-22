/**
 * Entrega insights gerados pela camada de inteligência (guild_insights)
 * para o canal de logs configurado em cada servidor. Marca como delivered=true.
 *
 * Também entrega marcos (guild_milestones) e ajustes de economia.
 */
import { Client } from "discord.js";
import { supabase } from "../../../database/supabase.js";
import { getConfig } from "../../utils/guildCache.js";
import { sendLog } from "../logs/sender.js";
import { brandEmbed } from "../../utils/embed.js";
import { ui } from "../ui/embed.factory.js";
import { logger } from "../../utils/logger.js";

const SEVERITY_KIND: Record<string, "info" | "warn" | "success"> = {
  info: "info",
  positive: "success",
  warning: "warn",
};

export async function deliverPendingInsights(client: Client) {
  const { data: insights, error } = await supabase
    .from("guild_insights")
    .select("id, guild_id, kind, severity, title, description, metrics")
    .eq("delivered", false)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    logger.error({ err: error }, "fetch guild_insights falhou");
    return;
  }

  for (const ins of insights ?? []) {
    const guild = client.guilds.cache.get(ins.guild_id);
    if (!guild) continue;

    const kind = SEVERITY_KIND[ins.severity] ?? "info";
    await sendLog(
      guild,
      "modLogChannelId",
      brandEmbed({
        kind,
        title: ins.title,
        description: ins.description ?? undefined,
      }),
      `insight.${ins.kind}`,
      { metrics: ins.metrics },
    );

    await supabase
      .from("guild_insights")
      .update({ delivered: true, delivered_at: new Date().toISOString() })
      .eq("id", ins.id);
  }
}

export async function deliverPendingMilestones(client: Client) {
  const { data: milestones, error } = await supabase
    .from("guild_milestones")
    .select("id, guild_id, kind, value, metadata, celebrated_at")
    .is("celebrated_at", null)
    .order("achieved_at", { ascending: true })
    .limit(20);

  if (error) {
    logger.error({ err: error }, "fetch guild_milestones falhou");
    return;
  }

  for (const ms of milestones ?? []) {
    const guild = client.guilds.cache.get(ms.guild_id);
    if (!guild) continue;

    const cfg = await getConfig(ms.guild_id).catch(() => null);
    const channelId = cfg?.announcementsChannelId ?? cfg?.welcomeChannelId;
    if (!channelId) continue;

    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isTextBased()) continue;

    const title =
      ms.kind === "anniversary"
        ? `🎂 ${ms.value} ano(s) de servidor!`
        : `🎉 ${ms.value.toLocaleString("pt-BR")} membros!`;

    const description =
      ms.kind === "anniversary"
        ? "Obrigado a todos que fazem parte dessa comunidade."
        : "Bem-vindos a todos os novos membros — vamos juntos.";

    await channel
      .send({ embeds: [ui.celebration({ title, description })] })
      .catch((err) => logger.error({ err }, "milestone send falhou"));

    await supabase
      .from("guild_milestones")
      .update({ celebrated_at: new Date().toISOString() })
      .eq("id", ms.id);
  }
}
