import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ location }) => {
    const search = location.search as Record<string, unknown>;
    throw redirect({ to: "/entrar", search: search as never });
  },
});
