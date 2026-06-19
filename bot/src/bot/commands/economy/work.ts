import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { getAsset } from "../../systems/ui/embed.assets.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { currencyFromConfig, getAccount, isVip } from "../../systems/economy/economy.js";
import { getConfig } from "../../utils/guildCache.js";
import { logTx } from "../../systems/economy/economy.tx.js";
import { incrementMissionProgress } from "../../systems/economy/missions.js";
import { economyResponses } from "../../systems/personality/index.js";

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
    const [acc, cfg] = await Promise.all([
      getAccount(guildId, interaction.user.id),
      getConfig(guildId),
    ]);
    const c = currencyFromConfig(cfg);
    const cooldown = Math.max(0, (cfg.economyWorkCooldownSeconds ?? 3600) * 1000);
    const now = new Date();

    if (cfg.economyEnabled === false) {
      await interaction.reply({ embeds: [ui.warn({ title: "Economia desativada" })], ephemeral: true });
      return;
    }

    if (acc.lastWork && now.getTime() - acc.lastWork.getTime() < cooldown) {
      const remaining = cooldown - (now.getTime() - acc.lastWork.getTime());
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

    const { getUserVipMultiplier } = await import("../../systems/premium/premium.features.js");
    const [vipMember, premiumMult] = await Promise.all([
      isVip(guildId, interaction.user.id),
      getUserVipMultiplier(interaction.user.id, guildId, "work").catch(() => 1),
    ]);
    const min = cfg.economyWorkMin ?? 80;
    const max = Math.max(min, cfg.economyWorkMax ?? 320);
    const base = Math.floor(min + Math.random() * (max - min + 1));
    const mult = vipMember ? cfg.economyVipMultiplier : 1;
    const amount = Math.floor(base * mult * premiumMult);
    acc.wallet += amount;
    acc.lastWork = now;
    await acc.save();

    void logTx({
      guildId,
      userId: interaction.user.id,
      kind: "work",
      amount,
      balanceAfter: acc.wallet,
      reason: "Trabalho",
    });
    void incrementMissionProgress(guildId, interaction.user.id, "work");

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
