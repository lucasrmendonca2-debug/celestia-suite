import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface ModuleCardProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  soon?: boolean;
  accent?: string;
}

export function ModuleCard({ to, icon: Icon, title, description, soon, accent }: ModuleCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ring-1 ring-border ${
            accent ?? "bg-primary/15 text-primary"
          }`}
        >
          <Icon className="size-5" />
        </div>
        {soon ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            em breve
          </span>
        ) : (
          <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </>
  );

  const className =
    "group relative flex flex-col rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/40 hover:bg-card/70";

  if (soon) {
    return (
      <div className={`${className} cursor-not-allowed opacity-70`} aria-disabled>
        {content}
      </div>
    );
  }

  return (
    <Link to={to} className={className}>
      {content}
    </Link>
  );
}
