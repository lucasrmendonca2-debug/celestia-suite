
-- Recria a view sem SECURITY DEFINER (usa permissões do usuário consultante)
DROP VIEW IF EXISTS public.cosmetic_shop_view;

CREATE VIEW public.cosmetic_shop_view
WITH (security_invoker = true)
AS
SELECT
  pc.id,
  pc.slug,
  pc.name,
  pc.description,
  pc.type,
  pc.rarity,
  pc.price_coins,
  pc.price_premium,
  pc.image_url,
  pc.preview_url,
  pc.collection,
  pc.vip_only,
  pc.available_until,
  pc.sort_order,
  pc.metadata,
  EXISTS(
    SELECT 1 FROM public.cosmetic_rotations cr
    WHERE cr.rotation_date = CURRENT_DATE AND pc.id = ANY(cr.daily_offers)
  ) AS is_on_offer,
  EXISTS(
    SELECT 1 FROM public.cosmetic_rotations cr
    WHERE cr.rotation_date = CURRENT_DATE AND pc.id = ANY(cr.rare_picks)
  ) AS is_rare_pick
FROM public.profile_cosmetics pc
WHERE pc.active = true
  AND (pc.available_from IS NULL OR pc.available_from <= now())
  AND (pc.available_until IS NULL OR pc.available_until > now());

GRANT SELECT ON public.cosmetic_shop_view TO anon, authenticated;

-- Políticas explícitas "negar para authenticated" nas tabelas internas
CREATE POLICY "Eventos de automação só pelo serviço"
  ON public.automation_events FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "Marcos só pelo serviço"
  ON public.guild_milestones FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "Rankings semanais só pelo serviço"
  ON public.weekly_rankings FOR SELECT
  TO authenticated
  USING (false);
