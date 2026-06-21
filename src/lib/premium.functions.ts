import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface PremiumPlanDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: "USER_VIP" | "GUILD_PREMIUM";
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  limits: Record<string, number>;
}

const FEATURE_LABELS: Record<string, string> = {
  "tickets.priority": "Tickets com fila prioritária",
  "tickets.extraCategories": "Categorias extras de tickets",
  "level.multiplier.xp": "Multiplicador de XP",
  "economy.multiplier.daily": "Daily turbinado",
  "economy.multiplier.work": "Work turbinado",
  "economy.multiplier.crime": "Crime turbinado",
  "economy.shop.vipItems": "Itens VIP exclusivos na loja",
  "social.profile.banner": "Banner customizado no perfil",
  "social.profile.customColor": "Cor personalizada no perfil",
  "social.rankCard.vipFrame": "Moldura VIP no rank card",
  "logs.advancedLogs": "Logs avançados",
  "moderation.advancedAutomod": "AutoMod avançado",
  "giveaways.advancedRequirements": "Requisitos avançados em sorteios",
  "dashboard.customBranding": "Branding customizado no dashboard",
};

const LIMIT_LABELS: Record<string, string> = {
  "shop.items": "itens na loja",
  "automations": "automações",
  "badges.custom": "badges customizadas",
  "level.rewards": "recompensas de nível",
  "tickets.categories": "categorias de tickets",
};

export function describeFeature(key: string, value: unknown): string {
  const base = FEATURE_LABELS[key] ?? key;
  if (typeof value === "number" && value !== 1) return `${base} (${value}x)`;
  return base;
}

export function describeLimit(key: string, value: number): string {
  const label = LIMIT_LABELS[key] ?? key;
  return `${value} ${label}`;
}

function serverClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getPremiumPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<PremiumPlanDTO[]> => {
    const supabase = serverClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("premium_plans")
      .select("id, slug, name, description, type, price, currency, duration_days, features, limits")
      .eq("active", true)
      .order("price", { ascending: true });
    if (error || !data) return [];
    return data.map((p) => {
      const featuresObj = (p.features ?? {}) as Record<string, unknown>;
      const limitsObj = (p.limits ?? {}) as Record<string, number>;
      const featureList: string[] = [];
      for (const [k, v] of Object.entries(featuresObj)) featureList.push(describeFeature(k, v));
      for (const [k, v] of Object.entries(limitsObj)) featureList.push(describeLimit(k, Number(v)));
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description ?? "",
        type: p.type as "USER_VIP" | "GUILD_PREMIUM",
        price: Number(p.price ?? 0),
        currency: p.currency ?? "BRL",
        durationDays: p.duration_days ?? 30,
        features: featureList,
        limits: limitsObj,
      };
    });
  },
);
