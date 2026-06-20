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
    <aside className="cyber-panel hidden w-64 shrink-0 rounded-none border-y-0 border-l-0 md:flex md:flex-col">
      <div className="relative flex items-center gap-3 border-b border-border/60 px-5 py-5">
        <div className="grid size-9 place-items-center rounded-lg border border-[var(--cyber-line)] bg-primary/15 shadow-[0_0_20px_-10px_var(--cyber-cyan)]">
          <span className="font-display text-xs font-black text-primary">ZX</span>
        </div>
        <div className="min-w-0">
          <span className="font-display block text-base font-semibold">Zenox</span>
          <span className="block text-[10px] uppercase text-muted-foreground">command core</span>
        </div>
        {isPremium && <PremiumBadge guildId={guildId} />}
      </div>

      <SidebarNav guildId={guildId} />

      <div className="border-t border-border/60 px-3 py-3">
        <Link
          to="/servidores"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
        >
          ← Trocar servidor
        </Link>
      </div>
    </aside>
  );
}
