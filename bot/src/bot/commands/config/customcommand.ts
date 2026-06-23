import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  countCustomCommands,
  deleteCustomCommand,
  getCustomCommand,
  listCustomCommands,
  upsertCustomCommand,
} from "../../repositories/content.repo.js";

const LIMIT_FREE = 10;

const command: SlashCommand = {
  category: "config",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("comando").setNameLocalizations({"en-US":"customcommand"})
    .setDescription("Comandos customizados do servidor (prefixo !)")
    .addSubcommand((s) =>
      s
        .setName("adicionar")
        .setNameLocalizations({ "en-US": "add" })
        .setDescription("Adiciona/atualiza um comando")
        .addStringOption((o) => o.setName("nome").setDescription("Nome (sem !)").setRequired(true))
        .addStringOption((o) => o.setName("resposta").setDescription("Resposta — use {user}, {server}, {channel}").setRequired(true))
        .addBooleanOption((o) => o.setName("embed").setDescription("Enviar como embed"))
        .addBooleanOption((o) => o.setName("apagar_trigger").setDescription("Apagar mensagem que disparou")),
    )
    .addSubcommand((s) =>
      s.setName("remover").setNameLocalizations({ "en-US": "remove" }).setDescription("Remove um comando").addStringOption((o) => o.setName("nome").setDescription("Nome").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("listar").setNameLocalizations({ "en-US": "list" }).setDescription("Lista todos")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    if (sub === "adicionar") {
      const name = interaction.options.getString("nome", true).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
      if (!name) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Nome inválido" })], flags: MessageFlags.Ephemeral });
        return;
      }
      const response = interaction.options.getString("resposta", true).slice(0, 1900);
      const useEmbed = interaction.options.getBoolean("embed") ?? false;
      // P9 fase 3: o limite premium dependia de `Guild.findById` (shim no-op).
      // Mantemos o limite free até reescrever sobre `premium_guild_config`.
      const limit = LIMIT_FREE;
      const count = await countCustomCommands(guildId);
      const existing = await getCustomCommand(guildId, name);
      if (count >= limit && !existing) {
        await interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Limite atingido", description: `Plano atual: **${limit}** comandos.` })],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await upsertCustomCommand({
        guildId,
        name,
        responseText: response,
        embed: useEmbed ? { kind: "brand" } : null,
        createdBy: interaction.user.id,
      });
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Comando salvo", description: `Use **!${name}** no chat.` })], flags: MessageFlags.Ephemeral });
    } else if (sub === "remover") {
      const name = interaction.options.getString("nome", true).toLowerCase();
      await deleteCustomCommand(guildId, name);
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Removido" })], flags: MessageFlags.Ephemeral });
    } else {
      const list = await listCustomCommands(guildId, 50);
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "📝 Comandos customizados",
            description: list.length
              ? list.map((c) => `• **!${c.name}** ${c.enabled ? "" : "*(off)*"} — ${c.uses} usos`).join("\n")
              : "Nenhum ainda.",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
export default command;
