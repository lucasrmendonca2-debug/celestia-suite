import { Link } from "@tanstack/react-router";
import type { CurrentUser } from "@/lib/auth/auth.functions";
import { LogOut } from "lucide-react";

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
}: {
  user: CurrentUser;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/70 px-6 py-3 backdrop-blur">
      <div>
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">
            {user.globalName ?? user.username}
          </p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
        <img
          src={avatarUrl(user)}
          alt={user.username}
          className="size-9 rounded-full ring-1 ring-border"
        />
        <Link
          to="/api/auth/logout"
          reloadDocument
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-3.5" />
          Sair
        </Link>
      </div>
    </header>
  );
}
