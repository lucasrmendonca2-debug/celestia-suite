import type { ReactNode } from "react";
import { Mascot, type MascotVariant } from "@/components/Mascot";

interface EmptyMascotProps {
  variant?: MascotVariant;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: number;
}

/** Empty state padronizado com o mascote Zenox. */
export function EmptyMascot({
  variant = "sleeping",
  title,
  description,
  action,
  size = 140,
}: EmptyMascotProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <Mascot variant={variant} size={size} glow />
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
