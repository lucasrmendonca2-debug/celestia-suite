import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins, fmtDuration } from "../../utils/format.js";
import { getAccount, getCurrency } from "../../systems/economy/economy.js";
import { classifyTarget, economyResponses, pick } from "../../systems/personality/index.js";

const COOLDOWN = 30 * 60 * 1000;

const command: SlashCommand = {
  category: "economy",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Tenta roubar outro membro.")
    .addUserOption((o) => o.setName("usuario").setDescription("Alvo").setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser("usuario", true);
    const kind = classifyTarget(interaction, target);
    if (kind === "self") {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", description: pick(economyResponses.robSelf) })], ephemeral: true });
      return;
    }
    if (kind === "bot_self") {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", description: pick(economyResponses.robBot) })], ephemeral: true });
      return;
    }
    if (kind === "bot_other") {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", description: pick(economyResponses.robOtherBot) })], ephemeral: true });
      return;
    }
    const me = await getAccount(interaction.guildId!, interaction.user.id);
    const them = await getAccount(interaction.guildId!, target.id);
    const now = new Date();
    if (me.lastRob && now.getTime() - me.lastRob.getTime() < COOLDOWN) {
      const remaining = COOLDOWN - (now.getTime() - me.lastRob.getTime());
      await interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "Calma, ladrão", description: `Volte em **${fmtDuration(remaining)}**.` })],
        ephemeral: true,
      });
      return;
    }
    if (them.wallet < 200) {
      await interaction.reply({ embeds: [brandEmbed({ kind: "warn", title: "Pobre demais", description: `${target} não tem nada de valor.` })], ephemeral: true });
      return;
    }
    me.lastRob = now;
    const c = await getCurrency(interaction.guildId!);
    if (Math.random() < 0.45) {
      const taken = Math.floor(them.wallet * (0.1 + Math.random() * 0.3));
      them.wallet -= taken;
      me.wallet += taken;
      await Promise.all([me.save(), them.save()]);
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "🦹 Roubo bem-sucedido", description: `Você roubou ${fmtCoins(taken, c.emoji, c.name)} de ${target}` })] });
    } else {
      const fine = Math.min(me.wallet, Math.floor(150 + Math.random() * 400));
      me.wallet -= fine;
      await me.save();
      await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "🚓 Falhou!", description: `Você foi pego e pagou ${fmtCoins(fine, c.emoji, c.name)}` })] });
    }
  },
};
export default command;
