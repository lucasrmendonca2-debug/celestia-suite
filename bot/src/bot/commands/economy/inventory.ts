import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { InventoryItem } from "../../../database/models.js";

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("inventario").setNameLocalizations({"en-US":"inventory"})
    .setDescription("Mostra seu inventário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Outro usuário")),
  async execute(interaction) {
    const target = interaction.options.getUser("usuario") ?? interaction.user;
    const items = await InventoryItem.find({ guildId: interaction.guildId!, userId: target.id }).limit(50);
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: `🎒 Inventário de ${target.username}`,
          description: items.length
            ? items.map((i) => `• **${i.name}** ×${i.quantity}`).join("\n")
            : "Inventário vazio.",
          thumbnail: target.displayAvatarURL(),
        }),
      ],
    });
  },
};
export default command;
