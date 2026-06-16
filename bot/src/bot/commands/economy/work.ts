import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { getAccount, getCurrency, isVip } from "../../systems/economy/economy.js";
import { getConfig } from "../../utils/guildCache.js";

const COOLDOWN = 60 * 60 * 1000; // 1h

const JOBS = [
  "Você entregou pizzas e ganhou",
  "Você consertou bugs no Discord e ganhou",
  "Você fez stream e ganhou",
  "Você vendeu memes na rua e ganhou",
  "Você programou um bot e ganhou",
  "Você cantou no karaokê e ganhou",
];

const command: SlashCommand = {
  category: "economy",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder().setName("trabalhar").setNameLocalizations({"en-US":"work"}).setDescription("Trabalha para ganhar moedas."),
  async execute(interaction) {
    const acc = await getAccount(interaction.guildId!, interaction.user.id);
    const cfg = await getConfig(interaction.guildId!);
    const c = await getCurrency(interaction.guildId!);
    const now = new Date();

    if (acc.lastWork && now.getTime() - acc.lastWork.getTime() < COOLDOWN) {
      const remaining = COOLDOWN - (now.getTime() - acc.lastWork.getTime());
      await interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "Descanse um pouco", description: `Tente novamente em **${fmtDuration(remaining)}**.` })],
        ephemeral: true,
      });
      return;
    }

    const base = Math.floor(cfg.economyWorkMin + Math.random() * (cfg.economyWorkMax - cfg.economyWorkMin));
    const mult = (await isVip(interaction.guildId!, interaction.user.id)) ? cfg.economyVipMultiplier : 1;
    const { getUserVipMultiplier } = await import("../../systems/premium/premium.features.js");
    const premiumMult = await getUserVipMultiplier(interaction.user.id, interaction.guildId, "work").catch(() => 1);
    const amount = Math.floor(base * mult * premiumMult);
    acc.wallet += amount;
    acc.lastWork = now;
    await acc.save();

    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    await interaction.reply({
      embeds: [brandEmbed({ kind: "success", title: "💼 Trabalho concluído", description: `${job} ${fmtCoins(amount, c.emoji, c.name)}` })],
    });
  },
};
export default command;
