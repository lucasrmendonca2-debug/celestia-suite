
-- ===================== COMMUNITY: POLLS =====================
CREATE TABLE IF NOT EXISTS public.community_config (
  guild_id text PRIMARY KEY,
  polls_enabled boolean NOT NULL DEFAULT true,
  polls_log_channel_id text,
  polls_max_options integer NOT NULL DEFAULT 10,
  polls_allow_anonymous boolean NOT NULL DEFAULT false,
  suggestions_enabled boolean NOT NULL DEFAULT true,
  suggestions_channel_id text,
  suggestions_log_channel_id text,
  suggestions_require_reason boolean NOT NULL DEFAULT false,
  suggestions_allow_anonymous boolean NOT NULL DEFAULT false,
  suggestions_allow_voting boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_config TO authenticated;
GRANT ALL ON public.community_config TO service_role;
ALTER TABLE public.community_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_config service all"
  ON public.community_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "community_config authed read"
  ON public.community_config FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_community_config_updated_at BEFORE UPDATE ON public.community_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===================== POLLS =====================
CREATE TABLE IF NOT EXISTS public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  channel_id text NOT NULL,
  message_id text,
  question text NOT NULL,
  options jsonb NOT NULL,
  anonymous boolean NOT NULL DEFAULT false,
  multiple_choice boolean NOT NULL DEFAULT false,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS polls_guild_status_idx ON public.polls(guild_id, status);
CREATE INDEX IF NOT EXISTS polls_ends_at_idx ON public.polls(ends_at) WHERE status = 'ACTIVE';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT ALL ON public.polls TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls service all" ON public.polls FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "polls authed read" ON public.polls FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_polls_updated_at BEFORE UPDATE ON public.polls
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  guild_id text NOT NULL,
  user_id text NOT NULL,
  option_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id, option_index)
);
CREATE INDEX IF NOT EXISTS poll_votes_poll_idx ON public.poll_votes(poll_id);

GRANT SELECT, INSERT, DELETE ON public.poll_votes TO authenticated;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll_votes service all" ON public.poll_votes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "poll_votes authed read" ON public.poll_votes FOR SELECT TO authenticated USING (true);

-- ===================== SUGGESTIONS =====================
CREATE TABLE IF NOT EXISTS public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  channel_id text NOT NULL,
  message_id text,
  author_id text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  staff_response text,
  decided_by text,
  decision_reason text,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS suggestions_guild_status_idx ON public.suggestions(guild_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suggestions TO authenticated;
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suggestions service all" ON public.suggestions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "suggestions authed read" ON public.suggestions FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_suggestions_updated_at BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.suggestion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  guild_id text NOT NULL,
  user_id text NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('UP','DOWN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (suggestion_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suggestion_votes TO authenticated;
GRANT ALL ON public.suggestion_votes TO service_role;
ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suggestion_votes service all" ON public.suggestion_votes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "suggestion_votes authed read" ON public.suggestion_votes FOR SELECT TO authenticated USING (true);
