import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { Announcement } from "../../../database/models.js";

function parseDuration(input: string): number | null {
  const m = input.trim().toLowerCase().match(/^(\d+)\s*(s|m|h|d)$/);
  if (!m || !m[1] || !m[2]) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const mult = unit === "s" ? 1_000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return n * mult;
}

function resolveMention(value: string | null, guildId: string): string | null {
  if (!value) return null;
  if (value === "everyone") return `@everyone`;
  if (value === "here") return `@here`;
  if (/^\d{17,20}$/.test(value)) return `<@&${value}>`;
  return null;
}

const command: SlashCommand = {
  category: "utility",
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("anuncio")
    .setDescription("Cria um anúncio formatado.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages.toString())
    .addSubcommand((s) =>
      s
        .setName("enviar")
        .setDescription("Envia agora ou agenda um anúncio.")
        .addChannelOption((o) =>
          o
            .setName("canal")
            .setDescription("Canal onde será enviado")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("mensagem").setDescription("Conteúdo do anúncio").setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("titulo").setDescription("Título do embed").setRequired(false),
        )
        .addStringOption((o) =>
          o
            .setName("mencao")
            .setDescription("everyone, here ou ID do cargo")
            .setRequired(false),
        )
        .addStringOption((o) =>
          o
            .setName("em")
            .setDescription("Agendar para daqui a X (ex.: 10m, 2h). Vazio = enviar agora.")
            .setRequired(false),
        ),
    )
    .addSubcommand((s) => s.setName("listar").setDescription("Lista anúncios agendados.")),
  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "listar") {
      const items = await Announcement.find({ guildId: interaction.guildId!, sent: false })
        .sort({ scheduledFor: 1 })
        .limit(10);
      if (items.length === 0) {
        await interaction.reply({ content: "Nenhum anúncio agendado.", flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "info",
            title: "📣 Anúncios agendados",
            description: items
              .map(
                (a) =>
                  `\`${String(a._id)}\` — <#${a.channelId}> — <t:${Math.floor((a.scheduledFor ?? new Date()).getTime() / 1000)}:R>\n> ${a.content.slice(0, 120)}`,
              )
              .join("\n\n"),
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const canal = interaction.options.getChannel("canal", true);
    const mensagem = interaction.options.getString("mensagem", true);
    const titulo = interaction.options.getString("titulo");
    const mencao = interaction.options.getString("mencao");
    const em = interaction.options.getString("em");

    let scheduledFor: Date | null = null;
    if (em) {
      const ms = parseDuration(em);
      if (!ms || ms < 30_000 || ms > 30 * 86_400_000) {
        await interaction.reply({
          content: "Tempo inválido. Use 30s a 30d (ex.: `10m`, `2h`).",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      scheduledFor = new Date(Date.now() + ms);
    }

    const mentionContent = resolveMention(mencao, interaction.guildId!);

    if (!scheduledFor) {
      const ch = canal as TextChannel;
      try {
        await ch.send({
          content: mentionContent ?? undefined,
          embeds: [
            brandEmbed({
              kind: "info",
              title: (titulo ?? "📣 Anúncio").slice(0, 256),
              description: mensagem.slice(0, 4000),
              footer: `Por ${interaction.user.username}`,
            }),
          ],
          allowedMentions:
            mencao === "everyone" || mencao === "here"
              ? { parse: ["everyone"] }
              : mencao && /^\d{17,20}$/.test(mencao)
                ? { roles: [mencao] }
                : { parse: [] },
        });
      } catch (err) {
        await interaction.reply({
          content: `❌ Falha ao enviar em <#${canal.id}>. O bot tem permissão de **Enviar Mensagens** e **Inserir Links** lá?`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await Announcement.create({
        guildId: interaction.guildId!,
        channelId: canal.id,
        authorId: interaction.user.id,
        title: titulo,
        content: mensagem,
        mention: mencao,
        sent: true,
        sentAt: new Date(),
      });
      await interaction.reply({ content: "✅ Anúncio enviado.", flags: MessageFlags.Ephemeral });
      return;
    }

    const a = await Announcement.create({
      guildId: interaction.guildId!,
      channelId: canal.id,
      authorId: interaction.user.id,
      title: titulo,
      content: mensagem,
      mention: mencao,
      scheduledFor,
    });
    await interaction.reply({
      content: `⏰ Anúncio agendado para <t:${Math.floor(scheduledFor.getTime() / 1000)}:F> (\`${String(a._id)}\`).`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
