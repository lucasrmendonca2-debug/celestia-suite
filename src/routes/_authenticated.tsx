import { createFileRoute, isRedirect, Link, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/auth/auth.functions";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    try {
      const user = await getCurrentUser();
      if (!user) throw redirect({ to: "/entrar" });
      return { user };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error(error);
      throw redirect({ to: "/entrar" });
    }
  },
  component: () => <Outlet />,
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Sessão expirada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre novamente para abrir o dashboard.
        </p>
        <Link
          to="/entrar"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Ir para login
        </Link>
      </div>
    </main>
  ),
});
