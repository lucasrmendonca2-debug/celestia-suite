
-- 1) User favorite cosmetics table
CREATE TABLE public.user_favorite_cosmetics (
  user_id text NOT NULL,
  cosmetic_id uuid NOT NULL REFERENCES public.profile_cosmetics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cosmetic_id)
);

GRANT ALL ON public.user_favorite_cosmetics TO service_role;

ALTER TABLE public.user_favorite_cosmetics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Favoritos acessados apenas pelo serviço"
  ON public.user_favorite_cosmetics
  FOR SELECT
  USING (false);

CREATE INDEX idx_user_favorite_cosmetics_user ON public.user_favorite_cosmetics(user_id);

-- 2) Hall of Fame function (public, aggregates top 10 cross-guild)
CREATE OR REPLACE FUNCTION public.get_hall_of_fame()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_active_season uuid;
  v_top_xp jsonb;
  v_top_coins jsonb;
  v_top_rep jsonb;
  v_season jsonb;
BEGIN
  SELECT id INTO v_active_season
  FROM public.level_seasons
  WHERE is_active = true
    AND (ends_at IS NULL OR ends_at > now())
    AND starts_at <= now()
  ORDER BY starts_at DESC
  LIMIT 1;

  SELECT to_jsonb(s) INTO v_season
  FROM (
    SELECT id, name, description, starts_at, ends_at
    FROM public.level_seasons
    WHERE id = v_active_season
  ) s;

  IF v_active_season IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.xp DESC), '[]'::jsonb) INTO v_top_xp
    FROM (
      SELECT user_id, SUM(xp)::bigint AS xp, MAX(level) AS level
      FROM public.level_season_users
      WHERE season_id = v_active_season
      GROUP BY user_id
      ORDER BY SUM(xp) DESC NULLS LAST
      LIMIT 10
    ) t;
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.xp DESC), '[]'::jsonb) INTO v_top_xp
    FROM (
      SELECT user_id, SUM(total_xp)::bigint AS xp, MAX(level) AS level
      FROM public.level_users
      GROUP BY user_id
      ORDER BY SUM(total_xp) DESC NULLS LAST
      LIMIT 10
    ) t;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.coins DESC), '[]'::jsonb) INTO v_top_coins
  FROM (
    SELECT user_id, SUM(balance + bank)::bigint AS coins
    FROM public.user_economy
    GROUP BY user_id
    ORDER BY SUM(balance + bank) DESC NULLS LAST
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.rep DESC), '[]'::jsonb) INTO v_top_rep
  FROM (
    SELECT to_user_id AS user_id, COUNT(*)::bigint AS rep
    FROM public.reputation_logs
    WHERE created_at >= now() - interval '30 days'
    GROUP BY to_user_id
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'season', v_season,
    'top_xp', v_top_xp,
    'top_coins', v_top_coins,
    'top_rep', v_top_rep,
    'generated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_hall_of_fame() TO anon, authenticated, service_role;
