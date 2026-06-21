import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/$slug/automod")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/dashboard/$slug/moderacao",
      params: { slug: params.slug },
    });
  },
});
