import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/automod")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/dashboard/$guildId/moderation",
      params: { guildId: params.guildId },
    });
  },
});