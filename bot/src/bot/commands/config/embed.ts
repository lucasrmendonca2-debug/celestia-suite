import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, type TextChannel, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { applyVars } from "../../utils/format.js";
import { upsertEmbedTemplate, getEmbedTemplate, listEmbedTemplates } from "../../repositories/content.repo.js";

const command: SlashCommand = {
  category: "config",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Editor de embeds avançado.")
    .addSubcommand((s) =>
      s
        .setName("enviar")
        .setNameLocalizations({ "en-US": "send" })
        .setDescription("Envia um embed em um canal")
        .addChannelOption((o) => o.setName("canal").setDescription("Canal").addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption((o) => o.setName("descricao").setDescription("Descrição (use {server}, {user})").setRequired(true))
        .addStringOption((o) => o.setName("titulo").setDescription("Título"))
        .addStringOption((o) => o.setName("cor").setDescription("Hex ex: #7C3AED"))
        .addStringOption((o) => o.setName("imagem").setDescription("URL imagem"))
        .addStringOption((o) => o.setName("thumbnail").setDescription("URL thumbnail"))
        .addStringOption((o) => o.setName("footer").setDescription("Rodapé"))
        .addStringOption((o) => o.setName("salvar_como").setDescription("Salva como template")),
    )
    .addSubcommand((s) =>
      s
        .setName("enviar-modelo")
        .setNameLocalizations({ "en-US": "send-template" })
        .setDescription("Envia um template salvo")
        .addStringOption((o) => o.setName("nome").setDescription("Nome").setRequired(true))
        .addChannelOption((o) => o.setName("canal").setDescription("Canal").addChannelTypes(ChannelType.GuildText).setRequired(true)),
    )
    .addSubcommand((s) => s.setName("modelos").setNameLocalizations({ "en-US": "templates" }).setDescription("Lista templates salvos")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    const isHttpUrl = (u: string | null | undefined): boolean =>
      !!u && /^https?:\/\/[^\s]+$/i.test(u);

    if (sub === "enviar") {
      const channel = interaction.options.getChannel("canal", true) as TextChannel;
      const vars = { user: `<@${interaction.user.id}>`, server: interaction.guild!.name };
      const title = interaction.options.getString("titulo") ?? undefined;
      const description = applyVars(interaction.options.getString("descricao", true), vars);
      const colorStr = interaction.options.getString("cor");
      const color = colorStr ? Number(`0x${colorStr.replace("#", "")}`) || 0x7c3aed : 0x7c3aed;
      const image = interaction.options.getString("imagem") ?? undefined;
      const thumbnail = interaction.options.getString("thumbnail") ?? undefined;
      const footer = interaction.options.getString("footer") ?? undefined;

      if ((image && !isHttpUrl(image)) || (thumbnail && !isHttpUrl(thumbnail))) {
        await interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "URL inválida", description: "Imagem/thumbnail devem ser URLs http(s)." })],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const eb = new EmbedBuilder().setColor(color).setDescription(description);
      if (title) eb.setTitle(title);
      if (image) eb.setImage(image);
      if (thumbnail) eb.setThumbnail(thumbnail);
      if (footer) eb.setFooter({ text: footer });
      await channel.send({ embeds: [eb] });

      const saveAs = interaction.options.getString("salvar_como");
      if (saveAs) {
        await EmbedTemplate.findOneAndUpdate(
          { guildId, name: saveAs },
          { payload: { title, description: interaction.options.getString("descricao", true), color, image, thumbnail, footer }, createdBy: interaction.user.id },
          { upsert: true, setDefaultsOnInsert: true },
        );
      }
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Embed enviado", description: saveAs ? `Salvo como **${saveAs}**` : undefined })], flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "enviar-modelo") {
      const name = interaction.options.getString("nome", true);
      const channel = interaction.options.getChannel("canal", true) as TextChannel;
      const t = await EmbedTemplate.findOne({ guildId, name });
      if (!t) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Template não encontrado" })], flags: MessageFlags.Ephemeral });
        return;
      }
      const p = t.payload as Record<string, string | number | undefined>;
      const vars = { user: `<@${interaction.user.id}>`, server: interaction.guild!.name };
      const eb = new EmbedBuilder().setColor((p.color as number) ?? 0x7c3aed).setDescription(applyVars(String(p.description ?? ""), vars));
      if (p.title) eb.setTitle(String(p.title));
      if (p.image) eb.setImage(String(p.image));
      if (p.thumbnail) eb.setThumbnail(String(p.thumbnail));
      if (p.footer) eb.setFooter({ text: String(p.footer) });
      await channel.send({ embeds: [eb] });
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Enviado" })], flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "modelos") {
      const list = await EmbedTemplate.find({ guildId }).limit(25);
      await interaction.reply({
        embeds: [brandEmbed({ title: "🎨 Templates de Embed", description: list.length ? list.map((t) => `• **${t.name}**`).join("\n") : "Nenhum." })],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
export default command;
