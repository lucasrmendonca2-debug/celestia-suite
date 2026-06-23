
-- Remove duplicatas antes de criar a unique (mantém a linha mais recente).
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY guild_id, level, reward_type
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.level_rewards
)
DELETE FROM public.level_rewards lr
USING ranked
WHERE lr.id = ranked.id AND ranked.rn > 1;

-- Unique necessária para o ON CONFLICT do upsert do bot.
CREATE UNIQUE INDEX IF NOT EXISTS level_rewards_guild_level_type_uniq
  ON public.level_rewards (guild_id, level, reward_type);
