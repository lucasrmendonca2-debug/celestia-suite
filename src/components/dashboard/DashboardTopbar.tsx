import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { CurrentUser } from "@/lib/auth/auth.functions";
import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Mascot } from "@/components/Mascot";
import { SidebarNav } from "./sidebar-nav";

function avatarUrl(u: CurrentUser): string {
  if (u.avatar) {
    const ext = u.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}?size=64`;
  }
  const idx = Number(BigInt(u.id) >> 22n) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

export function DashboardTopbar({
  user,
  title,
  subtitle,
  guildId,
}: {
  user: CurrentUser;
  title: string;
  subtitle?: string;
  guildId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/40 bg-background/60 px-4 py-3 backdrop-blur-2xl sm:px-6">
      <div className="flex items-center gap-2">
        {guildId && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-border/50 bg-card/60 text-muted-foreground transition hover:bg-[color-mix(in_oklab,var(--aurora-lavender)_18%,transparent)] hover:text-foreground md:hidden"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="aurora-panel w-72 rounded-none rounded-r-3xl border-y-0 border-l-0 p-0">
              <SheetTitle className="sr-only">Navegação do dashboard</SheetTitle>
              <div className="flex items-center gap-2 px-5 py-5">
                <Mascot variant="hero" size={36} />
                <span className="font-display text-base font-bold">Zenox</span>
              </div>
              <SidebarNav guildId={guildId} onNavigate={() => setOpen(false)} />
              <div className="border-t border-border/40 px-3 py-3">
                <Link
                  to="/servidores"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                >
                  ← Trocar servidor
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-display truncate text-sm font-semibold sm:text-base">{title}</h1>
          {guildId && <PremiumBadge guildId={guildId} />}
        </div>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="hidden items-center gap-2 sm:flex">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium leading-tight">
              {user.globalName ?? user.username}
            </p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
          <img
            src={avatarUrl(user)}
            alt={user.username}
            className="relative z-10 size-9 shrink-0 rounded-full ring-2 ring-[color-mix(in_oklab,var(--aurora-lavender)_50%,transparent)]"
          />
        </div>
        <Link
          to="/api/auth/logout"
          reloadDocument
          className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border/50 bg-card/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-[color-mix(in_oklab,var(--aurora-pink)_40%,transparent)] hover:bg-[color-mix(in_oklab,var(--aurora-pink)_15%,transparent)] hover:text-foreground sm:px-3"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </Link>
      </div>
    </header>
  );
}
