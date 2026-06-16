import type { Client } from "discord.js";
import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";
import { removeVipRole } from "./premium.roles.js";
import { logAudit } from "./premium.audit.js";

/** Roda 1x por minuto via scheduler central. */
export async function tickPremiumExpirations(client: Client) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("premium_subscriptions")
    .select("*")
    .eq("status", "ACTIVE")
    .not("expires_at", "is", null)
    .lte("expires_at", now)
    .limit(200);

  if (error) {
    logger.error({ err: error }, "premium expiration query failed");
    return;
  }

  for (const sub of data ?? []) {
    await supabase
      .from("premium_subscriptions")
      .update({ status: "EXPIRED" })
      .eq("id", sub.id);

    if (sub.type === "USER_VIP" && sub.user_id) {
      // remove cargo VIP de todas as guilds em que o bot esteja
      for (const guild of client.guilds.cache.values()) {
        await removeVipRole(guild, sub.user_id).catch(() => {});
      }
    }

    await logAudit({
      action: "subscription.expire",
      targetUserId: sub.user_id ?? null,
      targetGuildId: sub.guild_id ?? null,
      planId: sub.plan_id ?? null,
      details: { subscriptionId: sub.id },
    });
  }
}
