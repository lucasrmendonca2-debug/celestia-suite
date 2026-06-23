/**
 * Mongoose-to-Supabase Shim (Fase 1B).
 *
 * Substitui o `bot/src/database/models.js` ausente por uma camada compatível
 * com a API Mongoose usada pelos comandos (`find`, `findOne`, `findOneAndUpdate`,
 * `updateOne`, `updateMany`, `create`, `deleteOne`, `countDocuments`, `findById`,
 * etc.) — ler/escrever Supabase por baixo.
 *
 * Limitações conhecidas (documentadas na Fase 1C, que vai eliminar este shim):
 *  - `$inc` é read-modify-write (não atômico). Para operações sensíveis
 *    (`/pay`, `/shop buy`, `/rob`) o caller deve usar a versão atômica em
 *    `systems/economy/economy.ts` (que será reescrita usando RPC dedicada).
 *  - `.sort()` aceita 1 chave; várias chaves seguem a primeira.
 *  - `.select()` é honrado só para tabelas que mapeiam coluna-a-coluna.
 *  - `Guild` e `User` (caches do Mongoose) viraram no-ops.
 *  - Campos não-mapeados no `GuildConfig` ficam em cache em memória do processo.
 */
import { supabase } from "./supabase.js";
import { logger } from "../bot/utils/logger.js";

// ------------------------------------------------------------------
// Field mapping
// ------------------------------------------------------------------

type FieldMap = Record<string, string>; // camelCase -> snake_case

interface ModelSchema {
  table: string;
  /** Mongoose camelCase → Supabase snake_case. Use null para campo virtual. */
  fields: FieldMap;
  /** Campos lidos do banco que devem ser convertidos em Date. */
  dateFields?: string[];
  /** Defaults aplicados ao criar um novo documento. */
  defaults?: Record<string, any>;
  /** Chave primária ("id" ou "composite"). */
  pk?: "id" | "composite";
  /** Campos compostos da PK (para upsert/onConflict). */
  pkFields?: string[];
  /** Hooks de tradução de campos virtuais (read/write). */
  virtuals?: {
    toDoc?: (row: any, doc: any) => void;
    toRow?: (doc: any, row: any) => void;
  };
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
}

function buildFieldMap(fields: string[]): FieldMap {
  const out: FieldMap = {};
  for (const f of fields) out[f] = camelToSnake(f);
  return out;
}

// ------------------------------------------------------------------
// Schemas
// ------------------------------------------------------------------

const ECONOMY: ModelSchema = {
  table: "user_economy",
  pk: "composite",
  pkFields: ["guild_id", "user_id"],
  fields: {
    guildId: "guild_id",
    userId: "user_id",
    wallet: "balance",
    bank: "bank",
    bankCap: "bank_cap",
    lastDaily: "last_daily_at",
    lastWork: "last_work_at",
    lastCrime: "last_crime_at",
    lastRob: "last_rob_at",
  },
  dateFields: ["lastDaily", "lastWork", "lastCrime", "lastRob"],
  defaults: { wallet: 0, bank: 0, bankCap: 10000 },
};

const INVENTORY: ModelSchema = {
  table: "inventory_items",
  fields: buildFieldMap(["guildId", "userId", "name", "quantity", "shopItemId", "metadata"]),
  defaults: { quantity: 0 },
};

const SHOP: ModelSchema = {
  table: "shop_items",
  fields: buildFieldMap(["guildId", "name", "description", "price", "type", "roleId", "stock", "enabled"]),
  defaults: { enabled: true, stock: -1, type: "ROLE" },
};

const MARRIAGE: ModelSchema = {
  table: "marriages",
  fields: {
    guildId: "guild_id",
    userA: "user_a_id",
    userB: "user_b_id",
    status: "status",
    marriedAt: "since",
    brokenAt: "broken_at",
    proposedBy: "proposed_by",
  },
  dateFields: ["marriedAt", "brokenAt"],
  defaults: { status: "MARRIED", guildId: "_global" },
};

