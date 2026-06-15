import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { LevelReward } from "../../../database/models.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("levelreward")
    .setDescription("Configura cargos por nível.")
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Adiciona recompensa")
        .addIntegerOption((o) => o.setName("nivel").setDescription("Nível").setRequired(true).setMinValue(1))
        .addRoleOption((o) => o.setName("cargo").setDescription("Cargo").setRequired(true))
        .addBooleanOption((o) => o.setName("remover_anteriores").setDescription("Remove cargos de níveis anteriores")),
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Remove recompensa").addIntegerOption((o) => o.setName("nivel").setDescription("Nível").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription("Lista recompensas")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    if (sub === "add") {
      const level = interaction.options.getInteger("nivel", true);
      const role = interaction.options.getRole("cargo", true);
      const removePrevious = interaction.options.getBoolean("remover_anteriores") ?? false;
      await LevelReward.findOneAndUpdate({ guildId, level }, { roleId: role.id, removePrevious }, { upsert: true });
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Recompensa salva", description: `Nível **${level}** → <@&${role.id}>` })], ephemeral: true });
    } else if (sub === "remove") {
      const level = interaction.options.getInteger("nivel", true);
      await LevelReward.deleteOne({ guildId, level });
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Removido" })], ephemeral: true });
    } else {
      const list = await LevelReward.find({ guildId }).sort({ level: 1 });
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "🎁 Recompensas por nível",
            description: list.length ? list.map((r) => `Nível **${r.level}** → <@&${r.roleId}>${r.removePrevious ? " *(substitui anterior)*" : ""}`).join("\n") : "Nenhuma.",
          }),
        ],
        ephemeral: true,
      });
    }
  },
};
export default command;
