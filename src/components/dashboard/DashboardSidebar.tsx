import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getGuildPremiumStatus } from "@/lib/guild/premium.functions";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { SidebarNav } from "./sidebar-nav";

export function DashboardSidebar({ guildId }: { guildId: string }) {
  const { data: premium } = useQuery({
    queryKey: ["premium-status", guildId],
    queryFn: () => getGuildPremiumStatus({ data: { guildId } }),
    staleTime: 60_000,
  });
  const isPremium = Boolean(premium?.subscription);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 backdrop-blur md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="size-7 rounded-lg bg-primary/20 ring-1 ring-primary/40" />
        <span className="text-base font-semibold tracking-tight">Zenox</span>
        {isPremium && <PremiumBadge guildId={guildId} />}
      </div>

      <SidebarNav guildId={guildId} />

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
