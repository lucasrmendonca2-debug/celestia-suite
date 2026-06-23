import { ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { supabase } from "../../../database/supabase.js";
import { parseDuration } from "../../utils/format.js";
import { endPoll, getPoll, pollEmbed, pollRows, type PollRow } from "../../systems/polls/poll.service.js";

const MAX_OPTIONS = 10;

const command: SlashCommand = {
  category: "events",
  cooldown: 3,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageMessages],
  longDescription: "Crie, encerre, cancele ou consulte enquetes do servidor.",
  data: new SlashCommandBuilder()
    .setName("enquete")
    .setDescription("Sistema de enquetes do servidor.")
    .addSubcommand((s) =>
      s
        .setName("criar")
        .setDescription("Cria uma enquete com até 10 opções (separadas por ;).")
        .addStringOption((o) => o.setName("pergunta").setDescription("Pergunta da enquete").setRequired(true))
        .addStringOption((o) => o.setName("opcoes").setDescription("Opções separadas por ; (ex: Sim;Não;Talvez)").setRequired(true))
        .addStringOption((o) => o.setName("duracao").setDescription("Ex: 10m, 1h, 2d (opcional)"))
        .addChannelOption((o) => o.setName("canal").setDescription("Canal de envio").addChannelTypes(ChannelType.GuildText))
        .addBooleanOption((o) => o.setName("multipla").setDescription("Permitir múltipla escolha"))
        .addBooleanOption((o) => o.setName("anonima").setDescription("Esconder nomes dos votantes")),
    )
    .addSubcommand((s) =>
      s
        .setName("finalizar")
        .setDescription("Encerra uma enquete em andamento.")
        .addStringOption((o) => o.setName("id").setDescription("ID da enquete").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("cancelar")
        .setDescription("Cancela uma enquete sem revelar resultado.")
        .addStringOption((o) => o.setName("id").setDescription("ID da enquete").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("resultado")
        .setDescription("Mostra o resultado de uma enquete.")
        .addStringOption((o) => o.setName("id").setDescription("ID da enquete").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("listar").setDescription("Lista enquetes ativas")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "criar") {
      const question = interaction.options.getString("pergunta", true).slice(0, 256);
      const optionsRaw = interaction.options.getString("opcoes", true);
      const options = optionsRaw
        .split(";")
        .map((o) => o.trim())
        .filter(Boolean)
        .slice(0, MAX_OPTIONS);
      if (options.length < 2) {
        await interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Opções insuficientes", description: "Você precisa de pelo menos 2 opções separadas por `;`." })],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const durationStr = interaction.options.getString("duracao");
      const endsAtIso = durationStr
        ? (() => {
            const ms = parseDuration(durationStr);
            return ms && ms > 0 ? new Date(Date.now() + ms).toISOString() : null;
          })()
        : null;

      const channel = (interaction.options.getChannel("canal") ?? interaction.channel) as TextChannel;
      const multiple = interaction.options.getBoolean("multipla") ?? false;
      const anonymous = interaction.options.getBoolean("anonima") ?? false;

      const { data: row, error } = await supabase
        .from("polls")
        .insert({
          guild_id: guildId,
          channel_id: channel.id,
          question,
          options,
          anonymous,
          multiple_choice: multiple,
          ends_at: endsAtIso,
          status: "ACTIVE",
          created_by: interaction.user.id,
        })
        .select("*")
        .single();
      if (error || !row) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Erro", description: error?.message ?? "Falha ao criar enquete." })], flags: MessageFlags.Ephemeral });
        return;
      }

      const poll = row as PollRow;
      const embed = await pollEmbed(poll);
      const sent = await channel.send({ embeds: [embed], components: pollRows(poll) });
      await supabase.from("polls").update({ message_id: sent.id }).eq("id", poll.id);

      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "Enquete criada",
            description: `Enquete publicada em ${channel.toString()}.`,
            fields: [{ name: "ID", value: `\`${poll.id}\`` }],
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === "finalizar" || sub === "cancelar") {
      const id = interaction.options.getString("id", true);
      const poll = await getPoll(id);
      if (!poll || poll.guild_id !== guildId) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Não encontrada", description: "Enquete inválida." })], flags: MessageFlags.Ephemeral });
        return;
      }
      if (sub === "finalizar") {
        await endPoll(interaction.client, id);
        await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Encerrada", description: "Enquete encerrada e resultado atualizado." })], flags: MessageFlags.Ephemeral });
      } else {
        await supabase.from("polls").update({ status: "CANCELED" }).eq("id", id);
        await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "Cancelada", description: "Enquete cancelada." })], flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (sub === "resultado") {
      const id = interaction.options.getString("id", true);
      const poll = await getPoll(id);
      if (!poll || poll.guild_id !== guildId) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Não encontrada" })], flags: MessageFlags.Ephemeral });
        return;
      }
      const embed = await pollEmbed(poll);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "listar") {
      const { data } = await supabase
        .from("polls")
        .select("id, question, ends_at")
        .eq("guild_id", guildId)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(10);
      const list = (data ?? []) as { id: string; question: string; ends_at: string | null }[];
      const lines = list.length
        ? list.map((p) => `• \`${p.id}\` — ${p.question}${p.ends_at ? ` (termina <t:${Math.floor(new Date(p.ends_at).getTime() / 1000)}:R>)` : ""}`).join("\n")
        : "Nenhuma enquete ativa.";
      await interaction.reply({ embeds: [brandEmbed({ title: "Enquetes ativas", description: lines })], flags: MessageFlags.Ephemeral });
    }
  },
};

export default command;
