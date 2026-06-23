
DROP VIEW IF EXISTS public.guild_shop_view;
CREATE VIEW public.guild_shop_view
WITH (security_invoker = true) AS
SELECT
  c.*,
  CASE WHEN c.guild_exclusive_id IS NOT NULL THEN c.guild_exclusive_id ELSE NULL END AS scope_guild_id
FROM public.profile_cosmetics c
WHERE c.active = true
  AND (c.available_from IS NULL OR c.available_from <= now())
  AND (c.available_until IS NULL OR c.available_until > now());

GRANT SELECT ON public.guild_shop_view TO anon, authenticated, service_role;
