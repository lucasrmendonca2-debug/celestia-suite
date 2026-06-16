import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Shield,
  Coins,
  TrendingUp,
  Sparkles,
  Settings,
  ScrollText,
  UserPlus,
  Smile,
  Terminal,
  FileCode2,
  Ticket,
  Award,
  Trophy,
  type LucideIcon,
} from "lucide-react";

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "Geral",
    items: [{ to: "overview", label: "Visão geral", icon: LayoutDashboard }],
  },
  {
    title: "Configuração",
    items: [
      { to: "welcome", label: "Boas-vindas", icon: Sparkles },
      { to: "logs", label: "Logs", icon: ScrollText },
      { to: "settings", label: "Configurações", icon: Settings, soon: true },
    ],
  },
  {
    title: "Membros",
    items: [
      { to: "autorole", label: "Autorole", icon: UserPlus },
      { to: "reaction-roles", label: "Cargos por reação", icon: Smile },
    ],
  },
  {
    title: "Atendimento",
    items: [{ to: "tickets", label: "Tickets", icon: Ticket }],
  },
  {
    title: "Moderação",
    items: [{ to: "moderation", label: "Moderação", icon: Shield }],
  },
  {
    title: "Engajamento",
    items: [
      { to: "social", label: "Social & Level", icon: TrendingUp },
      { to: "badges", label: "Badges", icon: Award },
      { to: "achievements", label: "Conquistas", icon: Trophy },
      { to: "economy", label: "Economia", icon: Coins },
    ],
  },
  {
    title: "Personalização",
    items: [
      { to: "commands", label: "Comandos custom", icon: Terminal },
      { to: "embeds", label: "Embeds", icon: FileCode2 },
    ],
  },
];

export function DashboardSidebar({ guildId }: { guildId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = `/dashboard/${guildId}`;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 backdrop-blur md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="size-7 rounded-lg bg-primary/20 ring-1 ring-primary/40" />
        <span className="text-base font-semibold tracking-tight">Zenox</span>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {s.title}
            </p>
            <ul className="space-y-0.5">
              {s.items.map((it) => {
                const href = `${base}/${it.to}`.replace(/\/overview$/, "");
                const active =
                  pathname === href || (it.to === "overview" && pathname === base);
                const Icon = it.icon;
                return (
                  <li key={it.to}>
                    <Link
                      to={href}
                      className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                        active
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span className="flex-1">{it.label}</span>
                      {it.soon && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                          em breve
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-3 py-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          ← Trocar servidor
        </Link>
      </div>
    </aside>
  );
}
