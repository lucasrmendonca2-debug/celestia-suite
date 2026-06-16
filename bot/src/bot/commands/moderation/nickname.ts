import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";
import { getModerationConfig, logModerationEvent } from "../../systems/moderation/moderation.service.js";
import { postModerationLog } from "../../systems/moderation/moderation.logger.js";
import { createCase } from "../../systems/moderation/cases.service.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 3,
  guildOnly: true,
  botPermissions: [PermissionFlagsBits.ManageNicknames],
  data: new SlashCommandBuilder()
    .setName("nickname")
    .setDescription("Altera o apelido de um usuário.")
    .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
    .addStringOption((o) =>
      o.setName("apelido").setDescription("Novo apelido (vazio para resetar)").setMaxLength(32),
    )
    .addStringOption((o) => o.setName("motivo").setDescription("Motivo")),
  async execute(interaction) {
    const guild = interaction.guild!;
    const author = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(author, "can_use_moderation"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão." })],
        ephemeral: true,
      });
    }
    const user = interaction.options.getUser("usuario", true);
    const nick = interaction.options.getString("apelido");
    const reason = interaction.options.getString("motivo") ?? undefined;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Usuário não está no servidor." })],
        ephemeral: true,
      });
    }
    if (!member.manageable) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Não consigo alterar o apelido (hierarquia)." })],
        ephemeral: true,
      });
    }
    const oldNick = member.nickname ?? "(nenhum)";
    await member.setNickname(nick ?? null, `[${interaction.user.tag}] ${reason ?? ""}`);
    const config = await getModerationConfig(guild.id);
    const c = await createCase({
      guildId: guild.id,
      userId: user.id,
      userTag: user.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      action: "NICKNAME",
      reason: `${oldNick} → ${nick ?? "(reset)"}${reason ? ` · ${reason}` : ""}`,
      source: "BOT",
    });
    await logModerationEvent({
      guildId: guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      action: "NICKNAME",
      reason,
      details: { caseNumber: c.case_number, oldNick, newNick: nick },
    });
    await postModerationLog({
      guild,
      type: "WARN",
      target: user,
      moderator: interaction.user,
      reason: `Apelido: \`${oldNick}\` → \`${nick ?? "(reset)"}\``,
      config,
      caseNumber: c.case_number,
    });
    await interaction.reply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: `Apelido alterado · Caso #${c.case_number}`,
          description: `<@${user.id}>: \`${oldNick}\` → \`${nick ?? "(reset)"}\``,
        }),
      ],
      ephemeral: true,
    });
  },
};

export default command;