const GIVEAWAY: ModelSchema = {
  table: "giveaways",
  fields: buildFieldMap([
    "guildId",
    "channelId",
    "messageId",
    "hostId",
    "prize",
    "winnersCount",
    "endsAt",
    "ended",
    "endedAt",
    "requirements",
    "participants",
    "winners",
  ]),
  dateFields: ["endsAt", "endedAt"],
  defaults: { ended: false, participants: [], winners: [], winnersCount: 1, requirements: {} },
};

const REMINDER: ModelSchema = {
  table: "reminders",
  fields: {
    userId: "user_id",
    guildId: "guild_id",
    channelId: "channel_id",
    message: "message",
    remindAt: "fire_at",
    delivered: "fired",
    deliveredAt: "fired_at",
  },
  dateFields: ["remindAt", "deliveredAt"],
  defaults: { delivered: false },
};

const ANNOUNCEMENT: ModelSchema = {
  table: "announcements",
  fields: {
    guildId: "guild_id",
    channelId: "channel_id",
    authorId: "author_id",
    content: "content",
    embed: "embed",
    scheduledAt: "scheduled_at",
    sentAt: "sent_at",
    messageId: "message_id",
  },
  dateFields: ["scheduledAt", "sentAt"],
  virtuals: {
    toDoc: (row, doc) => {
      doc.sent = !!row.sent_at;
    },
    toRow: (doc, row) => {
      if (doc.sent === true && !row.sent_at) row.sent_at = new Date().toISOString();
    },
  },
};

const AUTOMOD: ModelSchema = {
  table: "automod_incidents",
  fields: buildFieldMap(["guildId", "userId", "channelId", "type", "severity", "reason", "messageId", "detail"]),
};

const DAILY_TOKEN: ModelSchema = {
  table: "daily_tokens",
  fields: {
    userId: "user_id",
    guildId: "guild_id",
    token: "token",
    used: "used",
    usedAt: "used_at",
    expiresAt: "expires_at",
  },
  dateFields: ["usedAt", "expiresAt"],
  defaults: { used: false },
};

const COOLDOWN: ModelSchema = {
  table: "cooldowns",
  pk: "composite",
  pkFields: ["guild_id", "user_id", "command"],
  fields: buildFieldMap(["guildId", "userId", "command", "expiresAt"]),
  dateFields: ["expiresAt"],
};

const EMBED_TEMPLATE: ModelSchema = {
  table: "embed_templates",
  fields: buildFieldMap(["guildId", "name", "embed", "createdBy"]),
};

const CUSTOM_CMD: ModelSchema = {
  table: "custom_commands",
  fields: buildFieldMap([
    "guildId",
    "name",
    "description",
    "responseText",
    "embed",
    "requiredRoles",
    "enabled",
    "uses",
    "createdBy",
  ]),
  defaults: { enabled: true, uses: 0 },
};

const PUNISHMENT: ModelSchema = {
  table: "punishments",
  fields: buildFieldMap([
    "guildId",
    "userId",
    "username",
    "moderatorId",
    "moderatorName",
    "type",
    "reason",
    "durationSeconds",
    "expiresAt",
    "active",
    "metadata",
  ]),
  dateFields: ["expiresAt"],
  defaults: { active: true },
};

const LEVEL_ACCOUNT: ModelSchema = {
  table: "level_users",
  fields: buildFieldMap([
    "guildId",
    "userId",
    "username",
    "xp",
    "level",
    "totalXp",
    "messagesCount",
    "lastXpAt",
  ]),
  dateFields: ["lastXpAt"],
  defaults: { xp: 0, level: 0, totalXp: 0, messagesCount: 0 },
};

const TICKET: ModelSchema = {
  table: "tickets",
  fields: buildFieldMap([
    "guildId",
    "channelId",
    "userId",
    "username",
    "categoryId",
    "categoryName",
    "status",
    "priority",
    "claimedBy",
    "closedBy",
    "closeReason",
    "rating",
    "transcriptUrl",
    "closedAt",
    "claimedAt",
  ]),
  dateFields: ["closedAt", "claimedAt"],
};

