import { createFileRoute, Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import zenoxAvatar from "@/assets/zenox-avatar.png.asset.json";
import zenoxBanner from "@/assets/zenox-banner.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zenox — Bot premium para Discord" },
      {
        name: "description",
        content:
          "Moderação, economia, level, tickets e dashboard completo. O Zenox deixa seu Discord do nível pro top.",
      },
      { property: "og:title", content: "Zenox — Bot premium para Discord" },
      {
        property: "og:description",
        content: "Painel web, economia interna, AutoMod e mais — tudo num bot só.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  function startDiscordLogin(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.location.href = `/api/auth/discord/login?origin=${encodeURIComponent(window.location.origin)}`;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/0.25),transparent_60%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={zenoxAvatar.url}
              alt="Zenox"
              className="size-9 rounded-lg object-cover ring-1 ring-primary/40"
            />
            <span className="text-lg font-semibold tracking-tight">Zenox</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <a
              href="/api/auth/discord/login"
              onClick={startDiscordLogin}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Entrar com Discord
            </a>
          </nav>
        </header>

        <section className="mt-24 flex max-w-3xl flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Em construção — Onda 2 ativa
          </span>
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            O Discord da sua comunidade,{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              do nível pro top.
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Zenox é um bot multifuncional com moderação avançada, economia, level, tickets e um
            dashboard premium pra configurar tudo sem comando.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/auth/discord/login"
              onClick={startDiscordLogin}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Entrar com Discord
            </a>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-5 py-2.5 text-sm font-medium transition hover:bg-accent"
            >
              Ver dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
