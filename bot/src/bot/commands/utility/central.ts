import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { getAccount, getCurrency } from "../../systems/economy/economy.js";
import { findLevelAccount, countOpenTickets, findActiveUserVip } from "../../repositories/phase4.repo.js";
import { getActiveUserSubscription, getPlan } from "../../systems/premium/premium.service.js";
import { supabase } from "../../../database/supabase.js";

const DAY = 24 * 3600 * 1000;

const command: SlashCommand = {
  category: "utility",
  module: "central",
  cooldown: 5,
  guildOnly: true,
  enabledByDefault: true,
  dashboardConfigurable: true,
  longDescription: "Resumo completo do seu perfil neste servidor — level, economia, daily, tickets, reputação, badges e VIP.",
  examples: ["/central", "/central usuario:@alguem"],
  data: new SlashCommandBuilder()
    .setName("central")
    .setDescription("Sua central: level, saldo, daily, tickets, reputação, badges e VIP.")
    .addUserOption((o) => o.setName("usuario").setDescription("Ver a central de outro membro")),
  async execute(interaction) {
    const target = interaction.options.getUser("usuario") ?? interaction.user;
    const guildId = interaction.guildId!;

    const [eco, currency, lvl, openTickets, vipLegacy, sub] = await Promise.all([
      getAccount(guildId, target.id),
      getCurrency(guildId),
      findLevelAccount(guildId, target.id),
      countOpenTickets(guildId, target.id),
      findActiveUserVip(guildId, target.id),
      getActiveUserSubscription(target.id).catch(() => null),
    ]);

    // Reputação + badges + achievements no Supabase
    const [{ data: profile }, { count: badgeCount }, { count: achCount }] = await Promise.all([
      supabase
        .from("social_profiles")
        .select("reputation_total, reputation_weekly")
        .eq("guild_id", guildId)
        .eq("user_id", target.id)
        .maybeSingle(),
      supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", target.id),
      supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", target.id),
    ]);

    // Daily disponível?
    const now = Date.now();
    const dailyMs = eco.lastDaily ? DAY - (now - eco.lastDaily.getTime()) : 0;
    const dailyStatus = !eco.lastDaily || dailyMs <= 0 ? "✅ Disponível agora" : `⏳ Em ${fmtDuration(dailyMs)}`;

    // VIP status
    const plan = sub ? await getPlan(sub.plan_id).catch(() => null) : null;
    const vipText = sub && plan
      ? `💎 **${plan.name}**${sub.expires_at ? ` — expira <t:${Math.floor(new Date(sub.expires_at).getTime() / 1000)}:R>` : " (vitalício)"}`
      : vipLegacy
        ? `💎 **${vipLegacy.tier}** (servidor)`
        : "—";

    const level = lvl?.level ?? 0;
    const xp = lvl?.xp ?? 0;
    const totalXp = lvl?.totalXp ?? 0;

    await interaction.reply({
      embeds: [
        brandEmbed({
          title: `🪐 Central de ${target.username}`,
          thumbnail: target.displayAvatarURL({ size: 256 }),
          fields: [
            { name: "📈 Nível", value: `**${level}** _(XP ${xp.toLocaleString("pt-BR")} / total ${totalXp.toLocaleString("pt-BR")})_`, inline: true },
            { name: "💰 Saldo", value: fmtCoins(eco.wallet + eco.bank, currency.emoji, currency.name), inline: true },
            { name: "🏦 Banco", value: `${fmtCoins(eco.bank, currency.emoji, currency.name)} / ${eco.bankCap.toLocaleString("pt-BR")}`, inline: true },
            { name: "🎁 Daily", value: dailyStatus, inline: true },
            { name: "🔥 Streak", value: `${eco.streakDaily ?? 0} dia(s)`, inline: true },
            { name: "🎫 Tickets abertos", value: String(openTickets ?? 0), inline: true },
            { name: "⭐ Reputação", value: `${profile?.reputation_total ?? 0} _(semana: ${profile?.reputation_weekly ?? 0})_`, inline: true },
            { name: "🏅 Badges", value: String(badgeCount ?? 0), inline: true },
            { name: "🏆 Conquistas", value: String(achCount ?? 0), inline: true },
            { name: "💎 VIP", value: vipText, inline: false },
          ],
          footer: "Use /help comando nome:central para ver os subcomandos relacionados.",
        }),
      ],
      ...(target.id !== interaction.user.id ? { flags: MessageFlags.Ephemeral } : {}),
    });
  },
};

export default command;
