import { createFileRoute, redirect } from "@tanstack/react-router";

// O blog ainda não tem posts reais — por enquanto enviamos pra /docs.
export const Route = createFileRoute("/blog")({
  beforeLoad: () => {
    throw redirect({ to: "/docs" });
  },
});
