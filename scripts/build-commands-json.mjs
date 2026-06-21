import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "bot/src/bot/commands";
const out = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (entry.endsWith(".ts") && entry !== "index.ts") parse(p);
  }
}

function parse(file) {
  const src = readFileSync(file, "utf8");
  const category = file.split("/").slice(-2, -1)[0];
  // SlashCommandBuilder().setName("x").setDescription("y")
  const nameMatch = src.match(/setName\(\s*["'`]([a-z0-9_-]+)["'`]\s*\)/);
  const descMatch = src.match(/setDescription\(\s*["'`]([^"'`]+)["'`]\s*\)/);
  if (!nameMatch) return;
  out.push({
    name: nameMatch[1],
    description: descMatch?.[1] ?? "",
    category,
  });
}

walk(ROOT);
out.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
writeFileSync("src/data/commands.json", JSON.stringify(out, null, 2));
console.log("Generated", out.length, "commands");
