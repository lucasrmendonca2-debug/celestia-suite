import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { env } from "./config/env.js";
import { logger } from "./bot/utils/logger.js";
import { loadCommands } from "./bot/handlers/commands.js";
import { loadEvents } from "./bot/handlers/events.js";
import { startSchedulers } from "./bot/systems/scheduler.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import type { ZenoxClient } from "./types/command.js";

async function bootstrap() {
  await connectDatabase();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
  }) as ZenoxClient;

  client.commands = new Collection();

  await loadCommands(client);
  await loadEvents(client);

  client.on("error", (err) => logger.error({ err }, "Discord client error"));
  client.on("shardError", (err) => logger.error({ err }, "Shard error"));

  process.on("unhandledRejection", (err) => logger.error({ err }, "unhandledRejection"));
  process.on("uncaughtException", (err) => logger.error({ err }, "uncaughtException"));

  await client.login(env.DISCORD_TOKEN);
  startSchedulers(client);

  const shutdown = async (sig: string) => {
    logger.info({ sig }, "Encerrando bot...");
    await client.destroy();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void bootstrap();
