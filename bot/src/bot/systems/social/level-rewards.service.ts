import type { GuildMember } from "discord.js";
import { supabase } from "../../../database/supabase.js";
import { addWallet } from "../economy/economy.js";

interface RewardRow {
  id: string;
  guild_id: string;
  level: number;
  reward_type: "role" | "coins" | "badge" | "title";
  reward_value: string;
  remove_previous_roles: boolean;
  active: boolean;
}

/** Entrega todas as recompensas até o nível atual (idempotente para cargos). */
export async function applyLevelRewards(member: GuildMember, currentLevel: number): Promise<void> {
  const { data } = await supabase
    .from("level_rewards")
    .select("*")
    .eq("guild_id", member.guild.id)
    .eq("active", true)
    .lte("level", currentLevel)
    .order("level", { ascending: true });

  const rewards = (data ?? []) as RewardRow[];
  if (rewards.length === 0) return;

  const allRoleRewards = rewards.filter((r) => r.reward_type === "role");
  const highestRole = allRoleRewards[allRoleRewards.length - 1];

  for (const r of rewards) {
    try {
      if (r.reward_type === "role") {
        if (!member.guild.members.me?.permissions.has("ManageRoles")) continue;
        const role = member.guild.roles.cache.get(r.reward_value);
        if (!role) continue;
        if (member.guild.members.me.roles.highest.position <= role.position) continue;
        if (r.remove_previous_roles && highestRole?.id === r.id) {
          for (const prev of allRoleRewards) {
            if (prev.reward_value !== r.reward_value && member.roles.cache.has(prev.reward_value)) {
              await member.roles.remove(prev.reward_value).catch(() => {});
            }
          }
        }
        if (!member.roles.cache.has(r.reward_value)) {
          await member.roles.add(r.reward_value, `Recompensa nível ${r.level}`).catch(() => {});
        }
      } else if (r.reward_type === "coins") {
        const amount = Number(r.reward_value);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        await addWallet(member.guild.id, member.id, amount).catch(() => {});
      }
      // badge/title: aplicado em pass 2 (sistema de badges) — registramos no log
      await supabase.from("level_logs").insert({
        guild_id: member.guild.id,
        user_id: member.id,
        action: "reward_given",
        level: r.level,
        details: { type: r.reward_type, value: r.reward_value },
      });
    } catch {
      // silencioso, é um caminho best-effort
    }
  }
}
