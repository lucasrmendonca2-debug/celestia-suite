import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { BANNERS } from './prompts'

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const slugs = [
  'banner-zenox-shinobi-redmoon',
  'banner-zenox-blueflame-exorcist',
  'banner-zenox-touge-racer',
  'banner-zenox-ice-mage',
  'banner-zenox-cardmaster',
  'banner-zenox-sky-whale',
  'banner-zenox-demon-prince',
  'banner-zenox-samurai-rain',
]

for (const slug of slugs) {
  const item = BANNERS.find((b) => b.slug === slug)
  if (!item) throw new Error(`Missing prompt for ${slug}`)

  const pointer = JSON.parse(
    readFileSync(`src/assets/cosmetics/${slug}.png.asset.json`, 'utf8'),
  ) as { url: string }

  const { error } = await sb.from('profile_cosmetics').upsert(
    {
      slug: item.slug,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      price_coins: item.price,
      image_url: pointer.url,
      preview_url: pointer.url,
      collection: 'starter',
      active: true,
      metadata: { generated: true, generator_version: 3 },
    },
    { onConflict: 'slug' },
  )

  if (error) throw error
  console.log('OK', slug)
}
