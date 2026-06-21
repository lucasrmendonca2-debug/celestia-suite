import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveGuildIdFromSlug } from "@/lib/guild/slug";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/automod")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/dashboard/$slug/moderacao",
      params: { guildId: guildId },
    });
  },
});