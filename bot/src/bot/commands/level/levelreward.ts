import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
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
      // Upsert atômico — depende de unique (guild_id, level, reward_type)
      const { error } = await supabase
        .from("level_rewards")
        .upsert(
          {
            guild_id: guildId,
            level,
            reward_type: "role",
            reward_value: role.id,
            remove_previous_roles: removePrevious,
          },
          { onConflict: "guild_id,level,reward_type" },
        );
      if (error) {
        await interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Falha ao salvar", description: error.message })],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await interaction.reply({
        embeds: [
          brandEmbed({ kind: "success", title: "Recompensa salva", description: `Nível **${level}** → <@&${role.id}>` }),
        ],
        flags: MessageFlags.Ephemeral,
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
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Removido" })], flags: MessageFlags.Ephemeral });
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
      flags: MessageFlags.Ephemeral,
    });
  },
};
export default command;
