import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  Crown,
  Users,
  Lock,
  ImageIcon,
  type LucideIcon,
} from "lucide-react";

import { getGuildPremiumStatus } from "@/lib/guild/premium.functions";
import { getGuildConfig } from "@/lib/guild/guild.functions";

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
  premium?: boolean;
  /** key into guild config to show an "ativo" dot */
  activeKey?: "welcome_enabled";
}

interface Section {
  title: string;
  items: Item[];
}

const SECTIONS: Section[] = [
  {
    title: "Geral",
    items: [
      { to: "overview", label: "Visão geral", icon: LayoutDashboard },
      { to: "settings", label: "Configurações", icon: Settings, soon: true },
      { to: "logs", label: "Logs", icon: ScrollText },
    ],
  },
  {
    title: "Comunidade",
    items: [
      { to: "welcome", label: "Boas-vindas", icon: Sparkles, activeKey: "welcome_enabled" },
      { to: "autorole", label: "Autorole", icon: UserPlus },
      { to: "reaction-roles", label: "Cargos por reação", icon: Smile },
      { to: "community", label: "Comunidade", icon: Users },
    ],
  },
  {
    title: "Segurança",
    items: [
      { to: "moderation", label: "Moderação", icon: Shield },
    ],
  },
  {
    title: "Engajamento",
    items: [
      { to: "economy", label: "Economia", icon: Coins },
      { to: "social", label: "Social & Level", icon: TrendingUp },
      { to: "badges", label: "Badges", icon: Award },
      { to: "achievements", label: "Conquistas", icon: Trophy },
      { to: "seasons", label: "Temporadas", icon: Trophy },
    ],
  },
  {
    title: "Suporte",
    items: [{ to: "tickets", label: "Tickets", icon: Ticket }],
  },
  {
    title: "Personalização",
    items: [
      { to: "commands", label: "Comandos custom", icon: Terminal },
      { to: "embeds", label: "Embeds", icon: FileCode2 },
    ],
  },
  {
    title: "Admin",
    items: [
      { to: "assets", label: "Identidade Visual", icon: ImageIcon },
      { to: "permissoes", label: "Permissões", icon: Lock },
      { to: "premium", label: "Premium", icon: Crown, premium: true },
    ],
  },

];

export function SidebarNav({
  guildId,
  onNavigate,
}: {
  guildId: string;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = `/dashboard/${guildId}`;

  const { data: premium } = useQuery({
    queryKey: ["premium-status", guildId],
    queryFn: () => getGuildPremiumStatus({ data: { guildId } }),
    staleTime: 60_000,
  });
  const isPremium = Boolean(premium?.subscription);

  const { data: config } = useQuery({
    queryKey: ["guild-config", guildId],
    queryFn: () => getGuildConfig({ data: { guildId } }),
    staleTime: 60_000,
  });

  return (
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
              const isPremiumItem = Boolean(it.premium);
              const isActiveModule =
                it.activeKey && config ? Boolean((config as unknown as Record<string, unknown>)[it.activeKey]) : false;
              const locked = isPremiumItem && !isPremium && !active;

              return (
                <li key={it.to}>
                  <Link
                    to={href}
                    onClick={onNavigate}
                    className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                      active
                        ? isPremiumItem
                          ? "premium-link-active"
                          : "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`size-4 shrink-0 ${
                        isPremiumItem && (isPremium || active) ? "premium-icon" : ""
                      }`}
                    />
                    <span className="flex-1 truncate">{it.label}</span>

                    {isActiveModule && !active && (
                      <span
                        title="Módulo ativo"
                        className="size-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]"
                      />
                    )}

                    {isPremiumItem && isPremium && (
                      <span className="rounded-full bg-[var(--premium-gold)]/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--premium-deep)]">
                        on
                      </span>
                    )}

                    {locked && (
                      <Lock className="size-3 shrink-0 text-muted-foreground/70" />
                    )}

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
  );
}
