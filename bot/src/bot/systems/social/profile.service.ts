import { supabase } from "../../../database/supabase.js";

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
}

const DEFAULT: Omit<SocialProfileRow, "guild_id" | "user_id"> = {
  bio: "",
  title: "",
  color: "#5865F2",
  banner_url: null,
  reputation: 0,
  profile_views: 0,
  selected_badges: [],
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

export async function updateProfile(
  guildId: string,
  userId: string,
  patch: Partial<Pick<SocialProfileRow, "bio" | "title" | "color" | "banner_url" | "selected_badges">>,
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
