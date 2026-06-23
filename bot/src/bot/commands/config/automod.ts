import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { GuildConfig } from "../../../database/models.js";

const command: SlashCommand = {
  category: "config",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configura o AutoMod do servidor.")
    .addSubcommand((s) =>
      s
        .setName("toggle")
        .setDescription("Liga/desliga um filtro")
        .addStringOption((o) =>
          o.setName("filtro").setDescription("Filtro").setRequired(true).addChoices(
            { name: "Anti-link", value: "antiLinkEnabled" },
            { name: "Anti-invite", value: "antiInviteEnabled" },
            { name: "Anti-spam", value: "antiSpamEnabled" },
            { name: "Anti-raid", value: "antiRaidEnabled" },
          ),
        )
        .addBooleanOption((o) => o.setName("estado").setDescription("on/off").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("blacklist-add")
        .setDescription("Adiciona palavra proibida")
        .addStringOption((o) => o.setName("palavra").setDescription("Palavra").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("blacklist-remove")
        .setDescription("Remove palavra proibida")
        .addStringOption((o) => o.setName("palavra").setDescription("Palavra").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("blacklist-list").setDescription("Lista palavras proibidas"))
    .addSubcommand((s) =>
      s
        .setName("whitelist-role")
        .setDescription("Adiciona/remove cargo isento")
        .addRoleOption((o) => o.setName("cargo").setDescription("Cargo").setRequired(true)),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const cfg = (await GuildConfig.findOneAndUpdate({ guildId }, { $setOnInsert: { guildId } }, { upsert: true, new: true, setDefaultsOnInsert: true }))!;

    if (sub === "toggle") {
      const key = interaction.options.getString("filtro", true) as
        | "antiLinkEnabled"
        | "antiInviteEnabled"
        | "antiSpamEnabled"
        | "antiRaidEnabled";
      const state = interaction.options.getBoolean("estado", true);
      cfg.set(key, state);
      await cfg.save();
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "AutoMod atualizado", description: `**${key}** → ${state ? "ON" : "OFF"}` })], flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "blacklist-add") {
      const w = interaction.options.getString("palavra", true).toLowerCase();
      if (!cfg.blacklistedWords.includes(w)) cfg.blacklistedWords.push(w);
      await cfg.save();
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Palavra adicionada" })], flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "blacklist-remove") {
      const w = interaction.options.getString("palavra", true).toLowerCase();
      cfg.blacklistedWords = cfg.blacklistedWords.filter((x) => x !== w);
      await cfg.save();
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Palavra removida" })], flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "blacklist-list") {
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "🚫 Blacklist",
            description: cfg.blacklistedWords.length ? cfg.blacklistedWords.map((w) => `\`${w}\``).join(" ") : "Vazia.",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === "whitelist-role") {
      const role = interaction.options.getRole("cargo", true);
      const exists = cfg.automodWhitelistRoles.includes(role.id);
      cfg.automodWhitelistRoles = exists
        ? cfg.automodWhitelistRoles.filter((r) => r !== role.id)
        : [...cfg.automodWhitelistRoles, role.id];
      await cfg.save();
      await interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: exists ? "Cargo removido da whitelist" : "Cargo adicionado à whitelist", description: `<@&${role.id}>` })],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
export default command;
