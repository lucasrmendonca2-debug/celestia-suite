import { createFileRoute, redirect, notFound } from "@tanstack/react-router";
import { listMyGuilds } from "@/lib/auth/auth.functions";
import { buildGuildSlug } from "@/lib/guild/slug";

export const Route = createFileRoute("/_authenticated/g/$guildId")({
  loader: async ({ context, params }) => {
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    const guild = guilds.find((g) => g.id === params.guildId);
    if (!guild) throw notFound();
    throw redirect({ to: `/dashboard/${buildGuildSlug(guild)}` });
  },
});
