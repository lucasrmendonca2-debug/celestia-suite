
-- ========== Premium / VIP system ==========

-- Plans
CREATE TABLE public.premium_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('USER_VIP','GUILD_PREMIUM')),
  price NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  duration_days INTEGER DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.premium_plans TO authenticated, anon;
GRANT ALL ON public.premium_plans TO service_role;
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "premium_plans read all" ON public.premium_plans FOR SELECT USING (true);
CREATE TRIGGER trg_premium_plans_updated BEFORE UPDATE ON public.premium_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Subscriptions
CREATE TABLE public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('USER_VIP','GUILD_PREMIUM')),
  plan_id UUID NOT NULL REFERENCES public.premium_plans(id) ON DELETE RESTRICT,
  user_id TEXT,
  guild_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED','SUSPENDED','PENDING')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by TEXT,
  source TEXT DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_premium_subs_user ON public.premium_subscriptions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_premium_subs_guild ON public.premium_subscriptions(guild_id) WHERE guild_id IS NOT NULL;
CREATE INDEX idx_premium_subs_status ON public.premium_subscriptions(status, expires_at);
GRANT SELECT ON public.premium_subscriptions TO authenticated;
GRANT ALL ON public.premium_subscriptions TO service_role;
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "premium_subs read auth" ON public.premium_subscriptions FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_premium_subs_updated BEFORE UPDATE ON public.premium_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Benefits
CREATE TABLE public.premium_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.premium_plans(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  value JSONB NOT NULL DEFAULT 'true'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, key)
);
GRANT SELECT ON public.premium_benefits TO authenticated, anon;
GRANT ALL ON public.premium_benefits TO service_role;
ALTER TABLE public.premium_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "premium_benefits read all" ON public.premium_benefits FOR SELECT USING (true);
CREATE TRIGGER trg_premium_benefits_updated BEFORE UPDATE ON public.premium_benefits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Activation codes
CREATE TABLE public.premium_activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.premium_plans(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('USER_VIP','GUILD_PREMIUM')),
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  duration_days INTEGER,
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.premium_activation_codes TO authenticated;
GRANT ALL ON public.premium_activation_codes TO service_role;
ALTER TABLE public.premium_activation_codes ENABLE ROW LEVEL SECURITY;
-- only service_role reads codes by default; admin dashboard uses server fns with admin client
CREATE POLICY "premium_codes deny all auth" ON public.premium_activation_codes FOR SELECT TO authenticated USING (false);
CREATE TRIGGER trg_premium_codes_updated BEFORE UPDATE ON public.premium_activation_codes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Activations history
CREATE TABLE public.premium_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES public.premium_activation_codes(id) ON DELETE CASCADE,
  user_id TEXT,
  guild_id TEXT,
  subscription_id UUID REFERENCES public.premium_subscriptions(id) ON DELETE SET NULL,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.premium_activations TO authenticated;
GRANT ALL ON public.premium_activations TO service_role;
ALTER TABLE public.premium_activations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "premium_activations read auth" ON public.premium_activations FOR SELECT TO authenticated USING (true);

-- Guild config
CREATE TABLE public.premium_guild_config (
  guild_id TEXT PRIMARY KEY,
  premium_role_id TEXT,
  vip_role_id TEXT,
  premium_log_channel_id TEXT,
  show_premium_badges BOOLEAN NOT NULL DEFAULT true,
  allow_vip_tickets BOOLEAN NOT NULL DEFAULT false,
  allow_vip_shop_items BOOLEAN NOT NULL DEFAULT false,
  appearance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_guild_config TO authenticated;
GRANT ALL ON public.premium_guild_config TO service_role;
ALTER TABLE public.premium_guild_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "premium_guild_config read auth" ON public.premium_guild_config FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_premium_guild_cfg_updated BEFORE UPDATE ON public.premium_guild_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Audit log
CREATE TABLE public.premium_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target_user_id TEXT,
  target_guild_id TEXT,
  admin_id TEXT,
  plan_id UUID REFERENCES public.premium_plans(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_premium_audit_target_user ON public.premium_audit_log(target_user_id);
CREATE INDEX idx_premium_audit_target_guild ON public.premium_audit_log(target_guild_id);
GRANT SELECT ON public.premium_audit_log TO authenticated;
GRANT ALL ON public.premium_audit_log TO service_role;
ALTER TABLE public.premium_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "premium_audit read auth" ON public.premium_audit_log FOR SELECT TO authenticated USING (true);

-- Feature usage / counters
CREATE TABLE public.premium_feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id TEXT,
  user_id TEXT,
  feature_key TEXT NOT NULL,
  used_amount INTEGER NOT NULL DEFAULT 0,
  limit_amount INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_premium_usage_lookup ON public.premium_feature_usage(guild_id, user_id, feature_key);
GRANT SELECT ON public.premium_feature_usage TO authenticated;
GRANT ALL ON public.premium_feature_usage TO service_role;
ALTER TABLE public.premium_feature_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "premium_usage read auth" ON public.premium_feature_usage FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_premium_usage_updated BEFORE UPDATE ON public.premium_feature_usage
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ========== Seed default plans ==========
INSERT INTO public.premium_plans (name, slug, type, description, price, duration_days, features, limits) VALUES
('VIP Bronze','vip-bronze','USER_VIP','VIP de usuário com benefícios essenciais.',9.90,30,
  '{"economy.multiplier.daily":1.5,"economy.multiplier.work":1.5,"level.multiplier.xp":1.5,"social.profile.banner":true,"social.profile.customColor":true,"social.rankCard.vipFrame":true,"tickets.priority":true}'::jsonb,
  '{}'::jsonb),
('VIP Gold','vip-gold','USER_VIP','VIP de usuário com benefícios completos.',19.90,30,
  '{"economy.multiplier.daily":2,"economy.multiplier.work":2,"economy.multiplier.crime":2,"level.multiplier.xp":2,"social.profile.banner":true,"social.profile.customColor":true,"social.rankCard.vipFrame":true,"tickets.priority":true,"economy.shop.vipItems":true}'::jsonb,
  '{}'::jsonb),
('Servidor Premium','server-premium','GUILD_PREMIUM','Premium para o servidor com limites ampliados.',29.90,30,
  '{"dashboard.customBranding":true,"logs.advancedLogs":true,"moderation.advancedAutomod":true,"tickets.extraCategories":true,"giveaways.advancedRequirements":true}'::jsonb,
  '{"tickets.categories":20,"shop.items":50,"badges.custom":50,"level.rewards":50,"automations":30}'::jsonb),
('Ultimate','ultimate','GUILD_PREMIUM','Tudo liberado para o servidor.',59.90,30,
  '{"dashboard.customBranding":true,"logs.advancedLogs":true,"moderation.advancedAutomod":true,"tickets.extraCategories":true,"giveaways.advancedRequirements":true,"social.profile.banner":true}'::jsonb,
  '{"tickets.categories":100,"shop.items":250,"badges.custom":250,"level.rewards":250,"automations":150}'::jsonb);
