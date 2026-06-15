import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import type { ClientEvents } from "discord.js";
import type { ZenoxClient } from "../../types/command.js";
import { logger } from "../utils/logger.js";

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: ZenoxClient, ...args: ClientEvents[K]) => Promise<void> | void;
}

export async function loadEvents(client: ZenoxClient): Promise<void> {
  const base = resolve(new URL(".", import.meta.url).pathname, "..", "events");
  let count = 0;
  for (const file of readdirSync(base)) {
    if (!/\.(ts|js)$/.test(file)) continue;
    const mod = (await import(pathToFileURL(join(base, file)).href)) as {
      default?: BotEvent;
    };
    const ev = mod.default;
    if (!ev?.name) continue;
    const handler = (...args: unknown[]) =>
      Promise.resolve(ev.execute(client, ...(args as ClientEvents[typeof ev.name]))).catch((err) =>
        logger.error({ err, event: ev.name }, "Erro no handler de evento"),
      );
    if (ev.once) client.once(ev.name, handler);
    else client.on(ev.name, handler);
    count++;
  }
  logger.info(`🎧 ${count} eventos registrados`);
}