const VIP: ModelSchema = {
  table: "premium_subscriptions",
  fields: {
    guildId: "guild_id",
    userId: "user_id",
    type: "type",
    tier: "notes",
    status: "status",
    startsAt: "starts_at",
    expiresAt: "expires_at",
    cancelledAt: "cancelled_at",
    planId: "plan_id",
  },
  dateFields: ["startsAt", "expiresAt", "cancelledAt"],
  defaults: { type: "VIP_USER", status: "ACTIVE" },
  virtuals: {
    toDoc: (row, doc) => {
      doc.active = row.status === "ACTIVE";
    },
    toRow: (doc, row) => {
      if (doc.active === false) row.status = "CANCELLED";
      if (doc.active === true) row.status = "ACTIVE";
    },
  },
};

const GUILD_CONFIG: ModelSchema = {
  table: "guild_configs",
  pk: "composite",
  pkFields: ["guild_id"],
  fields: {
    guildId: "guild_id",
    welcomeEnabled: "welcome_enabled",
    welcomeChannelId: "welcome_channel_id",
    welcomeMessage: "welcome_message",
    welcomeEmbedEnabled: "welcome_embed_enabled",
    welcomeEmbedColor: "welcome_embed_color",
    economyCurrencyName: "economy_currency_name",
    economyCurrencyEmoji: "economy_currency_emoji",
    vipRoleId: "vip_role_id",
    modLogChannelId: "mod_log_channel_id",
    messageLogChannelId: "message_log_channel_id",
    memberLogChannelId: "member_log_channel_id",
    serverLogChannelId: "server_log_channel_id",
  },
  defaults: {
    economyVipMultiplier: 1.5,
    economyWorkCooldownSeconds: 3600,
    economyWorkMin: 80,
    economyWorkMax: 320,
    economyDailyAmount: 250,
    economyEnabled: true,
  },
};

// ------------------------------------------------------------------
// Query/Doc helpers
// ------------------------------------------------------------------

type Filter = Record<string, any>;
type Update = Record<string, any>;

function isDate(v: any): v is Date {
  return v instanceof Date;
}

function rowToDoc(schema: ModelSchema, row: any): any {
  if (!row) return null;
  const inv: Record<string, string> = {};
  for (const [k, v] of Object.entries(schema.fields)) inv[v] = k;
  const doc: any = {};
  for (const [col, val] of Object.entries(row)) {
    const key = inv[col] ?? col;
    doc[key] = val;
    if (schema.dateFields?.includes(key) && typeof val === "string") doc[key] = new Date(val);
  }
  if (row.id !== undefined) doc._id = row.id;
  schema.virtuals?.toDoc?.(row, doc);
  // attach save()
  Object.defineProperty(doc, "save", {
    value: async () => saveDoc(schema, doc),
    enumerable: false,
  });
  Object.defineProperty(doc, "toObject", {
    value: () => ({ ...doc }),
    enumerable: false,
  });
  return doc;
}

function docToRow(schema: ModelSchema, doc: any): any {
  const row: any = {};
  for (const [key, val] of Object.entries(doc)) {
    if (key === "_id" || key === "save" || key === "toObject") continue;
    const col = schema.fields[key];
    if (!col) continue; // campo virtual/desconhecido
    row[col] = isDate(val) ? val.toISOString() : val;
  }
  schema.virtuals?.toRow?.(doc, row);
  return row;
}

function filterToQuery(schema: ModelSchema, q: any, filter: Filter) {
  for (const [key, val] of Object.entries(filter)) {
    if (key === "_id") {
      q = q.eq("id", val);
      continue;
    }
    const col = schema.fields[key] ?? key;
    if (val && typeof val === "object" && !isDate(val)) {
      if ("$gte" in val) q = q.gte(col, normVal(val.$gte));
      if ("$gt" in val) q = q.gt(col, normVal(val.$gt));
      if ("$lte" in val) q = q.lte(col, normVal(val.$lte));
      if ("$lt" in val) q = q.lt(col, normVal(val.$lt));
      if ("$ne" in val) q = q.not(col, "is", val.$ne === null ? null : normVal(val.$ne));
      if ("$in" in val) q = q.in(col, val.$in);
    } else {
      q = q.eq(col, normVal(val));
    }
  }
  return q;
}

