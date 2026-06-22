/**
 * Upserts the new Zenox character banners into profile_cosmetics,
 * reading URLs from existing .asset.json pointer files in src/assets/cosmetics/.
 *
 * Run: bun tools/cosmetics/upsert-new-banners.ts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { BANNERS } from "./prompts";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const PTR_DIR = "src/assets/cosmetics";

const TARGET_SLUGS = BANNERS.filter((b) => b.slug.startsWith("banner-zenox-")).map((b) => b.slug);

let okCount = 0;
let skipCount = 0;
for (const slug of TARGET_SLUGS) {
  const ptrPath = `${PTR_DIR}/${slug}.png.asset.json`;
  let url: string;
  try {
    const json = JSON.parse(readFileSync(ptrPath, "utf8")) as { url: string };
    url = json.url;
  } catch {
    console.log(`  ⚠ skip ${slug} — no pointer file at ${ptrPath}`);
    skipCount++;
    continue;
  }
  const item = BANNERS.find((b) => b.slug === slug)!;
  const { error } = await supabase.from("profile_cosmetics").upsert(
    {
      slug: item.slug,
      name: item.name,
      description: item.description,
      type: item.type,
      rarity: item.rarity,
      price_coins: item.price,
      image_url: url,
      preview_url: url,
      collection: "starter",
      active: true,
      metadata: { generated: true, generator_version: 2 },
    },
    { onConflict: "slug" },
  );
  if (error) {
    console.log(`  ✗ ${slug}: ${error.message}`);
  } else {
    console.log(`  ✓ ${slug}`);
    okCount++;
  }
}
console.log(`\nDone. ${okCount} upserted, ${skipCount} skipped.`);
