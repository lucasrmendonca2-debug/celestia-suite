import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import {
  getProfile,
  incrementProfileViews,
  updateProfile,
  isValidColor,
  isValidImageUrl,
  isValidCardStyle,
} from "../../systems/social/profile.service.js";
import { listUserBadges, countUserBadges } from "../../systems/social/badge.service.js";
import { pick, socialResponses } from "../../systems/personality/index.js";

const command: SlashCommand = {
  category: "utility",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("perfil-social")
    .setNameLocalizations({ "en-US": "social-profile" })
    .setDescription("Perfil social do servidor (bio, badges, reputação).")
    .addSubcommand((s) =>
      s
        .setName("ver")
        .setDescription("Ver um perfil.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário")),
    )
    .addSubcommand((s) =>
      s
        .setName("editar")
        .setDescription("Edita seu perfil.")
        .addStringOption((o) => o.setName("bio").setDescription("Bio (máx 200)").setMaxLength(200))
        .addStringOption((o) => o.setName("titulo").setDescription("Título (máx 50)").setMaxLength(50))
        .addStringOption((o) => o.setName("cor").setDescription("Cor accent #RRGGBB"))
        .addStringOption((o) => o.setName("fundo").setDescription("Cor de fundo #RRGGBB"))
        .addStringOption((o) => o.setName("texto").setDescription("Cor do texto #RRGGBB"))
        .addStringOption((o) => o.setName("banner").setDescription("URL de imagem (png/jpg/gif/webp)"))
        .addStringOption((o) =>
          o
            .setName("estilo")
            .setDescription("Estilo do card")
            .addChoices(
              { name: "Padrão", value: "default" },
              { name: "Minimal", value: "minimal" },
              { name: "Gradiente", value: "gradient" },
            ),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("badges")
        .setDescription("Define até 3 badges em destaque (códigos separados por vírgula, vazio limpa).")
        .addStringOption((o) => o.setName("codigos").setDescription("ex: vip,top1,beta")),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "ver") {
      await interaction.deferReply();
      const target = interaction.options.getUser("usuario") ?? interaction.user;
      if (target.id === interaction.client.user.id) {
        const client = interaction.client;
        await interaction.editReply({
          embeds: [
            brandEmbed({
              title: `🤖 ${client.user?.username ?? "Bot"}`,
              description: "Sou o assistente do servidor — moderação, economia, level, tickets e mais. Use `/help` pra explorar meus comandos.",
              thumbnail: client.user?.displayAvatarURL(),
              fields: [
                { name: "Servidores", value: String(client.guilds.cache.size), inline: true },
                { name: "Ping", value: `${Math.round(client.ws.ping)} ms`, inline: true },
              ],
            }),
          ],
        });
        return;
      }
      if (target.bot) {
        await interaction.editReply({ embeds: [brandEmbed({ kind: "info", description: "Esse é outro bot. Ele não tem perfil social por aqui. 🤖" })] });
        return;
      }
      const [profile, badges, total] = await Promise.all([
        getProfile(guildId, target.id),
        listUserBadges(guildId, target.id),
        countUserBadges(guildId, target.id),
      ]);
      if (target.id !== interaction.user.id) void incrementProfileViews(guildId, target.id);
      const featured = badges
        .filter((b) => profile.selected_badges.includes(b.code))
        .slice(0, 3)
        .map((b) => `${b.emoji} **${b.name}**`)
        .join(" • ") || `_${pick(socialResponses.noBadges)}_`;

      await interaction.editReply({
        embeds: [
          brandEmbed({
            title: `👤 ${profile.title || target.username}`,
            description: profile.bio || `_${pick(socialResponses.noBio)}_`,
            thumbnail: target.displayAvatarURL(),
            image: profile.banner_url ?? undefined,
            fields: [
              { name: "⭐ Reputação", value: String(profile.reputation), inline: true },
              { name: "👁️ Visualizações", value: String(profile.profile_views), inline: true },
              { name: "🏅 Badges", value: String(total), inline: true },
              { name: "Em destaque", value: featured },
            ],
          }),
        ],
      });
      return;
    }

    if (sub === "editar") {
      const patch: Record<string, unknown> = {};
      const bio = interaction.options.getString("bio");
      const titulo = interaction.options.getString("titulo");
      const cor = interaction.options.getString("cor");
      const fundo = interaction.options.getString("fundo");
      const texto = interaction.options.getString("texto");
      const banner = interaction.options.getString("banner");
      const estilo = interaction.options.getString("estilo");

      if (bio !== null) patch.bio = bio;
      if (titulo !== null) patch.title = titulo;
      if (cor !== null) {
        if (!isValidColor(cor))
          return void interaction.reply({ content: "Cor inválida. Use #RRGGBB.", ephemeral: true });
        patch.accent_color = cor;
        patch.color = cor;
      }
      if (fundo !== null) {
        if (!isValidColor(fundo))
          return void interaction.reply({ content: "Cor de fundo inválida.", ephemeral: true });
        patch.background_color = fundo;
      }
      if (texto !== null) {
        if (!isValidColor(texto))
          return void interaction.reply({ content: "Cor do texto inválida.", ephemeral: true });
        patch.text_color = texto;
      }
      if (banner !== null) {
        if (banner.length && !isValidImageUrl(banner))
          return void interaction.reply({ content: "URL de banner inválida.", ephemeral: true });
        patch.banner_url = banner.length ? banner : null;
      }
      if (estilo !== null) {
        if (!isValidCardStyle(estilo))
          return void interaction.reply({ content: "Estilo inválido.", ephemeral: true });
        patch.card_style = estilo;
      }

      if (!Object.keys(patch).length) {
        return void interaction.reply({ content: "Nada para atualizar.", ephemeral: true });
      }
      await updateProfile(guildId, interaction.user.id, patch);
      await interaction.reply({ content: "✅ Perfil atualizado.", ephemeral: true });
      return;
    }

    if (sub === "badges") {
      const raw = (interaction.options.getString("codigos") ?? "").trim();
      const codes = raw
        ? raw.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 3)
        : [];
      const owned = await listUserBadges(guildId, interaction.user.id);
      const ownedCodes = new Set(owned.map((b) => b.code));
      const invalid = codes.filter((c) => !ownedCodes.has(c));
      if (invalid.length) {
        return void interaction.reply({
          content: `Você não possui: \`${invalid.join(", ")}\``,
          ephemeral: true,
        });
      }
      await updateProfile(guildId, interaction.user.id, { selected_badges: codes });
      await interaction.reply({
        content: codes.length ? `✅ Em destaque: ${codes.join(", ")}` : "✅ Destaques limpos.",
        ephemeral: true,
      });
      return;
    }
  },
};

export default command;
