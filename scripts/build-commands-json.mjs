// Gera src/data/commands.json a partir dos comandos reais do bot.
//
// Regras:
//  - Arquivos `_*.ts` (ex.: _factory.ts) e `index.ts` NÃO são comandos por
//    si só, mas podem definir comandos via factory `export const X = build("name", "desc")`.
//  - Re-exports (`export { X as default } from "./_factory.js"`) são ignorados:
//    o nome real é capturado a partir do `build("name", ...)` no arquivo factory.
//  - Comandos inline usam `new SlashCommandBuilder().setName("x").setDescription("y")`.
//  - Para evitar pegar `setName` de OPÇÕES, capturamos o `setName` que segue
//    `new SlashCommandBuilder()` (o primeiro depois do construtor).
//  - Sempre imprime um relatório com encontrados/duplicados.

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = "bot/src/bot/commands";
const OUT = "src/data/commands.json";

/** @type {Array<{ name: string; description: string; category: string; file: string }>} */
const found = [];
let scannedFiles = 0;
let skippedReexports = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (entry.endsWith(".ts")) parse(p);
  }
}

function parse(file) {
  scannedFiles++;
  const name = basename(file);
  const category = file.split("/").slice(-2, -1)[0];
  const src = readFileSync(file, "utf8");
  const isAuxiliary = name.startsWith("_") || name === "index.ts";

  // 1) Factory pattern: `build("commandname", "description", ...)`.
  //    Vale para arquivos auxiliares (_factory.ts) e também para qualquer
  //    arquivo que use build() — mas evitamos duplicar com inline.
  const buildRe = /\bbuild\(\s*["'`]([a-z0-9_-]+)["'`]\s*,\s*["'`]([^"'`]+)["'`]/g;
  let m;
  let factoryHits = 0;
  while ((m = buildRe.exec(src)) !== null) {
    found.push({ name: m[1], description: m[2], category, file });
    factoryHits++;
  }

  if (isAuxiliary) {
    // Auxiliares: SÓ contribuem via factory. Nunca extraímos `setName` deles
    // (a `_factory.ts` usa `setName(action)` com variável + setName de opções).
    return;
  }

  // 2) Re-export `export { X as default } from "./_factory.js"` → pula
  //    (o nome real virá do build() do factory).
  if (/export\s*\{\s*\w+\s+as\s+default\s*\}\s*from/.test(src)) {
    skippedReexports++;
    return;
  }

  // 3) Inline: pega o setName que vem DEPOIS de `new SlashCommandBuilder()`
  //    e antes do próximo `.addXxxOption` (escopo do comando raiz).
  const builderIdx = src.indexOf("new SlashCommandBuilder(");
  if (builderIdx === -1) {
    if (factoryHits === 0) {
      // Sem builder e sem factory → não é um comando.
    }
    return;
  }
  const tail = src.slice(builderIdx);
  // setName do COMANDO: primeiro setName que aparece antes de qualquer
  // .addXxxOption / .addSubcommand / addSubcommandGroup.
  const optionIdx = tail.search(/\.add(?:Subcommand(?:Group)?|\w+Option)\b/);
  const scope = optionIdx === -1 ? tail : tail.slice(0, optionIdx);
  const nameMatch = scope.match(/\.setName\(\s*["'`]([a-z0-9_-]+)["'`]\s*\)/);
  const descMatch = scope.match(/\.setDescription\(\s*["'`]([^"'`]+)["'`]\s*\)/);
  if (!nameMatch) return;
  found.push({
    name: nameMatch[1],
    description: descMatch?.[1] ?? "",
    category,
    file,
  });
}

walk(ROOT);

// Dedup + relatório de duplicados.
const byName = new Map();
const duplicates = [];
for (const c of found) {
  if (byName.has(c.name)) {
    duplicates.push({ name: c.name, files: [byName.get(c.name).file, c.file] });
    continue;
  }
  byName.set(c.name, c);
}

const out = [...byName.values()]
  .map(({ file: _f, ...rest }) => rest)
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

writeFileSync(OUT, JSON.stringify(out, null, 2));

// Relatório.
const byCategory = out.reduce((acc, c) => {
  acc[c.category] = (acc[c.category] ?? 0) + 1;
  return acc;
}, {});

console.log(`\n📋 Catálogo de comandos`);
console.log(`   arquivos escaneados : ${scannedFiles}`);
console.log(`   re-exports ignorados: ${skippedReexports}`);
console.log(`   comandos no catálogo: ${out.length}`);
console.log(`   por categoria       : ${JSON.stringify(byCategory)}`);
if (duplicates.length) {
  console.error(`\n⚠️  Comandos duplicados detectados:`);
  for (const d of duplicates) console.error(`   - ${d.name}: ${d.files.join(" + ")}`);
  process.exit(1);
}
console.log(`✅ Sem duplicados. Gerado em ${OUT}\n`);
