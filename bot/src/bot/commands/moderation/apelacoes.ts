import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase } from "../../../database/supabase.js";
import { hasModCapability } from "../../systems/moderation/moderation.permissions.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 5,
  guildOnly: true,
  staffOnly: true,
  longDescription:
    "Gerencia apelações: lista pendentes, aprova ou rejeita uma apelação por número de caso.",
  data: new SlashCommandBuilder()
    .setName("apelacoes")
    .setDescription("Gerencia apelações de punições.")
    .setNameLocalizations({ "en-US": "appeals" })
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((s) => s.setName("listar").setDescription("Lista apelações pendentes."))
    .addSubcommand((s) =>
      s
        .setName("aprovar")
        .setDescription("Aprova uma apelação.")
        .addIntegerOption((o) =>
          o.setName("caso").setDescription("Número do caso").setRequired(true).setMinValue(1),
        )
        .addStringOption((o) =>
          o.setName("nota").setDescription("Justificativa").setMaxLength(500),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("rejeitar")
        .setDescription("Rejeita uma apelação.")
        .addIntegerOption((o) =>
          o.setName("caso").setDescription("Número do caso").setRequired(true).setMinValue(1),
        )
        .addStringOption((o) =>
          o.setName("nota").setDescription("Justificativa").setMaxLength(500),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const member = await guild.members.fetch(interaction.user.id);
    if (!(await hasModCapability(member, "can_warn"))) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Sem permissão de moderação." })],
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand(true);

    if (sub === "listar") {
      const { data } = await supabase
        .from("mod_appeals")
        .select("case_number,user_id,reason,created_at")
        .eq("guild_id", guild.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(15);
      const lines =
        (data ?? [])
          .map(
            (a) =>
              `**#${a.case_number}** · <@${a.user_id}> · <t:${Math.floor(new Date(a.created_at).getTime() / 1000)}:R>\n> ${a.reason.slice(0, 180)}`,
          )
          .join("\n\n") || "_Nenhuma apelação pendente._";
      return interaction.reply({
        embeds: [brandEmbed({ title: "📨 Apelações pendentes", description: lines })],
        flags: MessageFlags.Ephemeral,
      });
    }

    const caseNumber = interaction.options.getInteger("caso", true);
    const nota = interaction.options.getString("nota") ?? null;
    const status = sub === "aprovar" ? "approved" : "rejected";

    const { data: appeal } = await supabase
      .from("mod_appeals")
      .select("id,user_id,status")
      .eq("guild_id", guild.id)
      .eq("case_number", caseNumber)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!appeal) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: `Nenhuma apelação pendente para o caso #${caseNumber}.` })],
        flags: MessageFlags.Ephemeral,
      });
    }

    await supabase
      .from("mod_appeals")
      .update({
        status,
        resolved_by: interaction.user.id,
        resolution_note: nota,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", appeal.id);

    // DM ao usuário
    const user = await guild.client.users.fetch(appeal.user_id).catch(() => null);
    if (user) {
      await user
        .send({
          embeds: [
            brandEmbed({
              kind: status === "approved" ? "success" : "warn",
              title: `Apelação ${status === "approved" ? "aprovada" : "rejeitada"} · Caso #${caseNumber}`,
              description: nota ?? "_Sem comentário do moderador._",
              footer: guild.name,
            }),
          ],
        })
        .catch(() => null);
    }

    return interaction.reply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: `Apelação #${caseNumber} ${status === "approved" ? "aprovada" : "rejeitada"}.`,
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
