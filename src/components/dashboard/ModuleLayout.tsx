import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listMyGuilds } from "@/lib/auth/auth.functions";
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
  useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="cyber-shell cyber-grid-bg flex min-h-screen bg-background text-foreground">
      <DashboardSidebar guildId={guildId} />
      <div className="flex-1">
        <DashboardTopbar
          user={user}
          title={guild?.name ?? "Servidor"}
          subtitle={title}
          guildId={guildId}
        />
        <main className="relative mx-auto max-w-6xl px-6 py-8">
          <nav className="font-display mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/dashboard" className="hover:text-foreground">
              Servidores
            </Link>
            <ChevronRight className="size-3" />
            <Link
              to="/dashboard/$guildId"
              params={{ guildId }}
              className="hover:text-foreground"
            >
              {guild?.name ?? guildId}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{title}</span>
          </nav>

          <header className="cyber-panel mb-6 flex items-start justify-between gap-4 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-[var(--cyber-line)]">
                <Icon className="size-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold">{title}</h1>
                {description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
