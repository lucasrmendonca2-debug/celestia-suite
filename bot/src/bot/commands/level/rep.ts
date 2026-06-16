import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { giveReputation } from "../../systems/social/reputation.service.js";
import { getSocialConfig } from "../../systems/social/social.config.ts";
import { fmtDuration } from "../../utils/format.js";
import { classifyTarget, pick, socialResponses } from "../../systems/personality/index.js";

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
    const kind = classifyTarget(interaction, target);
    if (kind === "self") {
      await interaction.reply({ ephemeral: true, embeds: [brandEmbed({ kind: "warn", description: pick(socialResponses.repSelf) })] });
      return;
    }
    if (kind === "bot_self") {
      await interaction.reply({ ephemeral: true, embeds: [brandEmbed({ kind: "warn", description: pick(socialResponses.repBot) })] });
      return;
    }
    if (kind === "bot_other") {
      await interaction.reply({ ephemeral: true, embeds: [brandEmbed({ kind: "warn", description: pick(socialResponses.repOtherBot) })] });
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
    // Conquistas — reputação recebida
    try {
      const { evaluateAchievements } = await import("../../systems/social/achievement.service.js");
      const targetMember = await interaction.guild!.members.fetch(target.id).catch(() => null);
      const unlocked = await evaluateAchievements(interaction.guild!, targetMember, target.id, {
        type: "reputation_received",
        value: result.newRep ?? 0,
      });
      if (unlocked.length > 0 && interaction.channel && "send" in interaction.channel) {
        await interaction.channel.send({
          embeds: [
            brandEmbed({
              kind: "success",
              title: `🏆 ${target.username} desbloqueou ${unlocked.length} conquista${unlocked.length > 1 ? "s" : ""}!`,
              description: unlocked.map((u) => `${u.achievement.emoji} **${u.achievement.name}**`).join("\n"),
            }),
          ],
        });
      }
    } catch {
      /* noop */
    }
  },
};
export default command;
