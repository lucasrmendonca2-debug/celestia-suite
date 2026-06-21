import { createFileRoute, redirect, notFound } from "@tanstack/react-router";
import { listMyGuilds } from "@/lib/auth/auth.functions";
import { buildGuildSlug } from "@/lib/guild/slug";

// Compatibilidade: links antigos no formato /g/<guildId>/<resto> redirecionam
// para o novo /dashboard/<slug>/<resto>.
const SEGMENT_MAP: Record<string, string> = {
  moderation: "moderacao",
  autorole: "cargo-automatico",
  welcome: "boas-vindas",
  leveling: "niveis",
  economy: "economia",
  community: "comunidade",
  seasons: "temporadas",
  achievements: "conquistas",
  "reaction-roles": "cargos-reacao",
  commands: "comandos-bot",
};

export const Route = createFileRoute("/_authenticated/g/$guildId/$")({
  loader: async ({ context, params }) => {
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guild = guilds.find((g) => g.id === params.guildId);
    if (!guild) throw notFound();

    const splat = (params as { _splat?: string })._splat ?? "";
    const [first = "", ...rest] = splat.split("/").filter(Boolean);
    const mapped = SEGMENT_MAP[first] ?? first;
    const tail = [mapped, ...rest].filter(Boolean).join("/");
    const slug = buildGuildSlug(guild);
    const target = tail ? `/dashboard/${slug}/${tail}` : `/dashboard/${slug}`;
    throw redirect({ to: target });
  },
});
