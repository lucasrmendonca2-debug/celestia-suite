import { SlashCommandBuilder } from "discord.js";
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
      await interaction.reply({ embeds: [ui.warn({ description: pick(economyResponses.robSelf) })], ephemeral: true });
      return;
    }
    if (kind === "bot_self") {
      await interaction.reply({ embeds: [ui.warn({ description: pick(economyResponses.robBot) })], ephemeral: true });
      return;
    }
    if (kind === "bot_other") {
      await interaction.reply({ embeds: [ui.warn({ description: pick(economyResponses.robOtherBot) })], ephemeral: true });
      return;
    }
    const me = await getAccount(guildId, interaction.user.id);
    const them = await getAccount(guildId, target.id);
    const now = new Date();
    if (me.lastRob && now.getTime() - me.lastRob.getTime() < COOLDOWN) {
      const remaining = COOLDOWN - (now.getTime() - me.lastRob.getTime());
      await interaction.reply({
        embeds: [ui.warn({ title: "Calma, ladrão", description: `Aguarde **${fmtDuration(remaining)}** antes do próximo golpe.` })],
        ephemeral: true,
      });
      return;
    }
    if (them.wallet < 200) {
      await interaction.reply({
        embeds: [ui.warn({ title: "Alvo sem fundos", description: `${target} não tem nada de valor na carteira.` })],
        ephemeral: true,
      });
      return;
    }
    me.lastRob = now;
    await me.save();
    const c = await getCurrency(guildId);
    if (Math.random() < 0.45) {
      const taken = Math.floor(them.wallet * (0.1 + Math.random() * 0.3));
      // Atômico: só desconta se ainda tiver saldo.
      const { EconomyAccount } = await import("../../../database/models.js");
      const updated = await EconomyAccount.findOneAndUpdate(
        { guildId, userId: target.id, wallet: { $gte: taken } },
        { $inc: { wallet: -taken } },
        { new: true },
      );
      if (!updated) {
        await interaction.reply({
          embeds: [ui.warn({ title: "Alvo escapou", description: `${target} esvaziou a carteira antes do golpe.` })],
          ephemeral: true,
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
      const { EconomyAccount } = await import("../../../database/models.js");
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
