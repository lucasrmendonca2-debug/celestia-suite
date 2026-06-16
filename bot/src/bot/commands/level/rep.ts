import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { giveReputation } from "../../systems/social/reputation.service.js";
import { getSocialConfig } from "../../systems/social/social.config.ts";
import { fmtDuration } from "../../utils/format.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Dá uma reputação para outro usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Quem receberá").setRequired(true))
    .addStringOption((o) => o.setName("mensagem").setDescription("Mensagem opcional").setMaxLength(200)) as SlashCommandBuilder,

  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const target = interaction.options.getUser("usuario", true);
    const message = interaction.options.getString("mensagem");

    const cfg = await getSocialConfig(interaction.guildId!);
    if (!cfg.enabled || !cfg.reputation_enabled) {
      await interaction.reply({ ephemeral: true, content: "❌ Reputação desativada neste servidor." });
      return;
    }
    if (target.bot) {
      await interaction.reply({ ephemeral: true, content: "❌ Bots não recebem reputação." });
      return;
    }
    if (target.id === interaction.user.id) {
      await interaction.reply({ ephemeral: true, content: "❌ Você não pode dar reputação pra si mesmo." });
      return;
    }

    const result = await giveReputation(interaction.guildId!, interaction.user.id, target.id, message);
    if (!result.ok) {
      await interaction.reply({
        ephemeral: true,
        content: `⏳ Calma aí! Você precisa esperar **${fmtDuration(result.remainingMs ?? 0)}** antes de dar reputação de novo.`,
      });
      return;
    }
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: "❤️ Reputação enviada!",
          description: `${interaction.user} deu reputação para ${target}. Total: **${result.newRep}**`,
          ...(message ? { fields: [{ name: "Mensagem", value: message }] } : {}),
        }),
      ],
    });
  },
};
export default command;
