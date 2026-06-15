import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { brandEmbed } from "../../utils/embed.js";
import { fmtCoins } from "../../utils/format.js";
import { ShopItem, InventoryItem } from "../../../database/models.js";
import { getCurrency, getAccount } from "../../systems/economy/economy.js";

const command: SlashCommand = {
  category: "economy",
  cooldown: 3,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Loja do servidor.")
    .addSubcommand((s) => s.setName("list").setDescription("Lista itens"))
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Staff: adiciona item")
        .addStringOption((o) => o.setName("nome").setDescription("Nome").setRequired(true))
        .addIntegerOption((o) => o.setName("preco").setDescription("Preço").setRequired(true).setMinValue(0))
        .addStringOption((o) => o.setName("descricao").setDescription("Descrição"))
        .addRoleOption((o) => o.setName("cargo").setDescription("Cargo entregue ao comprar"))
        .addIntegerOption((o) => o.setName("estoque").setDescription("Estoque (-1 ilimitado)")),
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("Staff: remove item")
        .addStringOption((o) => o.setName("nome").setDescription("Nome").setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName("buy")
        .setDescription("Compra um item")
        .addStringOption((o) => o.setName("nome").setDescription("Nome").setRequired(true))
        .addIntegerOption((o) => o.setName("quantidade").setDescription("Qtd").setMinValue(1)),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const c = await getCurrency(guildId);

    if (sub === "list") {
      const items = await ShopItem.find({ guildId, enabled: true }).limit(25);
      await interaction.reply({
        embeds: [
          brandEmbed({
            title: "🛒 Loja do servidor",
            description: items.length
              ? items
                  .map(
                    (i) =>
                      `${i.emoji} **${i.name}** — ${fmtCoins(i.price, c.emoji, c.name)}${
                        i.stock >= 0 ? ` • Estoque: ${i.stock}` : ""
                      }\n${i.description ? `_${i.description}_` : ""}`,
                  )
                  .join("\n\n")
              : "Nenhum item na loja ainda. Staff: use `/shop add`.",
          }),
        ],
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
        { guildId, name, price, description, stock, roleId: role?.id ?? null, consumable: !role },
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
      if (item.stock !== -1 && item.stock < qty) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Sem estoque" })], ephemeral: true });
        return;
      }
      const total = item.price * qty;
      const acc = await getAccount(guildId, interaction.user.id);
      if (acc.wallet < total) {
        await interaction.reply({ embeds: [brandEmbed({ kind: "error", title: "Saldo insuficiente" })], ephemeral: true });
        return;
      }
      acc.wallet -= total;
      await acc.save();
      if (item.stock !== -1) {
        item.stock -= qty;
        await item.save();
      }
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
      await interaction.reply({
        embeds: [brandEmbed({ kind: "success", title: "🛍️ Compra concluída", description: `Você comprou **${qty}× ${item.name}** por ${fmtCoins(total, c.emoji, c.name)}` })],
      });
    }
  },
};
export default command;
