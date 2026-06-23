import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase } from "../../../database/supabase.js";

const command: SlashCommand = {
  category: "moderation",
  cooldown: 60,
  guildOnly: true,
  longDescription:
    "Abra um pedido de revisão (apelação) para uma punição aplicada a você. Informe o número do caso e o motivo.",
  data: new SlashCommandBuilder()
    .setName("apelar")
    .setDescription("Abre um pedido de revisão para uma punição sua.")
    .setNameLocalizations({ "en-US": "appeal" })
    .setDMPermission(false)
    .addIntegerOption((o) =>
      o.setName("caso").setDescription("Número do caso (#)").setRequired(true).setMinValue(1),
    )
    .addStringOption((o) =>
      o
        .setName("motivo")
        .setDescription("Por que sua punição deve ser revista?")
        .setRequired(true)
        .setMaxLength(800),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const caseNumber = interaction.options.getInteger("caso", true);
    const reason = interaction.options.getString("motivo", true);

    const { data: modCase } = await supabase
      .from("mod_cases")
      .select("id,user_id,action,reason")
      .eq("guild_id", guildId)
      .eq("case_number", caseNumber)
      .maybeSingle();

    if (!modCase) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: `Caso #${caseNumber} não existe.` })],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (modCase.user_id !== interaction.user.id) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Você só pode apelar dos seus próprios casos." })],
        flags: MessageFlags.Ephemeral,
      });
    }

    const { data: existing } = await supabase
      .from("mod_appeals")
      .select("id,status")
      .eq("guild_id", guildId)
      .eq("case_number", caseNumber)
      .eq("user_id", interaction.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.status === "pending") {
      return interaction.reply({
        embeds: [
          brandEmbed({
            kind: "warn",
            title: "Já existe uma apelação pendente",
            description: "Aguarde a equipe revisar.",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const { error } = await supabase.from("mod_appeals").insert({
      guild_id: guildId,
      case_number: caseNumber,
      user_id: interaction.user.id,
      reason,
      status: "pending",
    });
    if (error) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Falha ao registrar apelação", description: error.message })],
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.reply({
      embeds: [
        brandEmbed({
          kind: "success",
          title: `Apelação enviada · Caso #${caseNumber}`,
          description:
            "Sua apelação foi registrada e será analisada pela equipe. Você receberá uma resposta em breve.",
          fields: [{ name: "Seu motivo", value: reason }],
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
