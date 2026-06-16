import { supabase } from "../../../database/supabase.js";
import { logger } from "../../utils/logger.js";

export async function logAudit(args: {
  action: string;
  targetUserId?: string | null;
  targetGuildId?: string | null;
  adminId?: string | null;
  planId?: string | null;
  details?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("premium_audit_log").insert({
    action: args.action,
    target_user_id: args.targetUserId ?? null,
    target_guild_id: args.targetGuildId ?? null,
    admin_id: args.adminId ?? null,
    plan_id: args.planId ?? null,
    details: args.details ?? {},
  });
  if (error) logger.error({ err: error, action: args.action }, "premium audit log failed");
}
