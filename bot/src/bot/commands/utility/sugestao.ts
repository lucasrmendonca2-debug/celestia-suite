import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase } from "../../../database/supabase.js";
import {
  getSuggestion,
  refreshSuggestionMessage,
  suggestionEmbed,
  suggestionRows,
  type SuggestionRow,
  type SuggestionStatus,
} from "../../systems/suggestions/suggestion.service.js";

async function getConfig(guildId: string) {
  const { data } = await supabase.from("community_config").select("*").eq("guild_id", guildId).maybeSingle();
  return data ?? null;
}

const command: SlashCommand = {
  category: "utility",
  cooldown: 5,
  guildOnly: true,
  longDescription: "Envie sugestões para o servidor, vote, ou (staff) aprove e reprove.",
  data: new SlashCommandBuilder()
    .setName("sugestao")
    .setDescription("Sistema de sugestões do servidor.")
    .addSubcommand((s) =>
      s
        .setName("enviar")
        .setDescription("Envia uma sugestão para o servidor.")
        .addStringOption((o) => o.setName("texto").setDescription("Sua sugestão").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("aprovar")
        .setDescription("(Staff) Aprova uma sugestão.")
        .addStringOption((o) => o.setName("id").setDescription("ID da sugestão").setRequired(true))
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo / resposta")),
    )
    .addSubcommand((s) =>
      s
        .setName("reprovar")
        .setDescription("(Staff) Reprova uma sugestão.")
        .addStringOption((o) => o.setName("id").setDescription("ID da sugestão").setRequired(true))
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo da reprovação")),
    )
    .addSubcommand((s) =>
      s
        .setName("responder")
        .setDescription("(Staff) Responde sem mudar status.")
        .addStringOption((o) => o.setName("id").setDescription("ID da sugestão").setRequired(true))
        .addStringOption((o) => o.setName("resposta").setDescription("Resposta da staff").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("listar").setDescription("Lista sugestões pendentes")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const config = await getConfig(guildId);

    const isStaff = interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) ?? false;

    if (sub === "enviar") {
      if (config?.suggestions_enabled === false) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "Desativado", description: "O sistema de sugestões está desativado neste servidor." })], ephemeral: true });
        return;
      }
      const channelId = config?.suggestions_channel_id;
      if (!channelId) {
        await interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Canal não configurado", description: "Peça à staff para configurar o canal de sugestões no dashboard." })],
          ephemeral: true,
        });
        return;
      }
      const channel = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;
      if (!channel) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Canal inválido", description: "O canal configurado não foi encontrado." })], ephemeral: true });
        return;
      }
      const text = interaction.options.getString("texto", true).slice(0, 1500);

      const { data, error } = await supabase
        .from("suggestions")
        .insert({
          guild_id: guildId,
          channel_id: channel.id,
          author_id: interaction.user.id,
          content: text,
          status: "PENDING",
        })
        .select("*")
        .single();
      if (error || !data) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Erro", description: error?.message ?? "Falha ao criar sugestão." })], ephemeral: true });
        return;
      }
      const s = data as SuggestionRow;
      const votingEnabled = config?.suggestions_allow_voting ?? true;
      const sent = await channel.send({ embeds: [suggestionEmbed(s)], components: suggestionRows(s, votingEnabled) });
      await supabase.from("suggestions").update({ message_id: sent.id }).eq("id", s.id);

      await interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Sugestão enviada", description: `Sua sugestão foi publicada em ${channel.toString()}. Obrigado por ajudar!`, fields: [{ name: "ID", value: `\`${s.id}\`` }] })],
        ephemeral: true,
      });
      return;
    }

    if (sub === "aprovar" || sub === "reprovar" || sub === "responder") {
      if (!isStaff) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Sem permissão", description: "Você precisa de **Gerenciar Mensagens** para isso." })], ephemeral: true });
        return;
      }
      const id = interaction.options.getString("id", true);
      const s = await getSuggestion(id);
      if (!s || s.guild_id !== guildId) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Não encontrada" })], ephemeral: true });
        return;
      }

      if (sub === "responder") {
        const resposta = interaction.options.getString("resposta", true).slice(0, 1000);
        await supabase.from("suggestions").update({ staff_response: resposta }).eq("id", id);
      } else {
        const motivo = interaction.options.getString("motivo");
        if (config?.suggestions_require_reason && !motivo) {
          await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Motivo obrigatório", description: "Este servidor exige motivo nas decisões." })], ephemeral: true });
          return;
        }
        const newStatus: SuggestionStatus = sub === "aprovar" ? "APPROVED" : "REJECTED";
        await supabase
          .from("suggestions")
          .update({
            status: newStatus,
            decided_by: interaction.user.id,
            decision_reason: motivo ?? null,
          })
          .eq("id", id);
      }

      const fresh = await getSuggestion(id);
      if (fresh) {
        const votingEnabled = config?.suggestions_allow_voting ?? true;
        await refreshSuggestionMessage(interaction.client, fresh, votingEnabled);
      }
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Atualizada", description: "Sugestão atualizada." })], ephemeral: true });
      return;
    }

    if (sub === "listar") {
      const { data } = await supabase
        .from("suggestions")
        .select("id, content, status, upvotes, downvotes")
        .eq("guild_id", guildId)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false })
        .limit(10);
      const list = (data ?? []) as { id: string; content: string; status: string; upvotes: number; downvotes: number }[];
      const lines = list.length
        ? list.map((s) => `• \`${s.id}\` (👍${s.upvotes}/👎${s.downvotes}) — ${s.content.slice(0, 80)}`).join("\n")
        : "Nenhuma sugestão pendente.";
      await interaction.reply({ embeds: [brandEmbed({ title: "Sugestões pendentes", description: lines })], ephemeral: true });
    }
  },
};

export default command;
