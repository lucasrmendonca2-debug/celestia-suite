import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../../types/command.js";
import { ui } from "../../systems/ui/embed.factory.js";
import { getAsset } from "../../systems/ui/embed.assets.js";
import { fmtCoins } from "../../utils/format.js";
import { EconomyAccount } from "../../../database/models.js";
import { getCurrency } from "../../systems/economy/economy.js";
import { supabase } from "../../../database/supabase.js";

const MEDALS = ["🥇", "🥈", "🥉"];
const RARITY_EMOJI: Record<string, string> = {
  common: "",
  rare: "🔵",
  epic: "🟣",
  legendary: "🟡",
  seasonal: "🌟",
};

const command: SlashCommand = {
  category: "economy",
  cooldown: 5,
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName("ranking")
    .setNameLocalizations({ "en-US": "top" })
    .setDescription("Ranking de riqueza do servidor."),
  async execute(interaction) {
    const guildId = interaction.guildId!;
    const top = await EconomyAccount.find({ guildId })
      .sort({ wallet: -1, bank: -1 })
      .limit(10);
    const c = await getCurrency(guildId);
    const image = await getAsset(guildId, "economy.top_image");

    // Busca frame equipado de cada user no top pra exibir badge de raridade
    const userIds = top.map((t) => t.userId);
    const rarityByUser = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: loadouts } = await supabase
        .from("user_profile_loadout")
        .select("user_id, frame_id, profile_cosmetics!user_profile_loadout_frame_id_fkey(rarity)")
        .in("user_id", userIds);
      for (const l of loadouts ?? []) {
        // @ts-expect-error supabase join shape
        const rarity = l.profile_cosmetics?.rarity as string | undefined;
        if (rarity && RARITY_EMOJI[rarity]) {
          rarityByUser.set(l.user_id as string, RARITY_EMOJI[rarity]);
        }
      }
    }

    await interaction.reply({
      embeds: [
        ui.economy({
          guildId,
          title: "Top Riqueza do servidor",
          description: top.length
            ? top
                .map((a, i) => {
                  const prefix = MEDALS[i] ?? `**#${i + 1}**`;
                  const badge = rarityByUser.get(a.userId) ?? "";
                  return `${prefix} <@${a.userId}> ${badge} — ${fmtCoins(a.wallet + a.bank, c.emoji, c.name)}`;
                })
                .join("\n")
            : "Ninguém no ranking ainda. Use `/daily` e `/trabalhar` para começar.",
          footer: "🟡/🟣/🔵 = raridade da moldura equipada · personalize em /perfil",
          image,
        }),
      ],
    });
  },
};
export default command;
