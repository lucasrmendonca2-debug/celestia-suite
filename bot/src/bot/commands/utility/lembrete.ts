import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { Reminder } from "../../../database/models.js";

function parseDuration(input: string): number | null {
  const m = input.trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d)$/);
  if (!m || !m[1] || !m[2]) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const mult = unit === "s" ? 1_000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return n * mult;
}

const command: SlashCommand = {
  category: "utility",
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("lembrete")
    .setDescription("Cria um lembrete pessoal.")
    .addSubcommand((s) =>
      s
        .setName("criar")
        .setDescription("Cria um novo lembrete.")
        .addStringOption((o) =>
          o.setName("tempo").setDescription("Ex.: 10m, 2h, 1d").setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("mensagem").setDescription("O que lembrar").setRequired(true),
        ),
    )
    .addSubcommand((s) => s.setName("listar").setDescription("Mostra seus lembretes ativos."))
    .addSubcommand((s) =>
      s
        .setName("cancelar")
        .setDescription("Cancela um lembrete pelo ID.")
        .addStringOption((o) => o.setName("id").setDescription("ID do lembrete").setRequired(true)),
    ),
  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "Use dentro de um servidor.", flags: MessageFlags.Ephemeral });
      return;
    }
    const sub = interaction.options.getSubcommand();

    if (sub === "criar") {
      const tempo = interaction.options.getString("tempo", true);
      const mensagem = interaction.options.getString("mensagem", true);
      const ms = parseDuration(tempo);
      if (!ms || ms < 10_000 || ms > 30 * 86_400_000) {
        await interaction.reply({
          content: "Tempo inválido. Use 10s a 30d (ex.: `30m`, `2h`, `1d`).",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const r = await Reminder.create({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        channelId: interaction.channelId,
        message: mensagem.slice(0, 500),
        remindAt: new Date(Date.now() + ms),
      });
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "⏰ Lembrete agendado",
            description: `Vou te lembrar <t:${Math.floor((Date.now() + ms) / 1000)}:R>.`,
            fields: [
              { name: "Mensagem", value: mensagem.slice(0, 1000) },
              { name: "ID", value: `\`${String(r._id)}\``, inline: true },
            ],
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === "listar") {
      const items = await Reminder.find({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        delivered: false,
      })
        .sort({ remindAt: 1 })
        .limit(10);
      if (items.length === 0) {
        await interaction.reply({ content: "Você não tem lembretes ativos.", flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "info",
            title: "⏰ Seus lembretes",
            description: items
              .map(
                (r) =>
                  `\`${String(r._id)}\` — <t:${Math.floor(r.remindAt.getTime() / 1000)}:R>\n${r.message}`,
              )
              .join("\n\n"),
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === "cancelar") {
      const id = interaction.options.getString("id", true);
      const res = await Reminder.deleteOne({
        _id: id,
        userId: interaction.user.id,
        delivered: false,
      }).catch(() => null);
      if (!res || res.deletedCount === 0) {
        await interaction.reply({ content: "Lembrete não encontrado.", flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({ content: "✅ Lembrete cancelado.", flags: MessageFlags.Ephemeral });
    }
  },
};

export default command;
