
CREATE OR REPLACE FUNCTION public.detect_guild_milestones(_guild_id TEXT, _member_count INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_milestone INT;
  v_created INT := 0;
  v_thresholds INT[] := ARRAY[100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
  v_first_seen TIMESTAMPTZ;
BEGIN
  FOREACH v_milestone IN ARRAY v_thresholds LOOP
    IF _member_count >= v_milestone THEN
      INSERT INTO public.guild_milestones (guild_id, milestone_type, milestone_value, reached_at, metadata)
      VALUES (_guild_id, 'member_count', v_milestone, now(),
              jsonb_build_object('current_members', _member_count))
      ON CONFLICT DO NOTHING;
      IF FOUND THEN v_created := v_created + 1; END IF;
    END IF;
  END LOOP;

  SELECT MIN(created_at) INTO v_first_seen
  FROM public.bot_guild_presence
  WHERE guild_id = _guild_id;

  IF v_first_seen IS NOT NULL
     AND extract(month from v_first_seen) = extract(month from now())
     AND extract(day from v_first_seen) = extract(day from now())
     AND extract(year from v_first_seen) < extract(year from now()) THEN
    INSERT INTO public.guild_milestones (guild_id, milestone_type, milestone_value, reached_at, metadata)
    VALUES (_guild_id, 'anniversary',
            (extract(year from now()) - extract(year from v_first_seen))::int,
            now(),
            jsonb_build_object('since', v_first_seen))
    ON CONFLICT DO NOTHING;
    IF FOUND THEN v_created := v_created + 1; END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'created', v_created);
END;
$$;
