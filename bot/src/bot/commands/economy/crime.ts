import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { getAccount, getCurrency } from "../../systems/economy/economy.js";
import { economyResponses, pick } from "../../systems/personality/index.js";

const COOLDOWN = 2 * 3600 * 1000;

const command: SlashCommand = {
  category: "economy",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder().setName("crime").setDescription("Cometa um crime arriscado por dinheiro 🤫"),
  async execute(interaction) {
    const acc = await getAccount(interaction.guildId!, interaction.user.id);
    const c = await getCurrency(interaction.guildId!);
    const now = new Date();

    if (acc.lastCrime && now.getTime() - acc.lastCrime.getTime() < COOLDOWN) {
      const remaining = COOLDOWN - (now.getTime() - acc.lastCrime.getTime());
      await interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "A polícia está atenta", description: `Tente novamente em **${fmtDuration(remaining)}**.` })],
        ephemeral: true,
      });
      return;
    }

    acc.lastCrime = now;
    const success = Math.random() < 0.6;
    if (success) {
      const { getUserVipMultiplier } = await import("../../systems/premium/premium.features.js");
      const premiumMult = await getUserVipMultiplier(interaction.user.id, interaction.guildId, "crime").catch(() => 1);
      const reward = Math.floor((300 + Math.random() * 800) * premiumMult);
      acc.wallet += reward;
      await acc.save();
      await interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "🦹 Crime bem-sucedido!", description: `${pick(economyResponses.crimeWin)} ${fmtCoins(reward, c.emoji, c.name)}` })],
      });
    } else {
      const loss = Math.min(acc.wallet, Math.floor(200 + Math.random() * 500));
      acc.wallet -= loss;
      await acc.save();
      await interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "🚓 Você foi pego!", description: `${pick(economyResponses.crimeFail)} ${fmtCoins(loss, c.emoji, c.name)}` })],
      });
    }
  },
};
export default command;
