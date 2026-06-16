import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { getAsset } from "../../systems/ui/embed.assets.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { getAccount, getCurrency, isVip } from "../../systems/economy/economy.js";
import { getConfig } from "../../utils/guildCache.js";
import { logTx } from "../../systems/economy/economy.tx.js";
import { incrementMissionProgress } from "../../systems/economy/missions.js";
import { economyResponses } from "../../systems/personality/index.js";

const COOLDOWN = 60 * 60 * 1000; // 1h
const JOBS = economyResponses.workJobs;

const command: SlashCommand = {
  category: "economy",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("trabalhar")
    .setNameLocalizations({ "en-US": "work" })
    .setDescription("Trabalha para ganhar moedas."),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const acc = await getAccount(guildId, interaction.user.id);
    const cfg = await getConfig(guildId);
    const c = await getCurrency(guildId);
    const now = new Date();

    if (acc.lastWork && now.getTime() - acc.lastWork.getTime() < COOLDOWN) {
      const remaining = COOLDOWN - (now.getTime() - acc.lastWork.getTime());
      await interaction.reply({
        embeds: [
          ui.warn({
            title: "Descanse um pouco",
            description: `Você pode trabalhar novamente em **${fmtDuration(remaining)}**.`,
          }),
        ],
        ephemeral: true,
      });
      return;
    }

    const base = Math.floor(cfg.economyWorkMin + Math.random() * (cfg.economyWorkMax - cfg.economyWorkMin));
    const mult = (await isVip(guildId, interaction.user.id)) ? cfg.economyVipMultiplier : 1;
    const { getUserVipMultiplier } = await import("../../systems/premium/premium.features.js");
    const premiumMult = await getUserVipMultiplier(interaction.user.id, guildId, "work").catch(() => 1);
    const amount = Math.floor(base * mult * premiumMult);
    acc.wallet += amount;
    acc.lastWork = now;
    await acc.save();

    await logTx({
      guildId,
      userId: interaction.user.id,
      kind: "work",
      amount,
      balanceAfter: acc.wallet,
      reason: "Trabalho",
    });
    await incrementMissionProgress(guildId, interaction.user.id, "work");

    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    const image = await getAsset(guildId, "economy.work_image");
    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Trabalho concluído",
          description: `${job}\n\nVocê recebeu ${fmtCoins(amount, c.emoji, c.name)}${mult > 1 ? " · 💎 VIP boost" : ""}${premiumMult > 1 ? " · ✨ Premium" : ""}`,
          image,
          fields: [{ name: "Carteira", value: fmtCoins(acc.wallet, c.emoji, c.name), inline: true }],
        }),
      ],
    });
  },
};
export default command;
