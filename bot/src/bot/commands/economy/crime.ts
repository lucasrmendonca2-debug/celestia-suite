import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { getAsset } from "../../systems/ui/embed.assets.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { addWallet, claimCooldown, getAccount, getCurrency, removeWallet } from "../../systems/economy/economy.js";
import { economyResponses, pick } from "../../systems/personality/index.js";

const COOLDOWN = 2 * 3600 * 1000;

const command: SlashCommand = {
  category: "economy",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder().setName("crime").setDescription("Cometa um crime arriscado por dinheiro 🤫"),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const acc = await getAccount(guildId, interaction.user.id);
    const c = await getCurrency(guildId);
    const now = new Date();

    if (acc.lastCrime && now.getTime() - acc.lastCrime.getTime() < COOLDOWN) {
      const remaining = COOLDOWN - (now.getTime() - acc.lastCrime.getTime());
      await interaction.reply({
        embeds: [
          ui.warn({
            title: "A polícia está atenta",
            description: `Aguarde **${fmtDuration(remaining)}** antes de tentar de novo.`,
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Atômico: trava cooldown ANTES de qualquer side-effect — evita race + cooldown perdido se algo lançar.
    const locked = await claimCooldown(guildId, interaction.user.id, "last_crime_at", COOLDOWN / 1000);
    if (!locked) {
      await interaction.reply({
        embeds: [ui.warn({ title: "A polícia está atenta", description: "Você já cometeu um crime recente." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    // cooldown atômico já travado — busca asset apenas após confirmar
    const success = Math.random() < 0.6;
    const image = await getAsset(guildId, "economy.crime_image");
    if (success) {
      const { getUserVipMultiplier } = await import("../../systems/premium/premium.features.js");
      const premiumMult = await getUserVipMultiplier(interaction.user.id, guildId, "crime").catch(() => 1);
      const reward = Math.floor((300 + Math.random() * 800) * premiumMult);
      await addWallet(guildId, interaction.user.id, reward);
      await interaction.reply({
        embeds: [
          ui.economy({
            guildId,
            title: "Crime bem-sucedido",
            description: `🦹 ${pick(economyResponses.crimeWin)}\n\nLucro: ${fmtCoins(reward, c.emoji, c.name)}`,
            image,
          }),
        ],
      });
    } else {
      const loss = Math.min(acc.wallet, Math.floor(200 + Math.random() * 500));
      await removeWallet(guildId, interaction.user.id, loss);
      await interaction.reply({
        embeds: [
          ui.error({
            title: "Você foi pego!",
            description: `🚓 ${pick(economyResponses.crimeFail)}\n\nPrejuízo: ${fmtCoins(loss, c.emoji, c.name)}`,
          }),
        ],
      });
    }
  },
};
export default command;
