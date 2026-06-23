
-- 1. Cosmético exclusivo de guild (visível somente para membros daquela guild)
ALTER TABLE public.profile_cosmetics
  ADD COLUMN IF NOT EXISTS guild_exclusive_id text NULL;

CREATE INDEX IF NOT EXISTS idx_profile_cosmetics_guild_exclusive
  ON public.profile_cosmetics(guild_exclusive_id)
  WHERE guild_exclusive_id IS NOT NULL;

-- 2. level_rewards.reward_type aceita 'cosmetic'
ALTER TABLE public.level_rewards
  DROP CONSTRAINT IF EXISTS level_rewards_reward_type_check;
ALTER TABLE public.level_rewards
  ADD CONSTRAINT level_rewards_reward_type_check
  CHECK (reward_type = ANY (ARRAY['role'::text, 'coins'::text, 'badge'::text, 'title'::text, 'cosmetic'::text]));

-- 3. View pública para "loja de uma guild" (lista de cosméticos disponíveis para
--    membros daquela guild = catálogo global + exclusivos da guild)
CREATE OR REPLACE VIEW public.guild_shop_view AS
SELECT
  c.*,
  CASE WHEN c.guild_exclusive_id IS NOT NULL THEN c.guild_exclusive_id ELSE NULL END AS scope_guild_id
FROM public.profile_cosmetics c
WHERE c.active = true
  AND (c.available_from IS NULL OR c.available_from <= now())
  AND (c.available_until IS NULL OR c.available_until > now());

GRANT SELECT ON public.guild_shop_view TO anon, authenticated, service_role;

-- 4. RPC: aplica fator adaptativo da missão para um usuário
CREATE OR REPLACE FUNCTION public.get_user_mission_difficulty(_user_id text, _guild_id text)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(difficulty_score, 1.0)
  FROM public.user_mission_profile
  WHERE user_id = _user_id AND guild_id = _guild_id
  LIMIT 1
$$;

-- 5. RPC: ajusta difficulty_score com base em conclusões/falhas (chamado pelo bot)
CREATE OR REPLACE FUNCTION public.bump_user_mission_profile(
  _user_id text, _guild_id text, _completed boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new numeric;
BEGIN
  INSERT INTO public.user_mission_profile (user_id, guild_id, completed_count, failed_count, difficulty_score, last_completed_at)
  VALUES (_user_id, _guild_id,
          CASE WHEN _completed THEN 1 ELSE 0 END,
          CASE WHEN _completed THEN 0 ELSE 1 END,
          1.0,
          CASE WHEN _completed THEN now() ELSE NULL END)
  ON CONFLICT (user_id, guild_id) DO UPDATE
     SET completed_count = public.user_mission_profile.completed_count + CASE WHEN _completed THEN 1 ELSE 0 END,
         failed_count   = public.user_mission_profile.failed_count   + CASE WHEN _completed THEN 0 ELSE 1 END,
         difficulty_score = GREATEST(0.6, LEAST(1.8,
           public.user_mission_profile.difficulty_score
           + CASE WHEN _completed THEN 0.05 ELSE -0.05 END
         )),
         last_completed_at = CASE WHEN _completed THEN now() ELSE public.user_mission_profile.last_completed_at END,
         updated_at = now()
  RETURNING difficulty_score INTO v_new;

  RETURN jsonb_build_object('ok', true, 'difficulty_score', v_new);
END;
$$;
