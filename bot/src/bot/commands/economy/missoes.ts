import { SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins } from "../../utils/format.js";
import { getCurrency } from "../../systems/economy/economy.js";
import {
  claimMission,
  listUserMissions,
} from "../../systems/economy/missions.js";

const command: SlashCommand = {
  category: "economy",
  module: "economia",
  cooldown: 3,
  guildOnly: true,
  enabledByDefault: true,
  longDescription:
    "Veja suas missões diárias, progresso e recompensas. Conclua e resgate para ganhar moedas.",
  data: new SlashCommandBuilder()
    .setName("missoes")
    .setNameLocalizations({ "en-US": "missions" })
    .setDescription("Missões diárias do servidor.")
    .setDMPermission(false)
    .addSubcommand((s) => s.setName("listar").setDescription("Mostra suas missões de hoje."))
    .addSubcommand((s) =>
      s
        .setName("resgatar")
        .setDescription("Resgata a recompensa de uma missão concluída.")
        .addStringOption((o) =>
          o.setName("slug").setDescription("Slug da missão (veja em listar)").setRequired(true),
        ),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const c = await getCurrency(guildId);
    const sub = interaction.options.getSubcommand(true);

    if (sub === "listar") {
      const rows = await listUserMissions(guildId, interaction.user.id);
      if (!rows.length) {
        return interaction.reply({
          embeds: [
            brandEmbed({
              kind: "info",
              title: "Nenhuma missão ativa",
              description: "O servidor ainda não tem missões configuradas.",
            }),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
      const lines = rows.map(({ mission, state }) => {
        const prog = Math.min(state?.progress ?? 0, mission.goal);
        const bar = renderBar(prog, mission.goal);
        const status = state?.claimed_at
          ? "✅ Resgatada"
          : state?.completed_at
            ? "🎁 Pronta — `/missoes resgatar slug:" + mission.slug + "`"
            : `${bar} ${prog}/${mission.goal}`;
        return `**${mission.title}** · \`${mission.slug}\`\n${mission.description ?? "—"}\nRecompensa: ${fmtCoins(mission.reward, c.emoji, c.name)}\n${status}`;
      });
      const claimable = rows.filter((r) => r.state?.completed_at && !r.state.claimed_at);
      const components: ActionRowBuilder<ButtonBuilder>[] = [];
      if (claimable.length) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...claimable.slice(0, 5).map((r) =>
            new ButtonBuilder()
              .setCustomId(`mission_claim:${r.mission.id}`)
              .setLabel(`Resgatar: ${r.mission.title}`.slice(0, 80))
              .setStyle(ButtonStyle.Success),
          ),
        );
        components.push(row);
      }
      return interaction.reply({
        embeds: [
          brandEmbed({
            title: "🎯 Missões diárias",
            description: lines.join("\n\n"),
            footer: "Resetam à meia-noite (UTC)",
          }),
        ],
        components,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "resgatar") {
      const slug = interaction.options.getString("slug", true);
      const rows = await listUserMissions(guildId, interaction.user.id);
      const target = rows.find((r) => r.mission.slug === slug);
      if (!target) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: `Missão \`${slug}\` não existe.` })],
          flags: MessageFlags.Ephemeral,
        });
      }
      const res = await claimMission(guildId, interaction.user.id, target.mission.id);
      if (!res.ok) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Não foi possível resgatar", description: res.reason })],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "Recompensa resgatada!",
            description: `+${fmtCoins(res.reward ?? 0, c.emoji, c.name)} adicionado à sua carteira.`,
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

function renderBar(value: number, max: number, width = 10): string {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const filled = Math.round(ratio * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export default command;
