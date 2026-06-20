import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getGuildPremiumStatus } from "@/lib/guild/premium.functions";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { Mascot } from "@/components/Mascot";
import { SidebarNav } from "./sidebar-nav";

export function DashboardSidebar({ guildId }: { guildId: string }) {
  const { data: premium } = useQuery({
    queryKey: ["premium-status", guildId],
    queryFn: () => getGuildPremiumStatus({ data: { guildId } }),
    staleTime: 60_000,
  });
  const isPremium = Boolean(premium?.subscription);

  return (
    <aside className="aurora-panel relative hidden w-64 shrink-0 flex-col rounded-none rounded-r-3xl border-y-0 border-l-0 md:flex">
      <div className="relative flex items-center gap-3 border-b border-border/40 px-5 py-5">
        <div className="relative">
          <Mascot variant="hero" size={40} />
          <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[var(--aurora-mint)] shadow-[0_0_8px_var(--aurora-mint)]" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-display block text-base font-bold">Zenox</span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-2.5" /> aurora console
          </span>
        </div>
        {isPremium && <PremiumBadge guildId={guildId} />}
      </div>

      <SidebarNav guildId={guildId} />

      <div className="border-t border-border/40 px-3 py-3">
        <Link
          to="/servidores"
          className="group flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition hover:bg-[color-mix(in_oklab,var(--aurora-lavender)_15%,transparent)] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Trocar servidor
        </Link>
      </div>
    </aside>
  );
}
