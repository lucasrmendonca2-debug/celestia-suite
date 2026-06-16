export type PremiumType = "USER_VIP" | "GUILD_PREMIUM";
export type PremiumStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUSPENDED" | "PENDING";

export interface PremiumPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: PremiumType;
  price: number;
  currency: string;
  duration_days: number;
  active: boolean;
  features: Record<string, unknown>;
  limits: Record<string, number>;
}

export interface PremiumSubscription {
  id: string;
  type: PremiumType;
  plan_id: string;
  user_id: string | null;
  guild_id: string | null;
  status: PremiumStatus;
  starts_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_by: string | null;
  source: string | null;
  notes: string | null;
}

export interface PremiumActivationCode {
  id: string;
  code: string;
  plan_id: string;
  type: PremiumType;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  duration_days: number | null;
}
