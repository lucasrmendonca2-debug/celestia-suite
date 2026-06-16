import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase } from "../../../database/supabase.js";

const command: SlashCommand = {
  category: "level",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  data: new SlashCommandBuilder()
    .setName("levelreward")
    .setDescription("Configura cargos por nível.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Adiciona recompensa")
        .addIntegerOption((o) => o.setName("nivel").setDescription("Nível").setRequired(true).setMinValue(1))
        .addRoleOption((o) => o.setName("cargo").setDescription("Cargo").setRequired(true))
        .addBooleanOption((o) =>
          o.setName("remover_anteriores").setDescription("Remove cargos de níveis anteriores"),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("Remove recompensa")
        .addIntegerOption((o) => o.setName("nivel").setDescription("Nível").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("list").setDescription("Lista recompensas")) as SlashCommandBuilder,
  async execute(interaction) {
    if (!interaction.inGuild()) return;
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    if (sub === "add") {
      const level = interaction.options.getInteger("nivel", true);
      const role = interaction.options.getRole("cargo", true);
      const removePrevious = interaction.options.getBoolean("remover_anteriores") ?? false;
      // upsert (guild, level, type=role)
      await supabase
        .from("level_rewards")
        .delete()
        .eq("guild_id", guildId)
        .eq("level", level)
        .eq("reward_type", "role");
      await supabase.from("level_rewards").insert({
        guild_id: guildId,
        level,
        reward_type: "role",
        reward_value: role.id,
        remove_previous_roles: removePrevious,
      });
      await interaction.reply({
        embeds: [
          brandEmbed({ kind: "success", title: "Recompensa salva", description: `Nível **${level}** → <@&${role.id}>` }),
        ],
        ephemeral: true,
      });
      return;
    }
    if (sub === "remove") {
      const level = interaction.options.getInteger("nivel", true);
      await supabase
        .from("level_rewards")
        .delete()
        .eq("guild_id", guildId)
        .eq("level", level)
        .eq("reward_type", "role");
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Removido" })], ephemeral: true });
      return;
    }
    // list
    const { data } = await supabase
      .from("level_rewards")
      .select("*")
      .eq("guild_id", guildId)
      .eq("reward_type", "role")
      .order("level", { ascending: true });
    const list = data ?? [];
    await interaction.reply({
      embeds: [
        brandEmbed({
          title: "🎁 Recompensas por nível",
          description: list.length
            ? list
                .map(
                  (r) =>
                    `Nível **${r.level}** → <@&${r.reward_value}>${r.remove_previous_roles ? " *(substitui anterior)*" : ""}`,
                )
                .join("\n")
            : "Nenhuma.",
        }),
      ],
      ephemeral: true,
    });
  },
};
export default command;
