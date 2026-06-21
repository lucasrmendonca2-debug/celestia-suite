import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins } from "../../utils/format.js";
import { ShopItem, InventoryItem } from "../../../database/models.js";
import { getCurrency, getAccount } from "../../systems/economy/economy.js";
import {
  applyRotationPrice,
  ensureRotation,
  getActiveRotation,
  rotateNow,
} from "../../systems/economy/shop.rotation.js";
import { logTx } from "../../systems/economy/economy.tx.js";
import { syncDashboardShopItems } from "../../systems/economy/shop.dashboard.js";


const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("loja").setNameLocalizations({"en-US":"shop"})
    .setDescription("Loja do servidor.")
    .addSubcommand((s) => s.setName("listar").setNameLocalizations({ "en-US": "list" }).setDescription("Lista itens"))
    .addSubcommand((s) =>
      s
        .setName("adicionar")
        .setNameLocalizations({ "en-US": "add" })
        .setDescription("Staff: adiciona item")
        .addStringOption((o) => o.setName("nome").setDescription("Nome").setRequired(true))
        .addIntegerOption((o) => o.setName("preco").setDescription("Preço").setRequired(true).setMinValue(0))
        .addStringOption((o) => o.setName("descricao").setDescription("Descrição"))
        .addRoleOption((o) => o.setName("cargo").setDescription("Cargo entregue ao comprar"))
        .addIntegerOption((o) => o.setName("estoque").setDescription("Estoque (-1 ilimitado)")),
    )
    .addSubcommand((s) =>
      s
        .setName("remover")
        .setNameLocalizations({ "en-US": "remove" })
        .setDescription("Staff: remove item")
        .addStringOption((o) => o.setName("nome").setDescription("Nome").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("comprar")
        .setNameLocalizations({ "en-US": "buy" })
        .setDescription("Compra um item")
        .addStringOption((o) => o.setName("nome").setDescription("Nome").setRequired(true))
        .addIntegerOption((o) => o.setName("quantidade").setDescription("Qtd").setMinValue(1)),
    )
    .addSubcommand((s) =>
      s.setName("rotacao").setDescription("Mostra a loja rotativa atual."),
    )
    .addSubcommand((s) =>
      s.setName("rotacionar").setDescription("Staff: força uma nova rotação agora."),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const c = await getCurrency(guildId);
    if (sub === "list" || sub === "buy" || sub === "rotacao" || sub === "rotacionar") {
      await syncDashboardShopItems(guildId);
    }

    if (sub === "list") {
      const [items, rotation] = await Promise.all([
        ShopItem.find({ guildId, enabled: true }).limit(25),
        ensureRotation(guildId),
      ]);
      const rotSet = new Set(rotation.map((r) => r.item_name));
      const lines = items.map((i) => {
        const { price, discount_pct } = applyRotationPrice(i.price, rotation, i.name);
        const tag = rotSet.has(i.name)
          ? discount_pct > 0
            ? ` 🔥 **-${discount_pct}%**`
            : " ⭐ Em destaque"
          : "";
        const priceStr =
          discount_pct > 0
            ? `~~${fmtCoins(i.price, c.emoji, c.name)}~~ → **${fmtCoins(price, c.emoji, c.name)}**`
            : fmtCoins(i.price, c.emoji, c.name);
        return `${i.emoji} **${i.name}** — ${priceStr}${tag}${
          i.stock >= 0 ? ` • Estoque: ${i.stock}` : ""
        }\n${i.description ? `_${i.description}_` : ""}`;
      });
      const expires = rotation[0]?.expires_at;
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "🛒 Loja do servidor",
            description: items.length
              ? lines.join("\n\n")
              : "Nenhum item na loja ainda. Staff: use `/loja add`.",
            footer: expires
              ? `Rotação reseta em <t:${Math.floor(new Date(expires).getTime() / 1000)}:R>`
              : undefined,
          }),
        ],
      });
      return;
    }

    if (sub === "rotacao") {
      const rotation = await ensureRotation(guildId);
      if (!rotation.length) {
        await interaction.reply({
          embeds: [brandEmbed({ kind: "info", title: "Sem rotação ativa", description: "Adicione itens com `/loja add` primeiro." })],
          ephemeral: true,
        });
        return;
      }
      const items = await ShopItem.find({
        guildId,
        name: { $in: rotation.map((r) => r.item_name) },
      }).lean();
      const byName = new Map(items.map((i: any) => [i.name, i]));
      const lines = rotation
        .map((r) => {
          const it: any = byName.get(r.item_name);
          if (!it) return null;
          const price = Math.max(0, Math.floor(it.price * (1 - r.discount_pct / 100)));
          return `${it.emoji ?? "🎁"} **${it.name}** — ${
            r.discount_pct > 0
              ? `~~${fmtCoins(it.price, c.emoji, c.name)}~~ → **${fmtCoins(price, c.emoji, c.name)}** (-${r.discount_pct}%)`
              : fmtCoins(it.price, c.emoji, c.name)
          }`;
        })
        .filter(Boolean)
        .join("\n");
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "🔥 Loja rotativa",
            description: lines || "_Itens da rotação não existem mais na loja._",
            footer: `Reseta em <t:${Math.floor(new Date(rotation[0]!.expires_at).getTime() / 1000)}:R>`,
          }),
        ],
      });
      return;
    }

    if (sub === "rotacionar") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Sem permissão" })], ephemeral: true });
        return;
      }
      const r = await rotateNow(guildId);
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: `Rotação atualizada (${r.length} itens)`,
            description: r.length
              ? r.map((s) => `• **${s.item_name}** -${s.discount_pct}%`).join("\n")
              : "_Nenhum item disponível para rotacionar. Adicione itens primeiro._",
          }),
        ],
        ephemeral: true,
      });
      return;
    }


    if (sub === "add") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Sem permissão" })], ephemeral: true });
        return;
      }
      const name = interaction.options.getString("nome", true).slice(0, 60);
      const price = interaction.options.getInteger("preco", true);
      const description = interaction.options.getString("descricao") ?? "";
      const role = interaction.options.getRole("cargo");
      const stock = interaction.options.getInteger("estoque") ?? -1;
      await ShopItem.findOneAndUpdate(
        { guildId, name },
          { guildId, name, price, description, stock, roleId: role?.id ?? null, consumable: !role, source: "bot" },
        { upsert: true, setDefaultsOnInsert: true },
      );
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Item adicionado", description: `**${name}** — ${fmtCoins(price, c.emoji, c.name)}` })], ephemeral: true });
      return;
    }

    if (sub === "remove") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Sem permissão" })], ephemeral: true });
        return;
      }
      const name = interaction.options.getString("nome", true);
      await ShopItem.deleteOne({ guildId, name });
      await interaction.reply({ embeds: [brandEmbed({ kind: "success", title: "Item removido" })], ephemeral: true });
      return;
    }

    if (sub === "buy") {
      const name = interaction.options.getString("nome", true);
      const qty = interaction.options.getInteger("quantidade") ?? 1;
      const item = await ShopItem.findOne({ guildId, name, enabled: true });
      if (!item) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Item não encontrado" })], ephemeral: true });
        return;
      }
      const rotation = await getActiveRotation(guildId);
      const { price: unitPrice, discount_pct } = applyRotationPrice(item.price, rotation, item.name);
      const total = unitPrice * qty;

      // Atômico: desconta estoque com filtro de quantidade disponível.
      if (item.stock !== -1) {
        const stockUpdate = await ShopItem.updateOne(
          { _id: item._id, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
        );
        if (stockUpdate.modifiedCount === 0) {
          await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Sem estoque" })], ephemeral: true });
          return;
        }
      }

      // Atômico: desconta saldo da carteira só se houver fundos suficientes.
      const { EconomyAccount } = await import("../../../database/models.js");
      const walletUpdate = await EconomyAccount.findOneAndUpdate(
        { guildId, userId: interaction.user.id, wallet: { $gte: total } },
        { $inc: { wallet: -total } },
        { new: true },
      );
      if (!walletUpdate) {
        // Devolve estoque se houver.
        if (item.stock !== -1) {
          await ShopItem.updateOne({ _id: item._id }, { $inc: { stock: qty } });
        }
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Saldo insuficiente" })], ephemeral: true });
        return;
      }
      const acc = walletUpdate;
      if (item.roleId && interaction.guild) {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        await member?.roles.add(item.roleId).catch(() => {});
      } else {
        await InventoryItem.findOneAndUpdate(
          { guildId, userId: interaction.user.id, itemId: item._id },
          { $inc: { quantity: qty }, $setOnInsert: { name: item.name } },
          { upsert: true },
        );
      }
      void logTx({
        guildId,
        userId: interaction.user.id,
        kind: "shop_buy",
        amount: -total,
        balanceAfter: acc.wallet,
        reason: `Compra: ${qty}× ${item.name}${discount_pct ? ` (-${discount_pct}%)` : ""}`,
        metadata: { item_name: item.name, qty, discount_pct },
      });
      try {
        const { incrementMissionProgress } = await import("../../systems/economy/missions.js");
        void incrementMissionProgress(guildId, interaction.user.id, "shop_spend", total);
      } catch {
        /* noop */
      }
      await interaction.reply({
        embeds: [
          brandEmbed({
            kind: "success",
            title: "🛍️ Compra concluída",
            description: `Você comprou **${qty}× ${item.name}** por ${fmtCoins(total, c.emoji, c.name)}${discount_pct ? ` 🔥 (-${discount_pct}%)` : ""}`,
          }),
        ],
      });
    }
  },
};
export default command;
