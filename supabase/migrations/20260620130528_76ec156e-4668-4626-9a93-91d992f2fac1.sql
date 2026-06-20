GRANT SELECT, INSERT, UPDATE, DELETE ON public.premium_subscriptions TO anon, authenticated;
GRANT ALL ON public.premium_subscriptions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.temporary_actions TO anon, authenticated;
GRANT ALL ON public.temporary_actions TO service_role;