function normVal(v: any): any {
  return isDate(v) ? v.toISOString() : v;
}

async function saveDoc(schema: ModelSchema, doc: any): Promise<any> {
  const row = docToRow(schema, doc);
  if (schema.pk === "composite") {
    const onConflict = (schema.pkFields ?? []).join(",");
    const { data, error } = await supabase
      .from(schema.table)
      .upsert(row, { onConflict })
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) Object.assign(doc, rowToDoc(schema, data));
    return doc;
  }
  if (doc._id) {
    const { data, error } = await supabase
      .from(schema.table)
      .update(row)
      .eq("id", doc._id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) Object.assign(doc, rowToDoc(schema, data));
  } else {
    const { data, error } = await supabase.from(schema.table).insert(row).select().maybeSingle();
    if (error) throw error;
    if (data) Object.assign(doc, rowToDoc(schema, data));
  }
  return doc;
}

// ------------------------------------------------------------------
// Query chain
// ------------------------------------------------------------------

class Query<T = any> implements PromiseLike<T[]> {
  private _sort?: { col: string; asc: boolean };
  private _limit?: number;
  private _select?: string;

  constructor(private schema: ModelSchema, private filter: Filter) {}

  sort(spec: any): this {
    if (typeof spec === "string") {
      const key = spec.replace(/^-/, "");
      this._sort = { col: this.schema.fields[key] ?? key, asc: !spec.startsWith("-") };
    } else if (spec && typeof spec === "object") {
      const [k, dir] = Object.entries(spec)[0] ?? [];
      if (k) this._sort = { col: this.schema.fields[k] ?? k, asc: (dir as number) >= 0 };
    }
    return this;
  }
  limit(n: number): this {
    this._limit = n;
    return this;
  }
  select(_s: string): this {
    return this;
  }
  lean(): this {
    return this;
  }

  async exec(): Promise<T[]> {
    let q = supabase.from(this.schema.table).select("*");
    q = filterToQuery(this.schema, q, this.filter);
    if (this._sort) q = q.order(this._sort.col, { ascending: this._sort.asc });
    if (this._limit) q = q.limit(this._limit);
    const { data, error } = await q;
    if (error) {
      logger.warn({ err: error, table: this.schema.table }, "shim find failed");
      return [];
    }
    return (data ?? []).map((r: any) => rowToDoc(this.schema, r)) as T[];
  }

