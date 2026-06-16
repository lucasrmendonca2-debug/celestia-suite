import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { getGuildPremiumStatus } from "@/lib/guild/premium.functions";

interface PlanLike {
  name?: string | null;
  display_name?: string | null;
  tier?: string | null;
}

function planLabel(plan: PlanLike | null | undefined): string {
  if (!plan) return "Premium";
  return plan.display_name || plan.name || (plan.tier ? plan.tier.toUpperCase() : "Premium");
}

interface Props {
  guildId: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Selo visual mostrado quando o servidor possui assinatura Premium ativa.
 * Renderiza nada caso o servidor não tenha plano ativo.
 */
export function PremiumBadge({ guildId, size = "sm", className }: Props) {
  const { data } = useQuery({
    queryKey: ["premium-status", guildId],
    queryFn: () => getGuildPremiumStatus({ data: { guildId } }),
    staleTime: 60_000,
  });

  const sub = data?.subscription as { plan?: PlanLike | null } | null | undefined;
  if (!sub) return null;

  const label = planLabel(sub.plan);
  const dims =
    size === "md"
      ? "gap-1.5 px-2.5 py-1 text-[11px]"
      : "gap-1 px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`premium-badge inline-flex items-center rounded-full font-semibold uppercase tracking-wider ${dims} ${className ?? ""}`}
      title={`Plano ${label} ativo`}
    >
      <Crown className={size === "md" ? "size-3.5" : "size-3"} />
      {label}
    </span>
  );
}
