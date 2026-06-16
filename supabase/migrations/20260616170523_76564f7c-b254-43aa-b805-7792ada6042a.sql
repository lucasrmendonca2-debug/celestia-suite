
CREATE TABLE public.economy_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.economy_transactions TO anon, authenticated;
GRANT ALL ON public.economy_transactions TO service_role;
ALTER TABLE public.economy_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx_read" ON public.economy_transactions FOR SELECT USING (true);
CREATE INDEX economy_tx_guild_user_idx ON public.economy_transactions (guild_id, user_id, created_at DESC);

CREATE TABLE public.economy_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  kind TEXT NOT NULL,
  goal INTEGER NOT NULL DEFAULT 1,
  reward BIGINT NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, slug)
);
GRANT SELECT ON public.economy_missions TO anon, authenticated;
GRANT ALL ON public.economy_missions TO service_role;
ALTER TABLE public.economy_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions_read" ON public.economy_missions FOR SELECT USING (true);
CREATE TRIGGER economy_missions_touch BEFORE UPDATE ON public.economy_missions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.user_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.economy_missions(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guild_id, user_id, mission_id, period_start)
);
GRANT SELECT ON public.user_missions TO anon, authenticated;
GRANT ALL ON public.user_missions TO service_role;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_missions_read" ON public.user_missions FOR SELECT USING (true);
CREATE TRIGGER user_missions_touch BEFORE UPDATE ON public.user_missions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX user_missions_guild_user_idx ON public.user_missions (guild_id, user_id, period_start);