  then<R1 = T[], R2 = never>(
    onF?: ((v: T[]) => R1 | PromiseLike<R1>) | null,
    onR?: ((r: any) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this.exec().then(onF, onR);
  }
}

// ------------------------------------------------------------------
// Model factory
// ------------------------------------------------------------------

function makeModel<T = any>(schema: ModelSchema) {
  return {
    find(filter: Filter = {}) {
      return new Query<T>(schema, filter);
    },
    async findOne(filter: Filter = {}): Promise<T | null> {
      let q = supabase.from(schema.table).select("*");
      q = filterToQuery(schema, q, filter).limit(1);
      const { data, error } = await q;
      if (error) {
        logger.warn({ err: error, table: schema.table }, "shim findOne failed");
        return null;
      }
      const row = data?.[0];
      return row ? (rowToDoc(schema, row) as T) : null;
    },
    async findById(id: string): Promise<T | null> {
      const { data, error } = await supabase.from(schema.table).select("*").eq("id", id).maybeSingle();
      if (error) {
        logger.warn({ err: error, table: schema.table }, "shim findById failed");
        return null;
      }
      return data ? (rowToDoc(schema, data) as T) : null;
    },
    async findOneAndUpdate(filter: Filter, update: Update, opts: any = {}): Promise<T | null> {
      const existing = await this.findOne(filter);
      const $set = update.$set ?? {};
      const $setOnInsert = update.$setOnInsert ?? {};
      const $inc = update.$inc ?? {};
      const $unset = update.$unset ?? {};
      // Suportar update flat (sem $set)
      for (const [k, v] of Object.entries(update)) {
        if (!k.startsWith("$")) ($set as any)[k] = v;
      }
      if (existing) {
        const next: any = { ...existing };
        Object.assign(next, $set);
        for (const [k, v] of Object.entries($inc)) next[k] = (next[k] ?? 0) + (v as number);
        for (const k of Object.keys($unset)) next[k] = null;
        await saveDoc(schema, next);
        return opts.new !== false ? (rowToDoc(schema, docToRow(schema, next)) as T) : (existing as T);
      }
      if (opts.upsert) {
        const seed: any = { ...filter, ...$setOnInsert, ...$set, ...(schema.defaults ?? {}) };
        for (const [k, v] of Object.entries($inc)) seed[k] = (seed[k] ?? 0) + (v as number);
        // Cuidar de filtros com operadores ($gte etc.)
        for (const k of Object.keys(seed)) {
          if (seed[k] && typeof seed[k] === "object" && !isDate(seed[k])) delete seed[k];
        }
        const row = docToRow(schema, seed);
        const { data, error } = await supabase.from(schema.table).insert(row).select().maybeSingle();
        if (error) {
          logger.warn({ err: error, table: schema.table }, "shim upsert insert failed");
          return null;
        }
        return data ? (rowToDoc(schema, data) as T) : null;
      }
      return null;
    },
    async findOneAndDelete(filter: Filter): Promise<T | null> {
      const existing = await this.findOne(filter);
      if (!existing) return null;
      await this.deleteOne(filter);
      return existing;
    },
    async updateOne(filter: Filter, update: Update, opts: any = {}): Promise<{ modifiedCount: number; upsertedCount: number }> {
      // Caminho atômico: filtro com $gte + $inc (usado em removeWallet)
      const incOnly = update.$inc && Object.keys(update).filter((k) => k.startsWith("$")).length === 1;
      const hasCondOp = Object.values(filter).some(
        (v) => v && typeof v === "object" && !isDate(v) && ("$gte" in v || "$gt" in v),
      );
      if (incOnly && hasCondOp) {
        // Fallback ainda não atômico: read+check+write. Documentado.
        const existing = await this.findOne(filter);
        if (!existing) return { modifiedCount: 0, upsertedCount: 0 };
        const next: any = { ...existing };
        for (const [k, v] of Object.entries(update.$inc)) next[k] = (next[k] ?? 0) + (v as number);
        await saveDoc(schema, next);
        return { modifiedCount: 1, upsertedCount: 0 };
      }
      const result = await this.findOneAndUpdate(filter, update, opts);
      if (result) return { modifiedCount: 1, upsertedCount: opts.upsert ? 1 : 0 };
      return { modifiedCount: 0, upsertedCount: 0 };
    },
    async updateMany(filter: Filter, update: Update): Promise<{ modifiedCount: number }> {
      const $set = update.$set ?? {};
      const row = docToRow(schema, $set);
      let q = supabase.from(schema.table).update(row);
      q = filterToQuery(schema, q, filter);
      const { error, count } = await q.select("*", { count: "exact", head: true });
      if (error) {
        logger.warn({ err: error, table: schema.table }, "shim updateMany failed");
        return { modifiedCount: 0 };
      }
      return { modifiedCount: count ?? 0 };
    },
    async deleteOne(filter: Filter): Promise<{ deletedCount: number }> {
      let q = supabase.from(schema.table).delete();
      q = filterToQuery(schema, q, filter);
      const { error } = await q;
      if (error) {
        logger.warn({ err: error, table: schema.table }, "shim deleteOne failed");
        return { deletedCount: 0 };
      }
      return { deletedCount: 1 };
    },
    async countDocuments(filter: Filter = {}): Promise<number> {
      let q = supabase.from(schema.table).select("*", { count: "exact", head: true });
      q = filterToQuery(schema, q, filter);
      const { count, error } = await q;
      if (error) {
        logger.warn({ err: error, table: schema.table }, "shim count failed");
        return 0;
      }
      return count ?? 0;
    },
    async create(input: any): Promise<T> {
      const seed = { ...(schema.defaults ?? {}), ...input };
      const row = docToRow(schema, seed);
      const { data, error } = await supabase.from(schema.table).insert(row).select().maybeSingle();
      if (error) throw error;
      return rowToDoc(schema, data) as T;
    },
  };
}

// ------------------------------------------------------------------
// Public models
// ------------------------------------------------------------------

export const EconomyAccount = makeModel(ECONOMY);
export const InventoryItem = makeModel(INVENTORY);
export const ShopItem = makeModel(SHOP);
export const Reminder = makeModel(REMINDER);
export const Announcement = makeModel(ANNOUNCEMENT);
export const AutoModIncident = makeModel(AUTOMOD);
export const DailyToken = makeModel(DAILY_TOKEN);
export const Cooldown = makeModel(COOLDOWN);
export const EmbedTemplate = makeModel(EMBED_TEMPLATE);
export const CustomCommand = makeModel(CUSTOM_CMD);
// Phase 4 migrated → see bot/src/bot/repositories/phase4.repo.ts
// (Marriage, Punishment, Giveaway, LevelAccount, Ticket, VipMembership)

// ------------------------------------------------------------------
// GuildConfig — mistura Supabase + memória (campos não-migrados)
// ------------------------------------------------------------------

const guildExtras = new Map<string, Record<string, any>>();
const baseGuildConfig = makeModel(GUILD_CONFIG);

function mergeExtras(doc: any): any {
  if (!doc) return doc;
  const extras = guildExtras.get(doc.guildId) ?? {};
  return { ...GUILD_CONFIG.defaults, ...extras, ...doc };
}

export const GuildConfig = {
  async findOne(filter: any) {
    const doc = await baseGuildConfig.findOne(filter);
    return doc ? mergeExtras(doc) : null;
  },
  async findOneAndUpdate(filter: any, update: any, opts: any = {}) {
    const known: any = {};
    const extras: any = {};
    const $set = update.$set ?? {};
    const $setOnInsert = update.$setOnInsert ?? {};
    for (const [k, v] of Object.entries(update)) {
      if (!k.startsWith("$")) ($set as any)[k] = v;
    }
    for (const [k, v] of Object.entries($set)) {
      if (GUILD_CONFIG.fields[k]) known[k] = v;
      else extras[k] = v;
    }
    for (const [k, v] of Object.entries($setOnInsert)) {
      if (GUILD_CONFIG.fields[k]) (known as any)[k] = (known as any)[k] ?? v;
    }
    const gid = filter.guildId;
    if (gid && Object.keys(extras).length) {
      const cur = guildExtras.get(gid) ?? {};
      guildExtras.set(gid, { ...cur, ...extras });
    }
    const doc = await baseGuildConfig.findOneAndUpdate(
      filter,
      { $set: known, $setOnInsert: { guildId: gid } },
      { upsert: true, new: true, ...opts },
    );
    return doc ? mergeExtras(doc) : null;
  },
  async updateOne(filter: any, update: any, opts: any = {}) {
    await this.findOneAndUpdate(filter, update, opts);
    return { modifiedCount: 1, upsertedCount: 0 };
  },
  async create(input: any) {
    return this.findOneAndUpdate({ guildId: input.guildId }, { $set: input }, { upsert: true });
  },
};

// ------------------------------------------------------------------
// Mongoose legacy: Guild + User (caches no-op)
// ------------------------------------------------------------------

export const Guild = {
  async updateOne(_filter: any, _update: any, _opts: any = {}) {
    return { modifiedCount: 0, upsertedCount: 0 };
  },
  async findById(_id: string) {
    return null;
  },
  async findOne() {
    return null;
  },
};

export const User = {
  async updateOne(_filter: any, _update: any, _opts: any = {}) {
    return { modifiedCount: 0, upsertedCount: 0 };
  },
  async findById(_id: string) {
    return null;
  },
};

// ------------------------------------------------------------------
// Tipos auxiliares
// ------------------------------------------------------------------

export type VipTier = "BRONZE" | "PRATA" | "OURO" | "DIAMANTE";
export type PunishmentType = "WARN" | "MUTE" | "TEMPMUTE" | "KICK" | "BAN" | "TEMPBAN" | "UNBAN" | "UNMUTE";
