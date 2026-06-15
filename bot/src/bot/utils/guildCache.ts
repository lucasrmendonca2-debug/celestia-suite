import type { Guild as DiscordGuild } from "discord.js";
import { Guild, GuildConfig, User } from "../../database/models.js";

export async function ensureGuild(guild: DiscordGuild) {
  await Guild.updateOne(
    { _id: guild.id },
    { $set: { name: guild.name }, $setOnInsert: { _id: guild.id } },
    { upsert: true },
  );
  await GuildConfig.updateOne({ guildId: guild.id }, { $setOnInsert: { guildId: guild.id } }, { upsert: true });
}

export async function getConfig(guildId: string) {
  let cfg = await GuildConfig.findOne({ guildId });
  if (!cfg) cfg = await GuildConfig.create({ guildId });
  return cfg;
}

export async function ensureUser(id: string, username?: string | null) {
  await User.updateOne(
    { _id: id },
    {
      $set: { ...(username ? { username } : {}) },
      $setOnInsert: { _id: id },
    },
    { upsert: true },
  );
}
