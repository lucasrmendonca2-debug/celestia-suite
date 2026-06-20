import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const GuildSchema = z.object({
  id: z.string().regex(/^\d{5,32}$/),
  name: z.string().max(200).nullable().optional(),
  icon: z.string().max(200).nullable().optional(),
  ownerId: z.string().regex(/^\d{5,32}$/).nullable().optional(),
  memberCount: z.number().int().min(0).nullable().optional(),
});

const BodySchema = z.discriminatedUnion("event", [
  z.object({ event: z.literal("sync"), guilds: z.array(GuildSchema).max(10_000) }),
  z.object({ event: z.literal("join"), guild: GuildSchema }),
  z.object({ event: z.literal("leave"), guildId: z.string().regex(/^\d{5,32}$/) }),
]);

function normalizeToken(raw: string | null): string {
  return (raw ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^Bot\s+/i, "")
    .replace(/\s+/g, "");
}

export const Route = createFileRoute("/api/public/bot-guild-presence")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ getDiscordBotToken }, { supabaseAdmin }] = await Promise.all([
          import("@/lib/discord/bot-token.server"),
          import("@/integrations/supabase/client.server"),
        ]);
        const expected = getDiscordBotToken();
        const provided = normalizeToken(request.headers.get("authorization"));
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }

        const now = new Date().toISOString();
        if (parsed.data.event === "leave") {
          const { error } = await supabaseAdmin
            .from("bot_guild_presence")
            .upsert(
              {
                guild_id: parsed.data.guildId,
                present: false,
                left_at: now,
                last_seen_at: now,
              },
              { onConflict: "guild_id" },
            );
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ ok: true });
        }

        const guilds = parsed.data.event === "sync" ? parsed.data.guilds : [parsed.data.guild];
        if (parsed.data.event === "sync") {
          const { error } = await supabaseAdmin
            .from("bot_guild_presence")
            .update({ present: false, left_at: now, last_seen_at: now })
            .eq("present", true);
          if (error) return Response.json({ error: error.message }, { status: 500 });
        }

        if (guilds.length > 0) {
          const { error } = await supabaseAdmin.from("bot_guild_presence").upsert(
            guilds.map((guild) => ({
              guild_id: guild.id,
              name: guild.name ?? null,
              icon: guild.icon ?? null,
              owner_id: guild.ownerId ?? null,
              member_count: guild.memberCount ?? null,
              present: true,
              joined_at: now,
              left_at: null,
              last_seen_at: now,
            })),
            { onConflict: "guild_id" },
          );
          if (error) return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ ok: true, count: guilds.length });
      },
    },
  },
});
