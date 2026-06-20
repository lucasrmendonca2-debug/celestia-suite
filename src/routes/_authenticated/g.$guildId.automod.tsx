import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/g/$guildId/automod")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/g/$guildId/moderacao",
      params: { guildId: params.guildId },
    });
  },
});