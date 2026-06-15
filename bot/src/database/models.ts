/**
 * Modelos Mongoose do Zenox.
 *
 * Convenções:
 *  - Para entidades 1:1 com Discord (Guild, User), `_id` é o snowflake (string).
 *  - Para o resto, `_id` é ObjectId padrão.
 *  - Timestamps automáticos onde fizer sentido.
 */
import { Schema, model, type InferSchemaType } from "mongoose";

/* ---------------- Guild & Config ---------------- */
const guildSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    premium: { type: Boolean, default: false },
    premiumUntil: { type: Date, default: null },
  },
  { timestamps: true, _id: false },
);
export const Guild = model("Guild", guildSchema);

const guildConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },

    modLogChannelId: { type: String, default: null },
    messageLogChannelId: { type: String, default: null },
    memberLogChannelId: { type: String, default: null },
    ticketLogChannelId: { type: String, default: null },
    welcomeChannelId: { type: String, default: null },
    goodbyeChannelId: { type: String, default: null },
    levelUpChannelId: { type: String, default: null },
    suggestionsChannelId: { type: String, default: null },

    muteRoleId: { type: String, default: null },
    autoRoleId: { type: String, default: null },
    supportRoleId: { type: String, default: null },
    vipRoleId: { type: String, default: null },

    welcomeEnabled: { type: Boolean, default: false },
    welcomeMessage: {
      type: String,
      default: "Bem-vindo(a) {user} ao **{server}**! Agora somos **{memberCount}** membros 🎉",
    },
    welcomeDmEnabled: { type: Boolean, default: false },
    welcomeDmMessage: { type: String, default: null },

    goodbyeEnabled: { type: Boolean, default: false },
    goodbyeMessage: { type: String, default: "{user} saiu do servidor. Sentiremos saudades 👋" },

    logMessageDelete: { type: Boolean, default: true },
    logMessageEdit: { type: Boolean, default: true },
    logMemberJoin: { type: Boolean, default: true },
    logMemberLeave: { type: Boolean, default: true },
    logModeration: { type: Boolean, default: true },

    // AutoMod
    antiSpamEnabled: { type: Boolean, default: false },
    antiSpamThreshold: { type: Number, default: 5 }, // msgs
    antiSpamWindowMs: { type: Number, default: 5000 },
    antiSpamAction: { type: String, enum: ["delete", "warn", "mute"], default: "delete" },
    antiLinkEnabled: { type: Boolean, default: false },
    antiInviteEnabled: { type: Boolean, default: false },
    antiRaidEnabled: { type: Boolean, default: false },
    blacklistedWords: { type: [String], default: [] },
    automodWhitelistRoles: { type: [String], default: [] },
    automodWhitelistChannels: { type: [String], default: [] },

    // Economy
    economyEnabled: { type: Boolean, default: true },
    economyCurrencyName: { type: String, default: "Zen" },
    economyCurrencyEmoji: { type: String, default: "💜" },
    economyDailyAmount: { type: Number, default: 250 },
    economyWorkMin: { type: Number, default: 80 },
    economyWorkMax: { type: Number, default: 320 },
    economyVipMultiplier: { type: Number, default: 2 },

    // Levels
    levelEnabled: { type: Boolean, default: true },
    levelMultiplier: { type: Number, default: 1.0 },
    levelMessage: {
      type: String,
      default: "🎉 Parabéns {user}! Você subiu para o **nível {level}**.",
    },
    noXpChannels: { type: [String], default: [] },
    noXpRoles: { type: [String], default: [] },
  },
  { timestamps: true },
);
export const GuildConfig = model("GuildConfig", guildConfigSchema);
export type GuildConfigDoc = InferSchemaType<typeof guildConfigSchema> & { _id: unknown };

/* ---------------- Users ---------------- */
const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    username: { type: String, default: null },
    blacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String, default: null },
  },
  { timestamps: true, _id: false },
);
export const User = model("User", userSchema);

/* ---------------- Moderation ---------------- */
export const PUNISHMENT_TYPES = ["BAN", "TEMPBAN", "KICK", "MUTE", "TEMPMUTE", "WARN", "UNBAN", "UNMUTE"] as const;
export type PunishmentType = (typeof PUNISHMENT_TYPES)[number];

const punishmentSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    type: { type: String, enum: PUNISHMENT_TYPES, required: true },
    reason: { type: String, default: null },
    durationMs: { type: Number, default: null },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
punishmentSchema.index({ guildId: 1, userId: 1 });
punishmentSchema.index({ active: 1, expiresAt: 1 });
export const Punishment = model("Punishment", punishmentSchema);

const warningSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
warningSchema.index({ guildId: 1, userId: 1 });
export const Warning = model("Warning", warningSchema);

/* ---------------- Tickets ---------------- */
const ticketPanelSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null },
    title: { type: String, default: "Suporte" },
    description: { type: String, default: "Clique no botão abaixo para abrir um ticket." },
    categoryId: { type: String, default: null },
    supportRoleId: { type: String, default: null },
    buttonLabel: { type: String, default: "Abrir ticket" },
  },
  { timestamps: true },
);
export const TicketPanel = model("TicketPanel", ticketPanelSchema);

export const TICKET_STATUS = ["OPEN", "CLOSED", "DELETED"] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

const ticketSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    panelId: { type: Schema.Types.ObjectId, ref: "TicketPanel", default: null },
    channelId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    subject: { type: String, default: null },
    status: { type: String, enum: TICKET_STATUS, default: "OPEN" },
    closedById: { type: String, default: null },
    closedAt: { type: Date, default: null },
    rating: { type: Number, default: null },
    ratingNote: { type: String, default: null },
  },
  { timestamps: true },
);
export const Ticket = model("Ticket", ticketSchema);

/* ---------------- VIP ---------------- */
export const VIP_TIERS = ["BRONZE", "SILVER", "GOLD", "DIAMOND"] as const;
export type VipTier = (typeof VIP_TIERS)[number];

const vipSchema = new Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    tier: { type: String, enum: VIP_TIERS, default: "BRONZE" },
    active: { type: Boolean, default: true, index: true },
    grantedById: { type: String, required: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);
vipSchema.index({ guildId: 1, userId: 1 }, { unique: true });
vipSchema.index({ active: 1, expiresAt: 1 });
export const VipMembership = model("VipMembership", vipSchema);

/* ---------------- Economy ---------------- */
const economySchema = new Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    bankCap: { type: Number, default: 10_000 },
    lastDaily: { type: Date, default: null },
    lastWork: { type: Date, default: null },
    lastCrime: { type: Date, default: null },
    lastRob: { type: Date, default: null },
    streakDaily: { type: Number, default: 0 },
  },
  { timestamps: true },
);
economySchema.index({ guildId: 1, userId: 1 }, { unique: true });
export const EconomyAccount = model("EconomyAccount", economySchema);

const shopItemSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: -1 }, // -1 = ilimitado
    roleId: { type: String, default: null }, // dá esse cargo ao comprar
    consumable: { type: Boolean, default: true },
    emoji: { type: String, default: "🛒" },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);
shopItemSchema.index({ guildId: 1, name: 1 }, { unique: true });
export const ShopItem = model("ShopItem", shopItemSchema);

const inventoryItemSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: "ShopItem", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true },
);
inventoryItemSchema.index({ guildId: 1, userId: 1, itemId: 1 }, { unique: true });
export const InventoryItem = model("InventoryItem", inventoryItemSchema);

/* ---------------- Level ---------------- */
const levelSchema = new Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastXpAt: { type: Date, default: null },
  },
  { timestamps: true },
);
levelSchema.index({ guildId: 1, userId: 1 }, { unique: true });
export const LevelAccount = model("LevelAccount", levelSchema);

const levelRewardSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    level: { type: Number, required: true, min: 1 },
    roleId: { type: String, required: true },
    removePrevious: { type: Boolean, default: false },
  },
  { timestamps: true },
);
levelRewardSchema.index({ guildId: 1, level: 1 }, { unique: true });
export const LevelReward = model("LevelReward", levelRewardSchema);

/* ---------------- Marriage / Interação ---------------- */
const marriageSchema = new Schema(
  {
    userA: { type: String, required: true, index: true },
    userB: { type: String, required: true, index: true },
    proposedAt: { type: Date, default: Date.now },
    marriedAt: { type: Date, default: null },
    status: { type: String, enum: ["PENDING", "MARRIED", "DIVORCED"], default: "PENDING" },
  },
  { timestamps: true },
);
marriageSchema.index({ userA: 1, userB: 1, status: 1 });
export const Marriage = model("Marriage", marriageSchema);

/* ---------------- Giveaway / Eventos ---------------- */
const giveawaySchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null, index: true },
    hostId: { type: String, required: true },
    prize: { type: String, required: true },
    winnersCount: { type: Number, default: 1, min: 1 },
    endsAt: { type: Date, required: true, index: true },
    ended: { type: Boolean, default: false, index: true },
    participants: { type: [String], default: [] },
    winners: { type: [String], default: [] },
    requiredRoleId: { type: String, default: null },
  },
  { timestamps: true },
);
export const Giveaway = model("Giveaway", giveawaySchema);

/* ---------------- Custom Commands (premium) ---------------- */
const customCommandSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true, lowercase: true, trim: true },
    response: { type: String, required: true },
    embed: { type: Boolean, default: false },
    deleteTrigger: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    uses: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);
customCommandSchema.index({ guildId: 1, name: 1 }, { unique: true });
export const CustomCommand = model("CustomCommand", customCommandSchema);

/* ---------------- Embed Templates ---------------- */
const embedTemplateSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);
embedTemplateSchema.index({ guildId: 1, name: 1 }, { unique: true });
export const EmbedTemplate = model("EmbedTemplate", embedTemplateSchema);

/* ---------------- AutoMod Incidents ---------------- */
const autoModIncidentSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    rule: { type: String, required: true },
    action: { type: String, required: true },
    content: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const AutoModIncident = model("AutoModIncident", autoModIncidentSchema);

/* ---------------- Logs ---------------- */
const logEntrySchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    kind: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
export const LogEntry = model("LogEntry", logEntrySchema);

/* ---------------- Cooldown ---------------- */
const cooldownSchema = new Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    command: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: false },
);
cooldownSchema.index({ guildId: 1, userId: 1, command: 1 }, { unique: true });
export const Cooldown = model("Cooldown", cooldownSchema);

/* ---------------- Blacklist global ---------------- */
const blacklistSchema = new Schema(
  {
    targetId: { type: String, required: true, unique: true },
    kind: { type: String, enum: ["user", "guild"], required: true },
    reason: { type: String, default: null },
  },
  { timestamps: true },
);
export const GlobalBlacklist = model("GlobalBlacklist", blacklistSchema);
