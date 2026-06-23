import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase, canWriteSupabase } from "../../../database/supabase.js";
import { invalidateGuildConfig } from "../../utils/guildCache.js";

// Filtro do slash → coluna real em automod_config.
// `antiRaidEnabled` mapeia para anti_flood_enabled (não existe coluna anti_raid).
const FILTER_TO_COLUMN: Record<string, string> = {
  antiLinkEnabled: "anti_link_enabled",
  antiInviteEnabled: "anti_invite_enabled",
  antiSpamEnabled: "anti_spam_enabled",
  antiRaidEnabled: "anti_flood_enabled",
};

async function ensureAutomodRow(guildId: string) {
  const { error } = await supabase
    .from("automod_config")
    .upsert({ guild_id: guildId }, { onConflict: "guild_id" });
  if (error) throw error;
}

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
            { name: "Anti-raid (flood)", value: "antiRaidEnabled" },
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

    if (!canWriteSupabase) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Backend indisponível", description: "Configuração só é possível com a chave service_role configurada." })],
        flags: MessageFlags.Ephemeral,
      });
    }

    await ensureAutomodRow(guildId);

    if (sub === "toggle") {
      const key = interaction.options.getString("filtro", true);
      const column = FILTER_TO_COLUMN[key];
      if (!column) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Filtro inválido" })],
          flags: MessageFlags.Ephemeral,
        });
      }
      const state = interaction.options.getBoolean("estado", true);
      const { error } = await supabase
        .from("automod_config")
        .update({ [column]: state })
        .eq("guild_id", guildId);
      if (error) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Falha ao salvar", description: error.message })],
          flags: MessageFlags.Ephemeral,
        });
      }
      invalidateGuildConfig(guildId);
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "AutoMod atualizado", description: `**${key}** → ${state ? "ON" : "OFF"}` })],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "blacklist-add") {
      const w = interaction.options.getString("palavra", true).toLowerCase().trim();
      if (!w) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Palavra inválida" })],
          flags: MessageFlags.Ephemeral,
        });
      }
      const { error } = await supabase
        .from("blacklisted_words")
        .upsert({ guild_id: guildId, word: w, active: true }, { onConflict: "guild_id,word" });
      if (error) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Falha ao adicionar", description: error.message })],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Palavra adicionada", description: `\`${w}\`` })],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "blacklist-remove") {
      const w = interaction.options.getString("palavra", true).toLowerCase().trim();
      const { error } = await supabase
        .from("blacklisted_words")
        .delete()
        .eq("guild_id", guildId)
        .eq("word", w);
      if (error) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Falha ao remover", description: error.message })],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Palavra removida", description: `\`${w}\`` })],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "blacklist-list") {
      const { data, error } = await supabase
        .from("blacklisted_words")
        .select("word")
        .eq("guild_id", guildId)
        .eq("active", true)
        .order("word");
      if (error) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Falha ao listar", description: error.message })],
          flags: MessageFlags.Ephemeral,
        });
      }
      const words = (data ?? []).map((r: any) => r.word as string);
      return interaction.reply({
        embeds: [
          brandEmbed({
            title: "🚫 Blacklist",
            description: words.length ? words.map((w) => `\`${w}\``).join(" ") : "Vazia.",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "whitelist-role") {
      const role = interaction.options.getRole("cargo", true);
      const { data } = await supabase
        .from("automod_config")
        .select("whitelist_roles")
        .eq("guild_id", guildId)
        .maybeSingle();
      const current: string[] = Array.isArray(data?.whitelist_roles) ? (data!.whitelist_roles as string[]) : [];
      const exists = current.includes(role.id);
      const next = exists ? current.filter((r) => r !== role.id) : [...current, role.id];
      const { error } = await supabase
        .from("automod_config")
        .update({ whitelist_roles: next })
        .eq("guild_id", guildId);
      if (error) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Falha ao salvar", description: error.message })],
          flags: MessageFlags.Ephemeral,
        });
      }
      invalidateGuildConfig(guildId);
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: exists ? "Cargo removido da whitelist" : "Cargo adicionado à whitelist", description: `<@&${role.id}>` })],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
export default command;
