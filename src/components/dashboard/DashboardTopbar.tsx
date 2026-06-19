import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { CurrentUser } from "@/lib/auth/auth.functions";
import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import mascot from "@/assets/zenox-mascot.png.asset.json";

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
    <header className="sticky top-0 z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--cyber-line)] bg-background/70 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-2">
        {guildId && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--cyber-line)] bg-card/80 text-muted-foreground transition hover:bg-primary/10 hover:text-foreground md:hidden"
              >
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="cyber-panel w-72 rounded-none border-y-0 border-l-0 p-0">
              <SheetTitle className="sr-only">Navegação do dashboard</SheetTitle>
              <div className="flex items-center gap-2 px-5 py-5">
                <div className="grid size-8 place-items-center rounded-lg border border-[var(--cyber-line)] bg-primary/15">
                  <span className="font-display text-xs font-black text-primary">ZX</span>
                </div>
                <span className="font-display text-base font-semibold">Zenox</span>
              </div>
              <SidebarNav guildId={guildId} onNavigate={() => setOpen(false)} />
              <div className="border-t border-border px-3 py-3">
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  ← Trocar servidor
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        )}
        <div className="relative hidden size-9 shrink-0 overflow-hidden rounded-lg border border-[var(--cyber-line)] bg-primary/15 shadow-[0_0_22px_-12px_var(--cyber-cyan)] sm:block">
          <img src={mascot.url} alt="" className="absolute inset-0 size-full scale-[2.2] object-cover object-top" />
        </div>
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
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium leading-tight">
            {user.globalName ?? user.username}
          </p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
        <img
          src={avatarUrl(user)}
          alt={user.username}
          className="size-9 shrink-0 rounded-full ring-1 ring-[var(--cyber-line)]"
        />
        <Link
          to="/api/auth/logout"
          reloadDocument
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--cyber-line)] bg-card/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-foreground sm:px-3"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </Link>
      </div>
    </header>
  );
}
