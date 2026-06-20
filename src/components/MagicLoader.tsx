import { Mascot } from "@/components/Mascot";

export function MagicLoader({
  label = "Carregando…",
  fullscreen = true,
}: {
  label?: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={
        fullscreen
          ? "aurora-shell flex min-h-screen items-center justify-center px-6"
          : "flex items-center justify-center py-16"
      }
    >
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <div className="animate-bounce">
          <Mascot variant="loading" size={120} glow />
        </div>
        <p className="font-display text-sm font-medium text-muted-foreground">
          {label}
        </p>
        <div className="flex gap-1.5">
          <span className="size-2 animate-pulse rounded-full bg-[var(--aurora-lavender)]" style={{ animationDelay: "0ms" }} />
          <span className="size-2 animate-pulse rounded-full bg-[var(--aurora-pink)]" style={{ animationDelay: "200ms" }} />
          <span className="size-2 animate-pulse rounded-full bg-[var(--aurora-cyan)]" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
}
