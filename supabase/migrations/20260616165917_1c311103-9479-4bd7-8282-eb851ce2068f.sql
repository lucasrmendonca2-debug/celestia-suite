
CREATE TABLE public.ticket_quick_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, slug)
);
GRANT SELECT ON public.ticket_quick_replies TO anon, authenticated;
GRANT ALL ON public.ticket_quick_replies TO service_role;
ALTER TABLE public.ticket_quick_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quick_replies_read" ON public.ticket_quick_replies FOR SELECT USING (true);
CREATE POLICY "quick_replies_service" ON public.ticket_quick_replies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER ticket_quick_replies_touch BEFORE UPDATE ON public.ticket_quick_replies FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX ticket_quick_replies_guild_idx ON public.ticket_quick_replies (guild_id);

CREATE TABLE public.mod_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  case_number INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by TEXT,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
GRANT SELECT ON public.mod_appeals TO anon, authenticated;
GRANT ALL ON public.mod_appeals TO service_role;
ALTER TABLE public.mod_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appeals_read" ON public.mod_appeals FOR SELECT USING (true);
CREATE POLICY "appeals_service" ON public.mod_appeals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TRIGGER mod_appeals_touch BEFORE UPDATE ON public.mod_appeals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX mod_appeals_guild_user_idx ON public.mod_appeals (guild_id, user_id);
CREATE INDEX mod_appeals_status_idx ON public.mod_appeals (guild_id, status);
