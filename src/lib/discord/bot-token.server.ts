/** Server-only helpers for Discord bot authentication. */

export function getDiscordBotToken(): string | null {
  const raw = process.env.DISCORD_BOT_TOKEN ?? process.env.DISCORD_TOKEN ?? "";
  const token = raw
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^Bot\s+/i, "")
    .replace(/\s+/g, "");

  return token.length >= 10 ? token : null;
}
