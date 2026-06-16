-- Fix: SECURITY DEFINER function exposed
DROP FUNCTION IF EXISTS public.next_case_number(text);

CREATE OR REPLACE FUNCTION public.next_case_number(_guild_id text)
RETURNS int
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(case_number), 0) + 1
  FROM public.mod_cases
  WHERE guild_id = _guild_id;
$$;

REVOKE ALL ON FUNCTION public.next_case_number(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_case_number(text) TO service_role;

-- Fix: SECURITY DEFINER view -> use security_invoker
DROP VIEW IF EXISTS public.moderation_stats_30d;

CREATE VIEW public.moderation_stats_30d
WITH (security_invoker = true) AS
SELECT
  guild_id,
  moderator_id,
  action,
  COUNT(*) AS total
FROM public.mod_cases
WHERE created_at >= now() - interval '30 days'
GROUP BY guild_id, moderator_id, action;

GRANT SELECT ON public.moderation_stats_30d TO authenticated;
GRANT ALL ON public.moderation_stats_30d TO service_role;