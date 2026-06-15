import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { CustomCommand, Guild } from "../../../database/models.js";

const LIMIT_FREE = 10;
const LIMIT_PREMIUM = 100;

const command: SlashCommand = {
  category: "config",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("customcommand")
    .setDescription("Comandos customizados do servidor (prefixo !)")
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Adiciona/atualiza um comando")
        .addStringOption((o) => o.setName("nome").setDescription("Nome (sem !)").setRequired(true))
        .addStringOption((o) => o.setName("resposta").setDescription("Resposta — use {user}, {server}, {channel}").setRequired(true))
        .addBooleanOption((o) => o.setName("embed").setDescription("Enviar como embed"))
        .addBooleanOption((o) => o.setName("apagar_trigger").setDescription("Apagar mensagem que disparou")),
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Remove um comando").addStringOption((o) => o.setName("nome").setDescription("Nome").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription("Lista todos")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    if (sub === "add") {
      const name = interaction.options.getString("nome", true).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
      if (!name) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Nome inválido" })], ephemeral: true });
        return;
      }
      const response = interaction.options.getString("resposta", true).slice(0, 1900);
      const embed = interaction.options.getBoolean("embed") ?? false;
      const deleteTrigger = interaction.options.getBoolean("apagar_trigger") ?? false;
      const guild = await Guild.findById(guildId);
      const limit = guild?.premium ? LIMIT_PREMIUM : LIMIT_FREE;
      const count = await CustomCommand.countDocuments({ guildId });
      if (count >= limit && !(await CustomCommand.findOne({ guildId, name }))) {
        await interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Limite atingido", description: `Plano atual: **${limit}** comandos. Faça upgrade VIP para **${LIMIT_PREMIUM}**.` })],
          ephemeral: true,
        });
        return;
      }
      await CustomCommand.findOneAndUpdate(
        { guildId, name },
        { response, embed, deleteTrigger, createdBy: interaction.user.id, enabled: true },
        { upsert: true, setDefaultsOnInsert: true },
      );
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Comando salvo", description: `Use **!${name}** no chat.` })], ephemeral: true });
    } else if (sub === "remove") {
      const name = interaction.options.getString("nome", true).toLowerCase();
      await CustomCommand.deleteOne({ guildId, name });
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Removido" })], ephemeral: true });
    } else {
      const list = await CustomCommand.find({ guildId }).limit(50);
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "📝 Comandos customizados",
            description: list.length
              ? list.map((c) => `• **!${c.name}** ${c.enabled ? "" : "*(off)*"} — ${c.uses} usos`).join("\n")
              : "Nenhum ainda.",
          }),
        ],
        ephemeral: true,
      });
    }
  },
};
export default command;
