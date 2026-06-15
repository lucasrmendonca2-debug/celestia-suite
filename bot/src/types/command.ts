import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  Collection,
  PermissionResolvable,
  Client,
} from "discord.js";

export type SlashBuilder =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

export interface SlashCommand {
  data: SlashBuilder;
  /** Categoria para o /help */
  category:
    | "moderation"
    | "tickets"
    | "vip"
    | "economy"
    | "level"
    | "fun"
    | "interaction"
    | "events"
    | "utility"
    | "config"
    | "admin";
  /** Cooldown em segundos (por usuário/comando/servidor). */
  cooldown?: number;
  /** Permissões do membro requeridas. */
  userPermissions?: PermissionResolvable[];
  /** Permissões que o bot precisa. */
  botPermissions?: PermissionResolvable[];
  /** Apenas dono do bot. */
  ownerOnly?: boolean;
  /** Apenas em servidor (guild). */
  guildOnly?: boolean;
  execute: (interaction: ChatInputCommandInteraction, ctx: CommandContext) => Promise<void>;
}

export interface CommandContext {
  client: ZenoxClient;
}

export interface ZenoxClient extends Client {
  commands: Collection<string, SlashCommand>;
}
