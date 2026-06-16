import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { getAccount, getCurrency, isVip } from "../../systems/economy/economy.js";
import { getConfig } from "../../utils/guildCache.js";
import { logTx } from "../../systems/economy/economy.tx.js";
import { incrementMissionProgress } from "../../systems/economy/missions.js";

const DAY = 24 * 3600 * 1000;

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder().setName("daily").setDescription("Recompensa diária."),
  async execute(interaction) {
    const acc = await getAccount(interaction.guildId!, interaction.user.id);
    const cfg = await getConfig(interaction.guildId!);
    const c = await getCurrency(interaction.guildId!);
    const now = new Date();

    if (acc.lastDaily) {
      const diff = now.getTime() - acc.lastDaily.getTime();
      if (diff < DAY) {
        const remaining = DAY - diff;
        await interaction.reply({
          embeds: [brandEmbed({ kind: "warn", title: "⏳ Já coletou", description: `Volte em **${fmtDuration(remaining)}**.` })],
          ephemeral: true,
        });
        return;
      }
      acc.streakDaily = diff < 2 * DAY ? acc.streakDaily + 1 : 1;
    } else {
      acc.streakDaily = 1;
    }

    const vipMult = (await isVip(interaction.guildId!, interaction.user.id)) ? cfg.economyVipMultiplier : 1;
    const { getUserVipMultiplier } = await import("../../systems/premium/premium.features.js");
    const premiumMult = await getUserVipMultiplier(interaction.user.id, interaction.guildId, "daily").catch(() => 1);
    const streakBonus = Math.min(acc.streakDaily, 7) * 50;
    const amount = Math.floor((cfg.economyDailyAmount + streakBonus) * vipMult * premiumMult);

    acc.wallet += amount;
    acc.lastDaily = now;
    await acc.save();

    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: "🎁 Diária coletada!",
          description: `Você ganhou ${fmtCoins(amount, c.emoji, c.name)}\n**Streak:** ${acc.streakDaily} dia(s) ${vipMult > 1 ? "• 💎 VIP boost" : ""}`,
        }),
      ],
    });
  },
};
export default command;
