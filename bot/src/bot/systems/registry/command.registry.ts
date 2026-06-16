/**
 * Command Registry — fonte única de metadados dos comandos.
 *
 * Lê os comandos carregados em `client.commands` e expõe uma API
 * uniforme para `/help`, dashboard e sistema de permissões.
 */
import type { PermissionResolvable } from "discord.js";
import type { SlashCommand, ZenoxClient } from "../../../types/command.js";
import { HELP_CATEGORIES, type HelpCategoryKey } from "../../commands/utility/help.js";

export interface CommandMeta {
  name: string;
  category: HelpCategoryKey;
  module?: string;
  description: string;
  longDescription?: string;
  examples: string[];
  cooldown: number;
  requiredPermissions: PermissionResolvable[];
  requiredBotPermissions: PermissionResolvable[];
  ownerOnly: boolean;
  guildOnly: boolean;
  premiumOnly: boolean;
  premiumGuildOnly: boolean;
  vipOnly: boolean;
  staffOnly: boolean;
  enabledByDefault: boolean;
  dashboardConfigurable: boolean;
  subcommands: string[];
  options: string[];
}

function extractSubcommands(cmd: SlashCommand): string[] {
  const json = cmd.data.toJSON() as { options?: { type: number; name: string }[] };
  if (!json.options) return [];
  // SUB_COMMAND = 1, SUB_COMMAND_GROUP = 2
  return json.options
    .filter((o) => o.type === 1 || o.type === 2)
    .map((o) => o.name);
}

function extractOptions(cmd: SlashCommand): string[] {
  const json = cmd.data.toJSON() as { options?: { type: number; name: string }[] };
  if (!json.options) return [];
  return json.options.filter((o) => o.type !== 1 && o.type !== 2).map((o) => o.name);
}

export function toMeta(cmd: SlashCommand): CommandMeta {
  const json = cmd.data.toJSON();
  return {
    name: json.name,
    category: cmd.category as HelpCategoryKey,
    module: cmd.module,
    description: json.description ?? "",
    longDescription: cmd.longDescription,
    examples: cmd.examples ?? [],
    cooldown: cmd.cooldown ?? 0,
    requiredPermissions: cmd.userPermissions ?? [],
    requiredBotPermissions: cmd.botPermissions ?? [],
    ownerOnly: !!cmd.ownerOnly,
    guildOnly: !!cmd.guildOnly,
    premiumOnly: !!cmd.premium,
    premiumGuildOnly: !!cmd.premiumGuildOnly,
    vipOnly: !!cmd.vipOnly,
    staffOnly: !!cmd.staffOnly,
    enabledByDefault: cmd.enabledByDefault ?? true,
    dashboardConfigurable: cmd.dashboardConfigurable ?? true,
    subcommands: extractSubcommands(cmd),
    options: extractOptions(cmd),
  };
}

export function getRegistry(client: ZenoxClient): CommandMeta[] {
  return [...client.commands.values()].map(toMeta).sort((a, b) => a.name.localeCompare(b.name));
}

export function getByCategory(client: ZenoxClient, category: HelpCategoryKey): CommandMeta[] {
  return getRegistry(client).filter((c) => c.category === category);
}

export function findCommand(client: ZenoxClient, name: string): CommandMeta | null {
  const n = name.toLowerCase().replace(/^\//, "").trim();
  const cmd = client.commands.get(n);
  return cmd ? toMeta(cmd) : null;
}

export function searchCommands(client: ZenoxClient, query: string, limit = 10): CommandMeta[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return getRegistry(client)
    .filter(
      (c) =>
        c.name.includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.subcommands.some((s) => s.includes(q)) ||
        (c.module?.toLowerCase().includes(q) ?? false),
    )
    .slice(0, limit);
}

export function getCategories() {
  return HELP_CATEGORIES;
}
