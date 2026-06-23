import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { giveReputation, getTopReputation } from "../../systems/social/reputation.service.js";
import { classifyTarget, pick, socialResponses } from "../../systems/personality/index.js";

function fmtRemaining(ms: number): string {
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h${r ? ` ${r}min` : ""}`;
}

const command: SlashCommand = {
  category: "utility",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Reputação social.")
    .addSubcommand((s) =>
      s
        .setName("dar")
        .setDescription("Dá +1 reputação a um usuário (cooldown 12h).")
        .addUserOption((o) => o.setName("usuario").setDescription("Para quem").setRequired(true))
        .addStringOption((o) => o.setName("mensagem").setDescription("Mensagem opcional").setMaxLength(200)),
    )
    .addSubcommand((s) => s.setName("top").setDescription("Top 10 reputações do servidor.")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "dar") {
      const target = interaction.options.getUser("usuario", true);
      const message = interaction.options.getString("mensagem");
      const kind = classifyTarget(interaction, target);
      if (kind === "self") {
        return void interaction.reply({ embeds: [brandEmbed({ kind: "warn", description: pick(socialResponses.repSelf) })], flags: MessageFlags.Ephemeral });
      }
      if (kind === "bot_self") {
        return void interaction.reply({ embeds: [brandEmbed({ kind: "warn", description: pick(socialResponses.repBot) })], flags: MessageFlags.Ephemeral });
      }
      if (kind === "bot_other") {
        return void interaction.reply({ embeds: [brandEmbed({ kind: "warn", description: pick(socialResponses.repOtherBot) })], flags: MessageFlags.Ephemeral });
      }
      const res = await giveReputation(guildId, interaction.user.id, target.id, message);
      if (!res.ok) {
        return void interaction.reply({
          content: `⏳ Você já deu rep recentemente. Tente em ${fmtRemaining(res.remainingMs ?? 0)}.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "⭐ Reputação enviada",
            description: `<@${interaction.user.id}> deu +1 rep para <@${target.id}>.\nTotal: **${res.newRep}**`,
            fields: message ? [{ name: "Mensagem", value: message }] : undefined,
          }),
        ],
      });
      return;
    }

    if (sub === "top") {
      const top = await getTopReputation(guildId, 10);
      if (!top.length) {
        return void interaction.reply({ content: "Ainda não há reputações.", flags: MessageFlags.Ephemeral });
      }
      const lines = top
        .map((r, i) => `**${i + 1}.** <@${r.user_id}> — ⭐ ${r.reputation}`)
        .join("\n");
      await interaction.reply({
        embeds: [brandEmbed({ title: "🏆 Top Reputação", description: lines })],
      });
      return;
    }
  },
};

export default command;
