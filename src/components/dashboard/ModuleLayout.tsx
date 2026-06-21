import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listMyGuilds } from "@/lib/auth/auth.functions";
import { buildGuildSlug } from "@/lib/guild/slug";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";

interface Props {
  guildId: string;
  user: { username: string; globalName: string | null; avatar: string | null; id: string };
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function ModuleLayout({
  guildId,
  user,
  icon: Icon,
  title,
  description,
  actions,
  children,
}: Props) {
  const { data: guilds } = useSuspenseQuery({
    queryKey: ["my-guilds"],
    queryFn: () => listMyGuilds(),
  });
  const guild = guilds.find((g) => g.id === guildId);
  const slug = guild ? buildGuildSlug(guild) : guildId;

  return (
    <div className="aurora-shell flex min-h-dvh text-foreground">
      <DashboardSidebar guildId={guildId} />
      <div className="relative z-10 flex-1">
        <DashboardTopbar
          user={user}
          title={guild?.name ?? "Servidor"}
          subtitle={title}
          guildId={guildId}
        />
        <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <nav className="font-display mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/servidores" className="transition hover:text-foreground">
              Servidores
            </Link>
            <ChevronRight className="size-3" />
            <Link
              to="/dashboard/$slug"
              params={{ slug }}
              className="transition hover:text-foreground"
            >
              {guild?.name ?? guildId}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{title}</span>
          </nav>

          <header className="aurora-panel mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-5 sm:gap-4 sm:p-6">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div
                className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl text-foreground sm:size-12"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in oklab, var(--aurora-lavender) 35%, transparent), color-mix(in oklab, var(--aurora-pink) 25%, transparent))",
                  boxShadow:
                    "inset 0 1px 0 color-mix(in oklab, white 30%, transparent), 0 8px 24px -10px color-mix(in oklab, var(--aurora-lavender) 60%, transparent)",
                }}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display truncate text-lg font-bold tracking-tight sm:text-2xl">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {actions}
              </div>
            )}
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
