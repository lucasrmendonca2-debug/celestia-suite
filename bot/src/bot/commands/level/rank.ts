import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase } from "../../../database/supabase.js";
import { deriveLevel } from "../../systems/social/formulas.js";
import { renderRankCard } from "../../systems/social/rank-card.service.js";
import { getProfile, getResolvedCardLook } from "../../systems/social/profile.service.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Mostra seu rank card visual.")
    .addUserOption((o) => o.setName("usuario").setDescription("Outro usuário")) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const target = interaction.options.getUser("usuario") ?? interaction.user;
    await interaction.deferReply();

    const { data: row } = await supabase
      .from("level_users")
      .select("total_xp")
      .eq("guild_id", interaction.guildId!)
      .eq("user_id", target.id)
      .maybeSingle();

    const totalXp = row?.total_xp ?? 0;
    const derived = deriveLevel(totalXp);

    // Rank no servidor
    const { count } = await supabase
      .from("level_users")
      .select("user_id", { count: "exact", head: true })
      .eq("guild_id", interaction.guildId!)
      .gt("total_xp", totalXp);
    const rank = (count ?? 0) + 1;

    const profile = await getProfile(interaction.guildId!, target.id);
    const look = await getResolvedCardLook(interaction.guildId!, profile);

    try {
      const buffer = await renderRankCard({
        username: target.username,
        displayName: target.displayName ?? target.username,
        avatarUrl: target.displayAvatarURL({ extension: "png", size: 256 }),
        level: derived.level,
        xpInLevel: derived.xpInLevel,
        xpForNext: derived.xpForNext,
        totalXp,
        rank,
        accentColor: look.accent,
        backgroundColor: look.background,
        textColor: look.text,
        cardStyle: look.style,
        title: profile.title,
        bannerUrl: profile.banner_url,
      });
      const attachment = new AttachmentBuilder(buffer, { name: "rank.png" });
      await interaction.editReply({ files: [attachment] });
    } catch (err) {
      // fallback embed se canvas falhar
      await interaction.editReply({
        embeds: [
          brandEmbed({
            title: `📈 ${target.username}`,
            thumbnail: target.displayAvatarURL(),
            fields: [
              { name: "Nível", value: String(derived.level), inline: true },
              { name: "XP", value: `${derived.xpInLevel.toLocaleString("pt-BR")} / ${derived.xpForNext.toLocaleString("pt-BR")}`, inline: true },
              { name: "Rank", value: `#${rank}`, inline: true },
              { name: "Total", value: `${totalXp.toLocaleString("pt-BR")} XP` },
            ],
            footer: `Card visual indisponível: ${(err as Error).message.slice(0, 80)}`,
          }),
        ],
      });
    }
  },
};
export default command;
