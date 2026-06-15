import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Zenox" },
      { name: "description", content: "Faça login com sua conta do Discord para acessar o dashboard." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  function startDiscordLogin(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.location.href = `/api/auth/discord/login?origin=${encodeURIComponent(window.location.origin)}`;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/0.25),transparent_60%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/20 ring-1 ring-primary/40" />
          <span className="text-lg font-semibold tracking-tight">Zenox</span>
        </div>
        <h1 className="text-2xl font-semibold">Entrar no painel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use sua conta do Discord. Vamos pedir só as permissões necessárias pra mostrar seus
          servidores e configurar o bot.
        </p>
        <a
          href="/api/auth/discord/login"
          onClick={startDiscordLogin}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4752c4]"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
            <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.07.07 0 0 0-.073.035 13.84 13.84 0 0 0-.61 1.249 18.27 18.27 0 0 0-5.487 0 12.51 12.51 0 0 0-.62-1.249.073.073 0 0 0-.073-.035 19.74 19.74 0 0 0-3.76 1.169.066.066 0 0 0-.03.027C2.04 8.046 1.21 11.62 1.617 15.15a.078.078 0 0 0 .031.054 19.9 19.9 0 0 0 5.993 3.03.073.073 0 0 0 .078-.027c.462-.63.873-1.295 1.226-1.994a.072.072 0 0 0-.04-.1 13.2 13.2 0 0 1-1.872-.892.073.073 0 0 1-.007-.121c.126-.094.252-.192.372-.291a.07.07 0 0 1 .073-.01c3.927 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .074.009c.12.099.246.198.373.292a.073.073 0 0 1-.006.121 12.4 12.4 0 0 1-1.873.892.073.073 0 0 0-.039.1c.36.699.772 1.364 1.225 1.994a.072.072 0 0 0 .078.028 19.84 19.84 0 0 0 6.002-3.03.073.073 0 0 0 .03-.053c.5-4.083-.838-7.627-3.548-10.754a.06.06 0 0 0-.03-.028zM8.02 13.0c-1.182 0-2.157-1.085-2.157-2.42 0-1.333.957-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.974 0c-1.182 0-2.157-1.085-2.157-2.42 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z" />
          </svg>
          Continuar com Discord
        </a>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Voltar pra home</Link>
        </p>
      </div>
    </main>
  );
}
