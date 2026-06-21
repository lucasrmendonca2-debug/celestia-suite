import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { embeds } from "../../lib/embeds.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { currencyFromConfig, getAccount } from "../../systems/economy/economy.js";
import { getConfig } from "../../utils/guildCache.js";
import { issueDailyToken } from "../../../http/server.js";
import { env } from "../../../config/env.js";
import { EconomyAccount } from "../../../database/models.js";

const DAY = 24 * 3600 * 1000;

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("diario")
    .setNameLocalizations({ "en-US": "daily" })
    .setDescription("Resgate sua recompensa diária no site."),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const cfg = await getConfig(guildId);
    const c = currencyFromConfig(cfg);

    if (cfg.economyEnabled === false) {
      await interaction.reply({
        embeds: [embeds.warn({ title: "Economia desativada" })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await getAccount(guildId, interaction.user.id);
    const acc = await EconomyAccount.findOne({ guildId, userId: interaction.user.id });
    const now = Date.now();
    const last = acc?.lastDaily?.getTime() ?? 0;
    const canClaim = !last || now - last >= DAY;

    if (!canClaim) {
      const remaining = DAY - (now - last);
      await interaction.reply({
        embeds: [
          embeds.warn({
            title: "⏳ Você já resgatou hoje",
            description: `Volte em **${fmtDuration(remaining)}** para a próxima recompensa.\n\nSeu streak atual: **🔥 ${acc?.streakDaily ?? 0} dia(s)**`,
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Configurado? Se não houver bridge, faz claim local de fallback.
    if (!env.BOT_API_SECRET) {
      await interaction.reply({
        embeds: [
          embeds.error({
            title: "Resgate indisponível",
            description: "O sistema de daily web ainda não foi configurado pelo dono do bot.",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const token = await issueDailyToken(guildId, interaction.user.id);
    const url = `${env.APP_URL.replace(/\/$/, "")}/daily?token=${token}`;

    const projectedStreak = (acc?.streakDaily ?? 0) + 1;
    const streakBonus = Math.min(projectedStreak, 7) * 50;
    const estimate = cfg.economyDailyAmount + streakBonus;

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("🎁 Resgatar no site")
        .setStyle(ButtonStyle.Link)
        .setURL(url),
    );

    await interaction.reply({
      embeds: [
        embeds.economy({
          title: "🎁 Sua recompensa diária está pronta!",
          description: [
            `Olá, <@${interaction.user.id}>! Clique no botão abaixo para abrir o site e resgatar sua recompensa.`,
            "",
            `💰 **Recompensa estimada:** ${fmtCoins(estimate, c.emoji, c.name)}`,
            `🔥 **Próximo streak:** ${projectedStreak} dia(s)`,
            "",
            "⏱️ O link expira em **10 minutos**.",
          ].join("\n"),
          footer: "Resgate seguro via site oficial",
        }),
      ],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
  },
};
export default command;
