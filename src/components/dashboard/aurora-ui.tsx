import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* ---------- Section / Panel ---------- */
export function AuroraSection({
  title,
  icon: Icon,
  description,
  children,
  className,
  tone = "lavender",
}: {
  title?: string;
  icon?: LucideIcon;
  description?: string;
  children: ReactNode;
  className?: string;
  tone?: "lavender" | "pink" | "cyan" | "mint" | "peach";
}) {
  const toneVar = `var(--aurora-${tone})`;
  return (
    <section
      className={cn(
        "aurora-panel aurora-card-hover relative overflow-hidden p-5 sm:p-6",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full blur-3xl opacity-50"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, ${toneVar} 70%, transparent), transparent 70%)`,
        }}
      />
      {(title || Icon) && (
        <header className="relative mb-4 flex items-center gap-2.5">
          {Icon && (
            <span
              className="flex size-8 items-center justify-center rounded-lg text-foreground/90"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, ${toneVar} 35%, transparent), color-mix(in oklab, var(--aurora-pink) 18%, transparent))`,
                boxShadow: `inset 0 1px 0 color-mix(in oklab, white 30%, transparent)`,
              }}
            >
              <Icon className="size-4" />
            </span>
          )}
          <div className="min-w-0">
            {title && (
              <h3 className="font-display text-sm font-semibold tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </header>
      )}
      <div className="relative space-y-4">{children}</div>
    </section>
  );
}

/* ---------- Stat card ---------- */
export function AuroraStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "lavender",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: "lavender" | "pink" | "cyan" | "mint" | "peach";
}) {
  const toneVar = `var(--aurora-${tone})`;
  return (
    <div
      className="aurora-panel aurora-card-hover group relative overflow-hidden p-4"
      style={{
        background: `linear-gradient(160deg, color-mix(in oklab, ${toneVar} 18%, var(--card)), color-mix(in oklab, var(--card) 65%, transparent))`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full blur-2xl opacity-60 transition-transform duration-500 group-hover:scale-125"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, ${toneVar} 80%, transparent), transparent 70%)`,
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          <div className="font-display mt-1 text-2xl font-bold tracking-tight">
            {value}
          </div>
          {hint && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
          )}
        </div>
        <span
          className="flex size-9 items-center justify-center rounded-xl text-foreground/85"
          style={{
            background: `color-mix(in oklab, ${toneVar} 28%, transparent)`,
            boxShadow: `inset 0 1px 0 color-mix(in oklab, white 30%, transparent)`,
          }}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}

/* ---------- Switch row ---------- */
export function AuroraSwitchRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-xl border p-3 transition",
        checked
          ? "border-[color:color-mix(in_oklab,var(--aurora-mint)_45%,var(--border))] bg-[color:color-mix(in_oklab,var(--aurora-mint)_8%,var(--card))]"
          : "border-border bg-card/40 hover:border-[color:color-mix(in_oklab,var(--aurora-lavender)_40%,var(--border))]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

/* ---------- Field wrapper ---------- */
export function AuroraField({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
