import { SlashCommandBuilder } from "discord.js";
import ms from "ms";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { env } from "../../../config/env.js";
import {
  getActiveGuildSubscription,
  getActiveUserSubscription,
  getPlanBySlug,
  grantSubscription,
  listPlans,
  revokeGuildPremium,
  revokeUserVip,
} from "../../systems/premium/premium.service.js";
import { createCode } from "../../systems/premium/premium.codes.js";
import { applyVipRole, removeVipRole } from "../../systems/premium/premium.roles.js";

function isOwner(userId: string): boolean {
  return Boolean(env.BOT_OWNER_ID && env.BOT_OWNER_ID === userId);
}

function fmtExpire(iso: string | null): string {
  if (!iso) return "Vitalício";
  return `<t:${Math.floor(new Date(iso).getTime() / 1000)}:R>`;
}

const command: SlashCommand = {
  category: "admin",
  cooldown: 2,
  ownerOnly: true,
  guildOnly: false,
  data: new SlashCommandBuilder()
    .setName("admin-premium")
    .setDescription("Painel administrativo premium (apenas dono).")
    .addSubcommand((s) =>
      s
        .setName("add-user")
        .setDescription("Concede VIP a um usuário.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true))
        .addStringOption((o) => o.setName("plano").setDescription("Slug do plano (ex: vip-gold)").setRequired(true))
        .addStringOption((o) => o.setName("duracao").setDescription("Ex: 30d, 90d (vazio = vitalício)")),
    )
    .addSubcommand((s) =>
      s
        .setName("remove-user")
        .setDescription("Remove VIP de um usuário.")
        .addUserOption((o) => o.setName("usuario").setDescription("Usuário").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("add-guild")
        .setDescription("Concede premium a um servidor.")
        .addStringOption((o) => o.setName("servidor").setDescription("ID do servidor").setRequired(true))
        .addStringOption((o) => o.setName("plano").setDescription("Slug do plano (ex: server-premium)").setRequired(true))
        .addStringOption((o) => o.setName("duracao").setDescription("Ex: 30d, 90d (vazio = vitalício)")),
    )
    .addSubcommand((s) =>
      s
        .setName("remove-guild")
        .setDescription("Remove premium de um servidor.")
        .addStringOption((o) => o.setName("servidor").setDescription("ID do servidor").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("criar-codigo")
        .setDescription("Gera um código de ativação.")
        .addStringOption((o) => o.setName("plano").setDescription("Slug do plano").setRequired(true))
        .addIntegerOption((o) => o.setName("usos").setDescription("Quantidade de usos (default 1)"))
        .addStringOption((o) => o.setName("expira").setDescription("Ex: 30d, 90d (validade do código)"))
        .addStringOption((o) => o.setName("duracao").setDescription("Duração do plano ao resgatar (ex: 30d)")),
    )
    .addSubcommand((s) => s.setName("listar").setDescription("Lista os planos cadastrados.")),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [brandEmbed({ kind: "error", title: "Acesso negado", description: "Esse comando é restrito ao dono do bot." })],
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "listar") {
      const plans = await listPlans();
      return interaction.reply({
        embeds: [
          brandEmbed({
            title: "💎 Planos premium",
            description: plans.length
              ? plans.map((p) => `\`${p.slug}\` • **${p.name}** • ${p.type} • ${p.active ? "ativo" : "inativo"}`).join("\n")
              : "Nenhum plano cadastrado.",
          }),
        ],
        ephemeral: true,
      });
    }

    if (sub === "add-user") {
      const user = interaction.options.getUser("usuario", true);
      const slug = interaction.options.getString("plano", true);
      const dur = interaction.options.getString("duracao");
      const plan = await getPlanBySlug(slug);
      if (!plan) return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Plano não encontrado" })], ephemeral: true });
      if (plan.type !== "USER_VIP") return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Plano incompatível", description: "Esse plano não é do tipo USER_VIP." })], ephemeral: true });
      const durMs = dur ? (ms(dur) as number | undefined) : null;
      const durationDays = durMs ? Math.max(1, Math.round(durMs / 86_400_000)) : plan.duration_days;
      const subscription = await grantSubscription({
        planId: plan.id,
        type: "USER_VIP",
        userId: user.id,
        durationDays,
        createdBy: interaction.user.id,
        source: "admin",
      });
      if (interaction.guild) await applyVipRole(interaction.guild, user.id).catch(() => {});
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "VIP concedido", description: `<@${user.id}> agora tem **${plan.name}**.\nExpira: ${fmtExpire(subscription.expires_at)}` })],
      });
    }

    if (sub === "remove-user") {
      const user = interaction.options.getUser("usuario", true);
      await revokeUserVip(user.id, interaction.user.id);
      if (interaction.guild) await removeVipRole(interaction.guild, user.id).catch(() => {});
      return interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "VIP removido", description: `<@${user.id}> não é mais VIP.` })],
      });
    }

    if (sub === "add-guild") {
      const guildId = interaction.options.getString("servidor", true);
      const slug = interaction.options.getString("plano", true);
      const dur = interaction.options.getString("duracao");
      const plan = await getPlanBySlug(slug);
      if (!plan) return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Plano não encontrado" })], ephemeral: true });
      if (plan.type !== "GUILD_PREMIUM") return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Plano incompatível", description: "Esse plano não é GUILD_PREMIUM." })], ephemeral: true });
      const durMs = dur ? (ms(dur) as number | undefined) : null;
      const durationDays = durMs ? Math.max(1, Math.round(durMs / 86_400_000)) : plan.duration_days;
      const subscription = await grantSubscription({
        planId: plan.id,
        type: "GUILD_PREMIUM",
        guildId,
        durationDays,
        createdBy: interaction.user.id,
        source: "admin",
      });
      return interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "Premium concedido", description: `Servidor \`${guildId}\` agora tem **${plan.name}**.\nExpira: ${fmtExpire(subscription.expires_at)}` })],
      });
    }

    if (sub === "remove-guild") {
      const guildId = interaction.options.getString("servidor", true);
      await revokeGuildPremium(guildId, interaction.user.id);
      const active = await getActiveGuildSubscription(guildId);
      void active;
      return interaction.reply({
        embeds: [brandEmbed({ kind: "warn", title: "Premium removido", description: `Servidor \`${guildId}\` não é mais premium.` })],
      });
    }

    if (sub === "criar-codigo") {
      const slug = interaction.options.getString("plano", true);
      const usos = interaction.options.getInteger("usos") ?? 1;
      const expira = interaction.options.getString("expira");
      const duracao = interaction.options.getString("duracao");
      const plan = await getPlanBySlug(slug);
      if (!plan) return interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Plano não encontrado" })], ephemeral: true });
      const expiresAt = expira ? new Date(Date.now() + (ms(expira) as number)) : null;
      const durationDays = duracao ? Math.max(1, Math.round((ms(duracao) as number) / 86_400_000)) : null;
      const code = await createCode({
        planId: plan.id,
        type: plan.type,
        maxUses: usos,
        expiresAt,
        durationDays,
        createdBy: interaction.user.id,
      });
      // resposta efêmera — código é sensível
      // procuramos verificar se a active sub existe — ignore
      return interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "🎟️ Código criado",
            description: `Código: \`${code.code}\`\nPlano: **${plan.name}**\nUsos: ${code.max_uses}\nExpira: ${code.expires_at ? fmtExpire(code.expires_at) : "Nunca"}\nDuração do plano: ${code.duration_days ?? plan.duration_days} dias`,
          }),
        ],
        ephemeral: true,
      });
    }
  },
};

export default command;
