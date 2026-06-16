import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase } from "../../../database/supabase.js";
import { deriveLevel } from "../../systems/social/formulas.js";
import {
  getProfile,
  updateProfile,
  isValidColor,
  isValidImageUrl,
  incrementProfileViews,
} from "../../systems/social/profile.service.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Veja ou edite seu perfil social.")
    .addSubcommand((s) =>
      s.setName("ver")
        .setDescription("Mostra o perfil social.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário")),
    )
    .addSubcommandGroup((g) =>
      g
        .setName("editar")
        .setDescription("Edita seu perfil.")
        .addSubcommand((s) =>
          s.setName("bio")
            .setDescription("Define sua bio.")
            .addStringOption((o) => o.setName("texto").setDescription("Bio").setRequired(true).setMaxLength(200)),
        )
        .addSubcommand((s) =>
          s.setName("titulo")
            .setDescription("Define seu título.")
            .addStringOption((o) => o.setName("texto").setDescription("Título").setRequired(true).setMaxLength(50)),
        )
        .addSubcommand((s) =>
          s.setName("cor")
            .setDescription("Define a cor do perfil (#RRGGBB).")
            .addStringOption((o) => o.setName("cor").setDescription("#RRGGBB").setRequired(true)),
        )
        .addSubcommand((s) =>
          s.setName("banner")
            .setDescription("Define a URL do banner (png/jpg/webp).")
            .addStringOption((o) => o.setName("url").setDescription("URL").setRequired(true)),
        ),
    )
    .addSubcommand((s) => s.setName("resetar").setDescription("Reseta personalização do perfil.")),

  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (group === "editar") {
      if (sub === "bio") {
        const texto = interaction.options.getString("texto", true);
        await updateProfile(guildId, interaction.user.id, { bio: texto });
        await interaction.reply({ ephemeral: true, content: "✅ Bio atualizada." });
        return;
      }
      if (sub === "titulo") {
        const texto = interaction.options.getString("texto", true);
        await updateProfile(guildId, interaction.user.id, { title: texto });
        await interaction.reply({ ephemeral: true, content: "✅ Título atualizado." });
        return;
      }
      if (sub === "cor") {
        const cor = interaction.options.getString("cor", true);
        if (!isValidColor(cor)) {
          await interaction.reply({ ephemeral: true, content: "❌ Cor inválida. Use formato `#RRGGBB`." });
          return;
        }
        await updateProfile(guildId, interaction.user.id, { color: cor });
        await interaction.reply({ ephemeral: true, content: `✅ Cor atualizada para \`${cor}\`.` });
        return;
      }
      if (sub === "banner") {
        const url = interaction.options.getString("url", true);
        if (!isValidImageUrl(url)) {
          await interaction.reply({ ephemeral: true, content: "❌ URL inválida. Use http(s) terminando em png/jpg/gif/webp." });
          return;
        }
        await updateProfile(guildId, interaction.user.id, { banner_url: url });
        await interaction.reply({ ephemeral: true, content: "✅ Banner atualizado." });
        return;
      }
    }

    if (sub === "resetar") {
      const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
      // usuário pode resetar o próprio perfil sempre
      await updateProfile(guildId, interaction.user.id, {
        bio: "",
        title: "",
        color: "#5865F2",
        banner_url: null,
        selected_badges: [],
      });
      void isAdmin;
      await interaction.reply({ ephemeral: true, content: "✅ Perfil resetado." });
      return;
    }

    // ver (default)
    const target = interaction.options.getUser("usuario") ?? interaction.user;
    const profile = await getProfile(guildId, target.id);
    if (target.id !== interaction.user.id) {
      void incrementProfileViews(guildId, target.id);
    }
    const { data: lvl } = await supabase
      .from("level_users")
      .select("total_xp")
      .eq("guild_id", guildId)
      .eq("user_id", target.id)
      .maybeSingle();
    const derived = deriveLevel(lvl?.total_xp ?? 0);

    await interaction.reply({
      embeds: [
        brandEmbed({
          title: profile.title ? `${profile.title} · ${target.displayName ?? target.username}` : (target.displayName ?? target.username),
          thumbnail: target.displayAvatarURL({ size: 256 }),
          image: profile.banner_url ?? undefined,
          description: profile.bio || "_Sem bio. Use `/perfil editar bio` pra escrever uma._",
          fields: [
            { name: "Nível", value: `**${derived.level}**`, inline: true },
            { name: "XP", value: `${derived.xpInLevel.toLocaleString("pt-BR")} / ${derived.xpForNext.toLocaleString("pt-BR")}`, inline: true },
            { name: "Total XP", value: (lvl?.total_xp ?? 0).toLocaleString("pt-BR"), inline: true },
            { name: "Reputação", value: `❤️ ${profile.reputation}`, inline: true },
            { name: "Views", value: `👁 ${profile.profile_views}`, inline: true },
            { name: "Cor", value: `\`${profile.color}\``, inline: true },
          ],
        }),
      ],
    });
  },
};

export default command;
