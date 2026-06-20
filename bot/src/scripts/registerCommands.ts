/**
 * Registra todos os slash commands no Discord.
 *
 *   bun run register          → registra no DEV_GUILD (instantâneo)
 *   sem DEV_GUILD definido    → registra globalmente (pode levar ~1h)
 */
import { REST, Routes, Collection } from "discord.js";
import { env } from "../config/env.js";
import { loadCommands } from "../bot/handlers/commands.js";
import { logger } from "../bot/utils/logger.js";
import type { ZenoxClient } from "../types/command.js";

async function main() {
  const fakeClient = { commands: new Collection() } as unknown as ZenoxClient;
  const cmds = await loadCommands(fakeClient);
  const body = cmds.map((c) => c.data.toJSON());

  // Detecta duplicatas locais antes de enviar pro Discord.
  const names = body.map((b) => b.name);
  const dups = names.filter((n, i) => names.indexOf(n) !== i);
  if (dups.length) {
    logger.error({ dups }, "❌ Comandos duplicados detectados — corrija antes de registrar");
    process.exit(1);
  }

  const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

  // Limpa guild commands residuais informados em CLEAR_GUILD_IDS="id1,id2,..."
  const clearGuilds = (process.env.CLEAR_GUILD_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const gid of clearGuilds) {
    await rest
      .put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, gid), { body: [] })
      .then(() => logger.info(`🧹 Comandos da guild ${gid} limpos`))
      .catch((err) => logger.warn({ err, gid }, "Falha ao limpar guild"));
  }

  if (env.DISCORD_DEV_GUILD_ID) {
    // Em DEV: limpa globais (que demoram ~1h pra propagar e causam duplicação visível).
    await rest
      .put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: [] })
      .then(() => logger.info("🧹 Comandos globais limpos (modo DEV)"))
      .catch((err) => logger.warn({ err }, "Falha ao limpar globais (segue mesmo assim)"));
    await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID), { body });
    logger.info(`✅ ${body.length} comandos registrados no guild ${env.DISCORD_DEV_GUILD_ID}`);
  } else {
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
    logger.info(`✅ ${body.length} comandos registrados globalmente (pode levar ~1h)`);
    logger.info(
      "Se aparecerem comandos duplicados, rode com CLEAR_GUILD_IDS=<id> para apagar registros residuais por guild.",
    );
  }
}

main().catch((err) => {
  logger.error({ err }, "Falha ao registrar comandos");
  process.exit(1);
});
