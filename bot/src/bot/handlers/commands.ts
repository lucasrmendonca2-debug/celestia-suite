import { readdirSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import { Collection } from "discord.js";
import type { SlashCommand, ZenoxClient } from "../../types/command.js";
import { logger } from "../utils/logger.js";

/** Walk recursively and return every .ts/.js leaf file. */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|js)$/.test(entry) && !entry.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

export async function loadCommands(client: ZenoxClient): Promise<SlashCommand[]> {
  client.commands = new Collection();
  const base = resolve(new URL(".", import.meta.url).pathname, "..", "commands");
  const files = walk(base);
  const list: SlashCommand[] = [];

  for (const file of files) {
    try {
      const mod = (await import(pathToFileURL(file).href)) as { default?: SlashCommand };
      const cmd = mod.default;
      if (!cmd?.data) {
        logger.warn({ file }, "Comando sem export default — ignorado");
        continue;
      }
      client.commands.set(cmd.data.name, cmd);
      list.push(cmd);
    } catch (err) {
      logger.error({ err, file }, "Falha ao carregar comando");
    }
  }
  logger.info(`📦 ${list.length} comandos carregados`);
  return list;
}
