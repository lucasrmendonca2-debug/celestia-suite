/**
 * Gerador de coleção inicial de cosméticos.
 *
 * Para cada prompt do catálogo:
 *  1. Verifica se o slug já existe em profile_cosmetics (idempotente)
 *  2. Gera imagem via Lovable AI Gateway (google/gemini-3.1-flash-image-preview)
 *  3. Roda QA tripla (composição, ausência de texto/artefatos, fit temático)
 *     em 3 chamadas Gemini Vision independentes
 *  4. Se 3/3 passarem → upload via lovable-assets CLI → insert em DB
 *  5. Se algum falhar → 1 retry; depois desiste e registra como skipped
 *
 * Uso:
 *   bun tools/cosmetics/generate.ts banner       # só banners
 *   bun tools/cosmetics/generate.ts frame
 *   bun tools/cosmetics/generate.ts sticker
 *   bun tools/cosmetics/generate.ts all          # tudo (rode em chunks!)
 *   bun tools/cosmetics/generate.ts all --limit=10
 *   bun tools/cosmetics/generate.ts all --slug=banner-aurora-boreal
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import { ALL_PROMPTS, type CosmeticPrompt } from "./prompts";

const GATEWAY = "https://ai.gateway.lovable.dev";
const LOVABLE_KEY = process.env.LOVABLE_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!LOVABLE_KEY || !SUPABASE_URL || !SR_KEY) {
  console.error("Faltam env vars (LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SR_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TMP_DIR = "/tmp/cosmetics-gen";
const PTR_DIR = "src/assets/cosmetics";
const PROGRESS_FILE = `${TMP_DIR}/progress.json`;
mkdirSync(TMP_DIR, { recursive: true });
mkdirSync(PTR_DIR, { recursive: true });

interface Progress {
  done: Record<string, { url: string; passed: number }>;
  failed: Record<string, string>;
}
let progress: Progress = { done: {}, failed: {} };
if (existsSync(PROGRESS_FILE)) {
  progress = JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
}
const saveProgress = () => writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

// -----------------------------------------------------------------------------
// 1) Image generation
// -----------------------------------------------------------------------------
async function generateImage(prompt: string): Promise<Buffer> {
  let lastErr = "";
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(`${GATEWAY}/v1/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (res.status === 429) {
      const wait = Math.min(60_000, 5_000 * 2 ** (attempt - 1));
      console.log(`    [429] backoff ${wait / 1000}s (attempt ${attempt}/5)`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`image gen ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error(`image gen: no b64_json (${JSON.stringify(json).slice(0, 200)})`);
    return Buffer.from(b64, "base64");
  }
  throw new Error(`image gen: rate-limited after 5 attempts (${lastErr})`);
}

// -----------------------------------------------------------------------------
// 2) Triple QA — três checks independentes via Gemini Vision
// -----------------------------------------------------------------------------
type QAResult = { pass: boolean; reason: string };

async function visionScore(b64: string, criterion: string, requirement: string): Promise<QAResult> {
  const res = await fetch(`${GATEWAY}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content:
            "You are a strict visual QA reviewer. Reply ONLY with a JSON object exactly like {\"pass\": true|false, \"reason\": \"short reason\"}. Be conservative: prefer to fail if any doubt.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Evaluate this image for criterion "${criterion}".\nRequirement: ${requirement}\nReturn JSON only.`,
            },
            { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } },
          ],
        },
      ],
      temperature: 0,
    }),
  });
  if (!res.ok) {
    return { pass: false, reason: `qa http ${res.status}` };
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  const m = text.match(/\{[\s\S]*?\}/);
  if (!m) return { pass: false, reason: `qa no json: ${text.slice(0, 80)}` };
  try {
    const parsed = JSON.parse(m[0]) as QAResult;
    return { pass: !!parsed.pass, reason: parsed.reason ?? "" };
  } catch {
    return { pass: false, reason: `qa parse: ${text.slice(0, 80)}` };
  }
}

async function tripleQA(img: Buffer, item: CosmeticPrompt): Promise<{ passed: number; reasons: string[] }> {
  const b64 = img.toString("base64");

  const checks: Array<[string, string]> = [
    [
      "no_text_or_watermark",
      "The image must contain NO readable text, NO letters forming words, NO watermarks, NO logos, NO signatures. Pass only if completely free of text-like content.",
    ],
    [
      "composition_quality",
      item.type === "frame"
        ? "The image must be a circular decorative frame/ring with an EMPTY hole in the center (at least 50% of the canvas in the middle must be empty/transparent/plain so an avatar fits). The decoration must form a clean ring shape."
        : item.type === "sticker"
          ? "The image must show a SINGLE clearly-defined icon/object centered on a plain background. No clutter, no multiple objects, no broken/distorted anatomy."
          : "The image must be a clean horizontal banner with balanced composition, no broken artifacts, no distorted elements, no faces or human figures.",
    ],
    [
      "thematic_fit",
      `The image must clearly depict: "${item.description}". Pass only if the main subject matches this theme.`,
    ],
  ];

  let passed = 0;
  const reasons: string[] = [];
  // Run checks in parallel
  const results = await Promise.all(checks.map(([c, r]) => visionScore(b64, c, r)));
  for (let i = 0; i < results.length; i++) {
    if (results[i].pass) passed++;
    else reasons.push(`[${checks[i][0]}] ${results[i].reason}`);
  }
  return { passed, reasons };
}

// -----------------------------------------------------------------------------
// 3) Upload via lovable-assets CLI
// -----------------------------------------------------------------------------
function uploadAsset(buffer: Buffer, slug: string): string {
  const tmpFile = `${TMP_DIR}/${slug}.png`;
  writeFileSync(tmpFile, buffer);
  const out = execSync(
    `lovable-assets create --file ${tmpFile} --filename ${slug}.png`,
    { encoding: "utf8" },
  );
  unlinkSync(tmpFile);
  const json = JSON.parse(out) as { url: string };
  // Persist pointer in the repo for traceability
  writeFileSync(`${PTR_DIR}/${slug}.png.asset.json`, out);
  return json.url;
}

// -----------------------------------------------------------------------------
// 4) Insert into DB
// -----------------------------------------------------------------------------
async function upsertCosmetic(item: CosmeticPrompt, url: string) {
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
      metadata: { generated: true, generator_version: 1 },
    },
    { onConflict: "slug" },
  );
  if (error) throw new Error(`db upsert: ${error.message}`);
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------
async function processOne(item: CosmeticPrompt): Promise<"done" | "skipped" | "failed"> {
  if (progress.done[item.slug]) return "skipped";

  // skip if already in DB
  const { data: existing } = await supabase
    .from("profile_cosmetics")
    .select("slug, image_url")
    .eq("slug", item.slug)
    .maybeSingle();
  if (existing && existing.image_url) {
    progress.done[item.slug] = { url: existing.image_url, passed: 3 };
    saveProgress();
    return "skipped";
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`  → gen ${item.slug} (attempt ${attempt})`);
      const img = await generateImage(item.prompt);
      const qa = await tripleQA(img, item);
      console.log(`    QA ${qa.passed}/3 ${qa.reasons.length ? "→ " + qa.reasons.join(" | ") : ""}`);
      if (qa.passed === 3) {
        const url = uploadAsset(img, item.slug);
        await upsertCosmetic(item, url);
        progress.done[item.slug] = { url, passed: qa.passed };
        delete progress.failed[item.slug];
        saveProgress();
        console.log(`    ✓ ${item.slug} → ${url}`);
        return "done";
      }
      if (attempt === 2) {
        // Accept 2/3 on retry as soft pass (still record but mark)
        if (qa.passed >= 2) {
          const url = uploadAsset(img, item.slug);
          await upsertCosmetic(item, url);
          progress.done[item.slug] = { url, passed: qa.passed };
          delete progress.failed[item.slug];
          saveProgress();
          console.log(`    ~ ${item.slug} (soft pass ${qa.passed}/3) → ${url}`);
          return "done";
        }
        progress.failed[item.slug] = qa.reasons.join(" | ");
        saveProgress();
        return "failed";
      }
    } catch (err) {
      console.error(`    ! ${item.slug} attempt ${attempt}: ${(err as Error).message}`);
      if (attempt === 2) {
        progress.failed[item.slug] = (err as Error).message;
        saveProgress();
        return "failed";
      }
    }
  }
  return "failed";
}

async function main() {
  const args = process.argv.slice(2);
  const which = args[0] ?? "all";
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const slugArg = args.find((a) => a.startsWith("--slug="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
  const slug = slugArg?.split("=")[1];

  let queue = ALL_PROMPTS;
  if (which !== "all") queue = queue.filter((p) => p.type === which);
  if (slug) queue = queue.filter((p) => p.slug === slug);
  queue = queue.slice(0, limit);

  console.log(`Processando ${queue.length} itens (which=${which})`);
  const t0 = Date.now();
  const counts = { done: 0, skipped: 0, failed: 0 };

  const CONCURRENCY = 1;
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const batch = queue.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((item) => processOne(item)));
    for (const r of results) counts[r]++;
    console.log(`-- progresso: ${i + batch.length}/${queue.length}  done=${counts.done} skipped=${counts.skipped} failed=${counts.failed}`);
  }

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("");
  console.log(`=== resumo (${dt}s) ===`);
  console.log(`done: ${counts.done}  skipped: ${counts.skipped}  failed: ${counts.failed}`);
  if (Object.keys(progress.failed).length) {
    console.log("failed slugs:");
    for (const [k, v] of Object.entries(progress.failed)) console.log(`  - ${k}: ${v.slice(0, 100)}`);
  }
}

main().catch((err) => {
  console.error("fatal", err);
  process.exit(1);
});
