import { Skeleton } from "@/components/ui/skeleton";

export function CasesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background/40">
      <div className="grid grid-cols-[60px_90px_1fr_1fr_1.5fr_120px_100px_60px] gap-3 border-b bg-muted/30 px-3 py-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[60px_90px_1fr_1fr_1.5fr_120px_100px_60px] gap-3 border-b px-3 py-3 last:border-b-0"
        >
          {Array.from({ length: 8 }).map((__, j) => (
            <Skeleton
              key={j}
              className="h-4 w-full"
              style={{ opacity: 0.4 + ((i + j) % 3) * 0.2 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function BlacklistSkeleton() {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/50 bg-background/40 p-3 min-h-[60px]">
      {[48, 72, 56, 80, 60, 44].map((w, i) => (
        <Skeleton key={i} className="h-6 rounded-full" style={{ width: w }} />
      ))}
    </div>
  );
}
