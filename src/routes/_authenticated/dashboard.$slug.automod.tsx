import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/automod")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/g/$guildId/moderacao",
      params: { guildId: params.guildId },
    });
  },
});