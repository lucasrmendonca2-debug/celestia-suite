import { supabase } from "../../../database/supabase.js";
import { getSocialConfig } from "./social.config.js";

export type CardStyle = "default" | "minimal" | "gradient";

export interface SocialProfileRow {
  guild_id: string;
  user_id: string;
  bio: string;
  title: string;
  color: string;
  banner_url: string | null;
  reputation: number;
  profile_views: number;
  selected_badges: string[];
  accent_color: string | null;
  background_color: string | null;
  text_color: string | null;
  card_style: CardStyle;
}

const DEFAULT: Omit<SocialProfileRow, "guild_id" | "user_id"> = {
  bio: "",
  title: "",
  color: "#5865F2",
  banner_url: null,
  reputation: 0,
  profile_views: 0,
  selected_badges: [],
  accent_color: null,
  background_color: null,
  text_color: null,
  card_style: "default",
};

export async function getProfile(guildId: string, userId: string): Promise<SocialProfileRow> {
  const { data } = await supabase
    .from("social_profiles")
    .select("*")
    .eq("guild_id", guildId)
    .eq("user_id", userId)
    .maybeSingle();
  return { ...DEFAULT, ...(data ?? {}), guild_id: guildId, user_id: userId } as SocialProfileRow;
}

export interface ResolvedCardLook {
  accent: string;
  background: string;
  text: string;
  style: CardStyle;
}

/** Resolve cores efetivas do card: usa o do perfil quando definido, senão default do guild. */
export async function getResolvedCardLook(
  guildId: string,
  profile: SocialProfileRow,
): Promise<ResolvedCardLook> {
  const social = await getSocialConfig(guildId);
  const cfg = social as typeof social & {
    card_accent_color?: string;
    card_background_color?: string;
    card_text_color?: string;
    card_style?: CardStyle;
  };
  return {
    accent: profile.accent_color || profile.color || cfg.card_accent_color || "#5865F2",
    background: profile.background_color || cfg.card_background_color || "#0f1117",
    text: profile.text_color || cfg.card_text_color || "#ffffff",
    style: profile.card_style || cfg.card_style || "default",
  };
}

export async function updateProfile(
  guildId: string,
  userId: string,
  patch: Partial<
    Pick<
      SocialProfileRow,
      | "bio"
      | "title"
      | "color"
      | "banner_url"
      | "selected_badges"
      | "accent_color"
      | "background_color"
      | "text_color"
      | "card_style"
    >
  >,
): Promise<SocialProfileRow> {
  const current = await getProfile(guildId, userId);
  const next = { ...current, ...patch };
  await supabase.from("social_profiles").upsert(
    {
      guild_id: guildId,
      user_id: userId,
      bio: next.bio,
      title: next.title,
      color: next.color,
      banner_url: next.banner_url,
      selected_badges: next.selected_badges,
      accent_color: next.accent_color,
      background_color: next.background_color,
      text_color: next.text_color,
      card_style: next.card_style,
    },
    { onConflict: "guild_id,user_id" },
  );
  return next;
}

export async function incrementProfileViews(guildId: string, userId: string): Promise<void> {
  const current = await getProfile(guildId, userId);
  await supabase
    .from("social_profiles")
    .upsert(
      {
        guild_id: guildId,
        user_id: userId,
        profile_views: current.profile_views + 1,
        bio: current.bio,
        title: current.title,
        color: current.color,
        banner_url: current.banner_url,
        selected_badges: current.selected_badges,
      },
      { onConflict: "guild_id,user_id" },
    );
}

const HEX = /^#[0-9a-fA-F]{6}$/;
export function isValidColor(c: string): boolean {
  return HEX.test(c);
}

const URL_RE = /^https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i;
export function isValidImageUrl(u: string): boolean {
  return URL_RE.test(u);
}

export function isValidCardStyle(s: string): s is CardStyle {
  return s === "default" || s === "minimal" || s === "gradient";
}
