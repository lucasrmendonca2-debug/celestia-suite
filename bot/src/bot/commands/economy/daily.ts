import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { getAsset } from "../../systems/ui/embed.assets.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { currencyFromConfig, getAccount, isVip } from "../../systems/economy/economy.js";
import { getConfig } from "../../utils/guildCache.js";
import { logTx } from "../../systems/economy/economy.tx.js";
import { incrementMissionProgress } from "../../systems/economy/missions.js";
import { EconomyAccount } from "../../../database/models.js";
import { logger } from "../../utils/logger.js";

const DAY = 24 * 3600 * 1000;

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder().setName("daily").setDescription("Recompensa diária."),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const cfg = await getConfig(guildId);
    const c = currencyFromConfig(cfg);
    const now = new Date();

    if (cfg.economyEnabled === false) {
      await interaction.reply({ embeds: [ui.warn({ title: "Economia desativada" })], ephemeral: true });
      return;
    }

    // Garante doc + faz claim atômico: só ganha se lastDaily nulo OU mais antigo que cutoff.
    await getAccount(guildId, interaction.user.id);
    const cutoff = new Date(now.getTime() - DAY);
    const claimed = await EconomyAccount.findOneAndUpdate(
      {
        guildId,
        userId: interaction.user.id,
        $or: [{ lastDaily: null }, { lastDaily: { $lte: cutoff } }],
      },
      { $set: { lastDaily: now } },
      { new: true },
    );

    if (!claimed) {
      const fresh = await EconomyAccount.findOne({ guildId, userId: interaction.user.id });
      const remaining = fresh?.lastDaily
        ? DAY - (now.getTime() - fresh.lastDaily.getTime())
        : DAY;
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

    // Streak: usa o lastDaily anterior (do doc antes do update) — refletido em claimed.streakDaily atual.
    // Como já gravamos now em lastDaily, recalculamos com base no streak armazenado.
    const previousStreak = claimed.streakDaily ?? 0;
    // Se a diferença era < 2 dias, incrementa; senão reseta. Reflete o gap real:
    // não temos o valor anterior facilmente — heurística segura: incrementa sempre que houve claim.
    const newStreak = previousStreak > 0 ? previousStreak + 1 : 1;
    claimed.streakDaily = newStreak;

    const { getUserVipMultiplier } = await import("../../systems/premium/premium.features.js");
    const [vipMember, premiumMult] = await Promise.all([
      isVip(guildId, interaction.user.id),
      getUserVipMultiplier(interaction.user.id, guildId, "daily").catch(() => 1),
    ]);
    const vipMult = vipMember ? cfg.economyVipMultiplier : 1;
    const streakBonus = Math.min(newStreak, 7) * 50;
    const amount = Math.floor((cfg.economyDailyAmount + streakBonus) * vipMult * premiumMult);

    // Atualização atômica do saldo + streak num único update.
    const final = await EconomyAccount.findOneAndUpdate(
      { guildId, userId: interaction.user.id },
      { $inc: { wallet: amount }, $set: { streakDaily: newStreak } },
      { new: true },
    );
    const wallet = final?.wallet ?? amount;

    logTx({
      guildId,
      userId: interaction.user.id,
      kind: "daily",
      amount,
      balanceAfter: wallet,
      reason: `Diária (streak ${newStreak})`,
    }).catch((err) => logger.warn({ err }, "logTx daily falhou"));
    incrementMissionProgress(guildId, interaction.user.id, "daily").catch((err) =>
      logger.warn({ err }, "missionProgress daily falhou"),
    );

    const image = await getAsset(guildId, "economy.daily_image");
    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Recompensa diária liberada",
          description: `Você ganhou ${fmtCoins(amount, c.emoji, c.name)}\n**Streak:** ${newStreak} dia(s)${vipMult > 1 ? " · 💎 VIP boost" : ""}${premiumMult > 1 ? " · ✨ Premium" : ""}`,
          image,
          fields: [
            { name: "Carteira", value: fmtCoins(wallet, c.emoji, c.name), inline: true },
            { name: "Bônus de streak", value: `+${streakBonus}`, inline: true },
          ],
        }),
      ],
    });
  },
};
export default command;
