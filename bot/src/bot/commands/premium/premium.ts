import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { getAsset } from "../../systems/ui/embed.assets.js";
import { getActiveGuildSubscription, getPlan, listPlans, redeemCode } from "../../systems/premium/premium.service.js";

function fmtExpire(iso: string | null): string {
  if (!iso) return "Vitalício";
  return `<t:${Math.floor(new Date(iso).getTime() / 1000)}:R>`;
}

const REASONS: Record<string, string> = {
  not_found: "Não encontrei esse código.",
  inactive: "Esse código está inativo.",
  expired: "Esse código já expirou.",
  exhausted: "Esse código já atingiu o limite de usos.",
  plan_mismatch: "Esse código não é de SERVIDOR.",
  missing_target: "Esse código precisa de um servidor válido.",
};

const command: SlashCommand = {
  category: "vip",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("premium")
    .setDescription("Sistema Premium do servidor.")
    .addSubcommand((s) => s.setName("servidor").setDescription("Status premium deste servidor."))
    .addSubcommand((s) => s.setName("beneficios").setDescription("Lista os benefícios dos planos premium de servidor."))
    .addSubcommand((s) =>
      s
        .setName("resgatar")
        .setDescription("Resgata um código premium para este servidor (admin).")
        .addStringOption((o) => o.setName("codigo").setDescription("Código premium").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("painel").setDescription("Mostra um resumo premium do servidor.")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "servidor" || sub === "painel") {
      const active = await getActiveGuildSubscription(guildId);
      const plan = active ? await getPlan(active.plan_id) : null;
      const banner = active ? await getAsset(guildId, "premium.banner") : undefined;
      return interaction.reply({
        embeds: [
          ui.premium({
            guildId,
            title: active && plan ? "Premium ativo" : "Premium do servidor",
            description: active && plan
              ? `Plano: **${plan.name}**\nStatus: **${active.status}**\nExpira: ${fmtExpire(active.expires_at)}`
              : "Este servidor ainda **não é premium**. Use `/premium beneficios` para ver os planos disponíveis.",
            image: banner,
          }),
        ],
        ephemeral: true,
      });
    }

    if (sub === "beneficios") {
      const plans = await listPlans({ type: "GUILD_PREMIUM", activeOnly: true });
      return interaction.reply({
        embeds: [
          ui.premium({
            guildId,
            title: "Planos Premium para servidores",
            description: plans.length
              ? plans
                  .map((p) => `**${p.name}** — ${p.description}\n⏱️ Duração: ${p.duration_days} dias`)
                  .join("\n\n")
              : "Nenhum plano de servidor disponível no momento.",
          }),
        ],
        ephemeral: true,
      });
    }

    if (sub === "resgatar") {
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          embeds: [
            ui.error({
              title: "Permissão insuficiente",
              description: "Apenas administradores podem resgatar códigos premium.",
            }),
          ],
          ephemeral: true,
        });
      }
      const code = interaction.options.getString("codigo", true);
      const result = await redeemCode({ code, guildId });
      if (!result.ok) {
        return interaction.reply({
          embeds: [
            ui.error({
              title: "Não foi possível resgatar",
              description: REASONS[result.reason] ?? "Tente novamente.",
            }),
          ],
          ephemeral: true,
        });
      }
      const banner = await getAsset(guildId, "premium.banner");
      return interaction.reply({
        embeds: [
          ui.premium({
            guildId,
            title: "Premium ativado",
            description: `Plano **${result.plan.name}** ativado neste servidor.\nExpira: ${fmtExpire(result.subscription.expires_at)}`,
            image: banner,
          }),
        ],
      });
    }
  },
};

export default command;
