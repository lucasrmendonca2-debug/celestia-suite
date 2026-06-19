import { ShopItem } from "../../../database/models.js";
import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";

type DashboardShopItem = {
  name: string;
  description: string | null;
  price: number;
  role_id: string | null;
  stock: number | null;
  enabled: boolean;
  type: string | null;
};

export async function syncDashboardShopItems(guildId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("shop_items")
      .select("name,description,price,role_id,stock,enabled,type")
      .eq("guild_id", guildId);
    if (error || !data?.length) {
      if (error) logger.debug({ err: error, guildId }, "syncDashboardShopItems falhou");
      return;
    }

    await Promise.all(
      (data as DashboardShopItem[]).map((item) =>
        ShopItem.findOneAndUpdate(
          { guildId, name: item.name },
          {
            guildId,
            name: item.name,
            description: item.description ?? "",
            price: Number(item.price),
            stock: item.stock ?? -1,
            roleId: item.role_id ?? null,
            consumable: item.type !== "role" || !item.role_id,
            enabled: item.enabled,
          },
          { upsert: true, setDefaultsOnInsert: true },
        ),
      ),
    );
  } catch (err) {
    logger.debug({ err, guildId }, "syncDashboardShopItems falhou silenciosamente");
  }
}