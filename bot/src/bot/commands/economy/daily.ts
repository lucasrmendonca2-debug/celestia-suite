import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { getAsset } from "../../systems/ui/embed.assets.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { currencyFromConfig, getAccount, isVip } from "../../systems/economy/economy.js";
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
    const guildId = interaction.guildId!;
    const [acc, cfg] = await Promise.all([
      getAccount(guildId, interaction.user.id),
      getConfig(guildId),
    ]);
    const c = currencyFromConfig(cfg);
    const now = new Date();

    if (cfg.economyEnabled === false) {
      await interaction.reply({ embeds: [ui.warn({ title: "Economia desativada" })], ephemeral: true });
      return;
    }

    if (acc.lastDaily) {
      const diff = now.getTime() - acc.lastDaily.getTime();
      if (diff < DAY) {
        const remaining = DAY - diff;
        await interaction.reply({
          embeds: [
            ui.warn({
              title: "Já coletou hoje",
              description: `Volte em **${fmtDuration(remaining)}** para a próxima recompensa diária.`,
            }),
          ],
          ephemeral: true,
        });
        return;
      }
      acc.streakDaily = diff < 2 * DAY ? acc.streakDaily + 1 : 1;
    } else {
      acc.streakDaily = 1;
    }

    const { getUserVipMultiplier } = await import("../../systems/premium/premium.features.js");
    const [vipMember, premiumMult] = await Promise.all([
      isVip(guildId, interaction.user.id),
      getUserVipMultiplier(interaction.user.id, guildId, "daily").catch(() => 1),
    ]);
    const vipMult = vipMember ? cfg.economyVipMultiplier : 1;
    const streakBonus = Math.min(acc.streakDaily, 7) * 50;
    const amount = Math.floor((cfg.economyDailyAmount + streakBonus) * vipMult * premiumMult);

    acc.wallet += amount;
    acc.lastDaily = now;
    await acc.save();

    void logTx({
      guildId,
      userId: interaction.user.id,
      kind: "daily",
      amount,
      balanceAfter: acc.wallet,
      reason: `Diária (streak ${acc.streakDaily})`,
    });
    void incrementMissionProgress(guildId, interaction.user.id, "daily");

    const image = await getAsset(guildId, "economy.daily_image");
    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Recompensa diária liberada",
          description: `Você ganhou ${fmtCoins(amount, c.emoji, c.name)}\n**Streak:** ${acc.streakDaily} dia(s)${vipMult > 1 ? " · 💎 VIP boost" : ""}${premiumMult > 1 ? " · ✨ Premium" : ""}`,
          image,
          fields: [
            { name: "Carteira", value: fmtCoins(acc.wallet, c.emoji, c.name), inline: true },
            { name: "Bônus de streak", value: `+${streakBonus}`, inline: true },
          ],
        }),
      ],
    });
  },
};
export default command;
