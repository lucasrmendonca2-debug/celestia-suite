import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  Collection,
  PermissionResolvable,
  Client,
} from "discord.js";

export type SlashBuilder =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder
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
  /** Marca o comando como exclusivo do Zenox Premium (indicativo no /help). */
  premium?: boolean;
  /** Descrição estendida usada pelo /help. Fallback: data.description. */
  longDescription?: string;
  /** Exemplos opcionais para o /help. */
  examples?: string[];
  /** Está habilitado por padrão em servidores novos. */
  enabledByDefault?: boolean;
  /** Pode ser configurado por servidor no dashboard (ativar/desativar, cargos, canais). */
  dashboardConfigurable?: boolean;
  /** Apenas servidores premium podem usar. */
  premiumGuildOnly?: boolean;
  /** Apenas usuários VIP podem usar. */
  vipOnly?: boolean;
  /** Apenas staff (configurado pelo servidor) pode usar. */
  staffOnly?: boolean;
  /** Módulo lógico do comando (subagrupamento dentro da categoria). */
  module?: string;
  execute: (interaction: ChatInputCommandInteraction, ctx: CommandContext) => Promise<unknown>;
  /** Handler opcional para autocomplete de opções. */
  autocomplete?: (interaction: AutocompleteInteraction, ctx: CommandContext) => Promise<unknown>;
}

export interface CommandContext {
  client: ZenoxClient;
}

export interface ZenoxClient extends Client {
  commands: Collection<string, SlashCommand>;
}
