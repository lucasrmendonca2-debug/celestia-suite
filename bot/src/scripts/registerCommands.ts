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

  /**
   * Limpa comandos guild-scoped residuais.
   * - Se CLEAR_GUILD_IDS estiver definido, usa essa lista.
   * - Caso contrário, busca TODAS as guilds em que o bot está e limpa cada uma.
   *   Isso garante que após um deploy global não restem duplicatas de uma
   *   execução antiga em modo DEV.
   */
  async function clearGuildResiduals() {
    const explicit = (process.env.CLEAR_GUILD_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let guildIds: string[] = explicit;
    if (guildIds.length === 0) {
      try {
        const guilds = (await rest.get(Routes.userGuilds())) as Array<{ id: string; name: string }>;
        guildIds = guilds.map((g) => g.id);
        logger.info(`🔍 Detectadas ${guildIds.length} guilds para limpeza de comandos residuais`);
      } catch (err) {
        logger.warn({ err }, "Não foi possível listar guilds — pulando limpeza automática");
        return;
      }
    }

    for (const gid of guildIds) {
      await rest
        .put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, gid), { body: [] })
        .then(() => logger.info(`🧹 Guild ${gid} limpa`))
        .catch((err) => logger.warn({ err, gid }, "Falha ao limpar guild (sem permissão?)"));
    }
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
    // Em PROD: limpa qualquer guild-scoped residual ANTES de publicar global.
    await clearGuildResiduals();
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
    logger.info(`✅ ${body.length} comandos registrados globalmente (pode levar ~1h pra propagar 100%)`);
  }
}

main().catch((err) => {
  logger.error({ err }, "Falha ao registrar comandos");
  process.exit(1);
});
