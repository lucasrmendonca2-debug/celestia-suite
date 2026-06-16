-- ============================================================
-- PASS 2: Badges & Achievements
-- ============================================================

-- Badges (catálogo por servidor)
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '🏅',
  icon_url text,
  rarity text NOT NULL DEFAULT 'common',
  color text NOT NULL DEFAULT '#5865F2',
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role full access" ON public.badges FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated read/write" ON public.badges FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER badges_touch_updated BEFORE UPDATE ON public.badges FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Badges entregues a usuários
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  user_id text NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  awarded_by text,
  reason text,
  UNIQUE (guild_id, user_id, badge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role full access" ON public.user_badges FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated read/write" ON public.user_badges FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX user_badges_guild_user_idx ON public.user_badges (guild_id, user_id);

-- Conquistas (catálogo por servidor)
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '🏆',
  points integer NOT NULL DEFAULT 10,
  trigger_type text NOT NULL DEFAULT 'manual',
  trigger_value integer NOT NULL DEFAULT 0,
  reward_badge_id uuid REFERENCES public.badges(id) ON DELETE SET NULL,
  reward_coins integer NOT NULL DEFAULT 0,
  reward_xp integer NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guild_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role full access" ON public.achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated read/write" ON public.achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER achievements_touch_updated BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Conquistas desbloqueadas
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  user_id text NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  progress integer NOT NULL DEFAULT 0,
  UNIQUE (guild_id, user_id, achievement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role full access" ON public.user_achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated read/write" ON public.user_achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX user_achievements_guild_user_idx ON public.user_achievements (guild_id, user_id);

-- Validação de trigger_type (CHECK estática — valores fixos, sem time-dependence)
ALTER TABLE public.achievements
  ADD CONSTRAINT achievements_trigger_type_check
  CHECK (trigger_type IN ('manual', 'messages_count', 'level_reached', 'reputation_received', 'badges_collected'));

ALTER TABLE public.badges
  ADD CONSTRAINT badges_rarity_check
  CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'));
