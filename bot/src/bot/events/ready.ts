import { ActivityType } from "discord.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { BotEvent } from "../handlers/events.js";
import { logger } from "../utils/logger.js";
import { ensureGuild } from "../utils/guildCache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, "../../../assets");
const STREAM_URL = "https://twitch.tv/discord";

const PRESENCES = [
  "✨ /help • cuidando do seu server",
  "🎫 abrindo tickets pra galera",
  "💜 zenoxbot.app • dashboard online",
  "🌙 sonhando com novos comandos",
  "⚡ moderação 24/7",
  "🎮 economy, levels e diversão",
  "🛡️ /automod ativo",
  "🎁 /giveaway rolando agora",
];

const event: BotEvent<"ready"> = {
  name: "ready",
  once: true,
  async execute(client) {
    logger.info(`✅ Logado como ${client.user?.tag} • ${client.guilds.cache.size} servidores`);

    // Avatar + banner (silencioso se rate-limited / já igual)
    try {
      const avatar = await readFile(path.join(ASSETS, "avatar.png"));
      await client.user?.setAvatar(avatar);
      logger.info("🖼️ Avatar atualizado");
    } catch (err) {
      logger.warn({ err }, "Não consegui atualizar o avatar");
    }
    try {
      const banner = await readFile(path.join(ASSETS, "banner.png"));
      // discord.js v14: setBanner existe via REST PATCH /users/@me
      await (client.user as unknown as { setBanner: (b: Buffer) => Promise<unknown> })
        .setBanner(banner);
      logger.info("🎨 Banner atualizado");
    } catch (err) {
      logger.warn({ err }, "Não consegui atualizar o banner");
    }

    let idx = 0;
    const rotate = () => {
      const name = PRESENCES[idx % PRESENCES.length]!;
      idx++;
      client.user?.setPresence({
        status: "online",
        activities: [{ name, type: ActivityType.Streaming, url: STREAM_URL }],
      });
    };
    rotate();
    setInterval(rotate, 20_000);

    for (const [, guild] of client.guilds.cache) {
      try {
        await ensureGuild(guild);
      } catch (err) {
        logger.error({ err, guildId: guild.id }, "ensureGuild");
      }
    }
  },
};

export default event;
