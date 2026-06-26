import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { getTicketRatings } from "@/lib/guild/tickets.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Mascot } from "@/components/Mascot";

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

export function RatingsTab({ guildId }: { guildId: string }) {
  const fetcher = useServerFn(getTicketRatings);
  const { data, isLoading } = useQuery({
    queryKey: ["ticket-ratings", guildId],
    queryFn: () => fetcher({ data: { guildId } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!data || data.count === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
        Sem avaliações ainda. Ative <strong>Pedir avaliação</strong> em Geral para coletar feedback.
      </div>
    );
  }

  const avg = data.average;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <p className="text-xs text-muted-foreground">Média geral</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {avg.toFixed(2)}
            <span className="text-base text-muted-foreground"> / 5</span>
          </p>
          <div className="mt-2"><Stars value={Math.round(avg)} /></div>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <p className="text-xs text-muted-foreground">Total de avaliações</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{data.count}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Coletado de tickets fechados nos últimos meses.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card/40">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-background/30 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Usuário</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Nota</th>
              <th className="px-3 py-2 font-medium">Fechado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((t) => (
              <tr key={t.id}>
                <td className="px-3 py-2">{t.username}</td>
                <td className="px-3 py-2 text-muted-foreground">{t.category_name ?? "Geral"}</td>
                <td className="px-3 py-2"><Stars value={t.rating ?? 0} size="size-3.5" /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {t.closed_at ? new Date(t.closed_at).toLocaleString("pt-BR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
