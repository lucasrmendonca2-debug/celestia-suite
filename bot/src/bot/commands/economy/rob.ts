import { SlashCommandBuilder, MessageFlags } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { getAccount, getCurrency } from "../../systems/economy/economy.js";
import { classifyTarget, economyResponses, pick } from "../../systems/personality/index.js";

const COOLDOWN = 30 * 60 * 1000;

const command: SlashCommand = {
  category: "economy",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("roubar")
    .setNameLocalizations({ "en-US": "rob" })
    .setDescription("Tenta roubar outro membro.")
    .addUserOption((o) => o.setName("usuario").setDescription("Alvo").setRequired(true)),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const target = interaction.options.getUser("usuario", true);
    const kind = classifyTarget(interaction, target);
    if (kind === "self") {
      await interaction.reply({ embeds: [ui.warn({ description: pick(economyResponses.robSelf) })], flags: MessageFlags.Ephemeral });
      return;
    }
    if (kind === "bot_self") {
      await interaction.reply({ embeds: [ui.warn({ description: pick(economyResponses.robBot) })], flags: MessageFlags.Ephemeral });
      return;
    }
    if (kind === "bot_other") {
      await interaction.reply({ embeds: [ui.warn({ description: pick(economyResponses.robOtherBot) })], flags: MessageFlags.Ephemeral });
      return;
    }
    const me = await getAccount(guildId, interaction.user.id);
    const them = await getAccount(guildId, target.id);
    const now = new Date();
    if (me.lastRob && now.getTime() - me.lastRob.getTime() < COOLDOWN) {
      const remaining = COOLDOWN - (now.getTime() - me.lastRob.getTime());
      await interaction.reply({
        embeds: [ui.warn({ title: "Calma, ladrão", description: `Aguarde **${fmtDuration(remaining)}** antes do próximo golpe.` })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (them.wallet < 200) {
      await interaction.reply({
        embeds: [ui.warn({ title: "Alvo sem fundos", description: `${target} não tem nada de valor na carteira.` })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    // Atômico: trava o cooldown só se ainda não estiver dentro da janela.
    const { EconomyAccount } = await import("../../../database/models.js");
    const cooldownGuard = await EconomyAccount.updateOne(
      {
        guildId,
        userId: interaction.user.id,
        $or: [{ lastRob: null }, { lastRob: { $lte: new Date(now.getTime() - COOLDOWN) } }],
      },
      { $set: { lastRob: now } },
    );
    if (cooldownGuard.modifiedCount === 0) {
      await interaction.reply({
        embeds: [ui.warn({ title: "Calma, ladrão", description: "Outro golpe seu já está em andamento." })],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const c = await getCurrency(guildId);
    if (Math.random() < 0.45) {
      const taken = Math.floor(them.wallet * (0.1 + Math.random() * 0.3));
      // Atômico: só desconta se ainda tiver saldo.
      // (EconomyAccount já importado acima)
      const updated = await EconomyAccount.findOneAndUpdate(
        { guildId, userId: target.id, wallet: { $gte: taken } },
        { $inc: { wallet: -taken } },
        { new: true },
      );
      if (!updated) {
        await interaction.reply({
          embeds: [ui.warn({ title: "Alvo escapou", description: `${target} esvaziou a carteira antes do golpe.` })],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await EconomyAccount.updateOne({ guildId, userId: interaction.user.id }, { $inc: { wallet: taken } });
      await interaction.reply({
        embeds: [
          ui.economy({
            guildId,
            title: "Roubo bem-sucedido",
            description: `🦹 Você levou ${fmtCoins(taken, c.emoji, c.name)} de ${target}.`,
          }),
        ],
      });
    } else {
      const fine = Math.min(me.wallet, Math.floor(150 + Math.random() * 400));
      // (EconomyAccount já importado acima)
      await EconomyAccount.updateOne(
        { guildId, userId: interaction.user.id, wallet: { $gte: fine } },
        { $inc: { wallet: -fine } },
      );
      await interaction.reply({
        embeds: [
          ui.error({
            title: "Você foi pego!",
            description: `🚓 A polícia chegou e te multou em ${fmtCoins(fine, c.emoji, c.name)}.`,
          }),
        ],
      });
    }
  },
};
export default command;
