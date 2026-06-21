GRANT SELECT, INSERT, UPDATE, DELETE ON public.temporary_actions TO authenticated;
GRANT ALL ON public.temporary_actions TO service_role;
ALTER TABLE public.temporary_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role full access" ON public.temporary_actions FOR ALL TO service_role USING (true) WITH CHECK (true);