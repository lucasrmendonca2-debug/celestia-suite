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
    _id: { type: String, required: true }, // discord guild id
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

    antiSpamEnabled: { type: Boolean, default: false },
    antiLinkEnabled: { type: Boolean, default: false },
    antiInviteEnabled: { type: Boolean, default: false },
    antiRaidEnabled: { type: Boolean, default: false },
    blacklistedWords: { type: [String], default: [] },

    economyEnabled: { type: Boolean, default: true },
    levelEnabled: { type: Boolean, default: true },
    levelMultiplier: { type: Number, default: 1.0 },
    noXpChannels: { type: [String], default: [] },
  },
  { timestamps: true },
);
export const GuildConfig = model("GuildConfig", guildConfigSchema);
export type GuildConfigDoc = InferSchemaType<typeof guildConfigSchema> & { _id: unknown };

/* ---------------- Users ---------------- */
const userSchema = new Schema(
  {
    _id: { type: String, required: true }, // discord user id
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

/* ---------------- Economy / Level (stubs prontos) ---------------- */
const economySchema = new Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    wallet: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
    lastWork: { type: Date, default: null },
    lastCrime: { type: Date, default: null },
    lastRob: { type: Date, default: null },
  },
  { timestamps: true },
);
economySchema.index({ guildId: 1, userId: 1 }, { unique: true });
export const EconomyAccount = model("EconomyAccount", economySchema);

const levelSchema = new Schema(
  {
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastXpAt: { type: Date, default: null },
  },
  { timestamps: true },
);
levelSchema.index({ guildId: 1, userId: 1 }, { unique: true });
export const LevelAccount = model("LevelAccount", levelSchema);

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
