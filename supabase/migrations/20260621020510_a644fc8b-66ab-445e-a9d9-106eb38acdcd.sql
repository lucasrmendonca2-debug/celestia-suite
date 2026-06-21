
-- Public read access to premium_plans (already has policy USING true; just needs GRANT)
GRANT SELECT ON public.premium_plans TO anon, authenticated;
GRANT ALL ON public.premium_plans TO service_role;

-- Aggregated public stats function (no row exposure on bot_guild_presence)
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE (
  servers_present bigint,
  total_members bigint,
  last_heartbeat timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE present)::bigint AS servers_present,
    COALESCE(SUM(member_count) FILTER (WHERE present), 0)::bigint AS total_members,
    MAX(last_seen_at) AS last_heartbeat
  FROM public.bot_guild_presence
$$;

REVOKE ALL ON FUNCTION public.get_public_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated, service_role;
