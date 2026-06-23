import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { getActiveUserSubscription, getPlan, listPlans, redeemCode } from "../../systems/premium/premium.service.js";
import { applyVipRole } from "../../systems/premium/premium.roles.js";

function fmtExpire(iso: string | null): string {
  if (!iso) return "Vitalício";
  return `<t:${Math.floor(new Date(iso).getTime() / 1000)}:R>`;
}

const REASONS: Record<string, string> = {
  not_found: "Não encontrei esse código. Verifique se digitou corretamente.",
  inactive: "Esse código está inativo.",
  expired: "Esse código já expirou e não pode mais ser usado.",
  exhausted: "Esse código já atingiu o limite de usos.",
  plan_mismatch: "Esse código não corresponde ao tipo de plano esperado.",
  missing_target: "Esse código precisa de um alvo válido.",
};

const command: SlashCommand = {
  category: "vip",
  cooldown: 3,
  guildOnly: false,
  data: new SlashCommandBuilder()
    .setName("vip")
    .setDescription("Sistema VIP de usuário.")
    .addSubcommand((s) => s.setName("status").setDescription("Mostra o status do seu VIP."))
    .addSubcommand((s) =>
      s
        .setName("ativar")
        .setDescription("Resgata um código de VIP.")
        .addStringOption((o) => o.setName("codigo").setDescription("Código premium").setRequired(true)),
    )
    .addSubcommand((s) => s.setName("beneficios").setDescription("Mostra os planos VIP disponíveis."))
    .addSubcommand((s) =>
      s
        .setName("presente")
        .setDescription("Presenteia VIP a outro usuário usando um código (de USER_VIP).")
        .addUserOption((o) => o.setName("usuario").setDescription("Quem receberá").setRequired(true))
        .addStringOption((o) => o.setName("codigo").setDescription("Código premium").setRequired(true)),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "status") {
      const active = await getActiveUserSubscription(interaction.user.id);
      const plan = active ? await getPlan(active.plan_id) : null;
      return interaction.reply({
        embeds: [
          brandEmbed({
            kind: active ? "success" : "info",
            title: `💎 VIP — ${interaction.user.tag}`,
            description: active && plan
              ? `Plano: **${plan.name}**\nStatus: **${active.status}**\nExpira: ${fmtExpire(active.expires_at)}`
              : "Você ainda não tem VIP ativo.",
            thumbnail: interaction.user.displayAvatarURL(),
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "beneficios") {
      const plans = await listPlans({ type: "USER_VIP", activeOnly: true });
      return interaction.reply({
        embeds: [
          brandEmbed({
            title: "💎 Planos VIP",
            description: plans.length
              ? plans.map((p) => `**${p.name}** — ${p.description}\nDuração: ${p.duration_days} dias`).join("\n\n")
              : "Nenhum plano VIP disponível no momento.",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "ativar") {
      const code = interaction.options.getString("codigo", true);
      const result = await redeemCode({ code, userId: interaction.user.id });
      if (!result.ok) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Não foi possível ativar", description: REASONS[result.reason] })],
          flags: MessageFlags.Ephemeral,
        });
      }
      // aplica cargo VIP no servidor atual, se houver
      if (interaction.guild) {
        await applyVipRole(interaction.guild, interaction.user.id).catch(() => {});
      }
      return interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "💎 VIP ativado",
            description: `Código resgatado com sucesso! Plano **${result.plan.name}** ativado.\nExpira: ${fmtExpire(result.subscription.expires_at)}`,
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "presente") {
      const target = interaction.options.getUser("usuario", true);
      const code = interaction.options.getString("codigo", true);
      const result = await redeemCode({ code, userId: target.id });
      if (!result.ok) {
        return interaction.reply({
          embeds: [brandEmbed({ kind: "error", title: "Não foi possível presentear", description: REASONS[result.reason] })],
          flags: MessageFlags.Ephemeral,
        });
      }
      return interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "🎁 VIP presenteado",
            description: `<@${target.id}> recebeu o plano **${result.plan.name}**.\nExpira: ${fmtExpire(result.subscription.expires_at)}`,
          }),
        ],
      });
    }
  },
};

export default command;
