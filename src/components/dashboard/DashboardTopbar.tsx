import { Link } from "@tanstack/react-router";
import type { CurrentUser } from "@/lib/auth/auth.functions";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
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
  return (
    <header className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/70 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative hidden size-9 shrink-0 overflow-hidden rounded-lg bg-primary/15 ring-1 ring-primary/40 sm:block">
          <img src={mascot.url} alt="" className="absolute inset-0 size-full scale-[2.2] object-cover object-top" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{title}</h1>
            {guildId && <PremiumBadge guildId={guildId} />}
          </div>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
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
          className="size-9 shrink-0 rounded-full ring-1 ring-border"
        />
        <Link
          to="/api/auth/logout"
          reloadDocument
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground sm:px-3"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </Link>
      </div>
    </header>
  );
}
