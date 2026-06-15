import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shield } from "lucide-react";
import { listMyGuilds, requireUser } from "@/lib/auth/auth.functions";
import { listModCases } from "@/lib/guild/modules.functions";
import { ModuleLayout } from "@/components/dashboard/ModuleLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard/$guildId/moderation")({
  loader: async ({ context, params }) => {
    const user = await requireUser();
    const guilds = await context.queryClient.ensureQueryData({
      queryKey: ["my-guilds"],
      queryFn: () => listMyGuilds(),
    });
    if (!guilds.find((g) => g.id === params.guildId)) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["mod-cases", params.guildId],
      queryFn: () => listModCases({ data: { guildId: params.guildId } }),
    });
    return { user };
  },
  component: ModerationPage,
});

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  warn: "secondary",
  mute: "outline",
  unmute: "outline",
  kick: "destructive",
  ban: "destructive",
  unban: "default",
  timeout: "outline",
};

function ModerationPage() {
  const { user } = Route.useLoaderData();
  const { guildId } = Route.useParams();
  const { data: cases } = useSuspenseQuery({
    queryKey: ["mod-cases", guildId],
    queryFn: () => listModCases({ data: { guildId } }),
  });
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? (cases as any[]).filter(
        (c) =>
          c.user_id.includes(filter) ||
          c.moderator_id.includes(filter) ||
          c.action.includes(filter.toLowerCase()) ||
          String(c.case_number).includes(filter),
      )
    : cases;

  return (
    <ModuleLayout
      guildId={guildId}
      user={user}
      icon={Shield}
      title="Casos de moderação"
      description="Histórico completo de warns, mutes, kicks e bans aplicados pelo bot."
    >
      <div className="mb-4">
        <Input
          placeholder="Filtrar por usuário, mod, ação ou nº do caso…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="rounded-2xl border border-border bg-card">
        {(filtered as any[]).length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum caso registrado ainda. Use comandos de moderação no Discord para
            popular o histórico.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Ação</th>
                <th className="px-4 py-2 text-left">Usuário</th>
                <th className="px-4 py-2 text-left">Mod</th>
                <th className="px-4 py-2 text-left">Motivo</th>
                <th className="px-4 py-2 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {(filtered as any[]).map((c) => (
                <tr key={c.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">#{c.case_number}</td>
                  <td className="px-4 py-2">
                    <Badge variant={ACTION_VARIANT[c.action] ?? "default"}>
                      {c.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{c.user_id}</td>
                  <td className="px-4 py-2 font-mono text-xs">{c.moderator_id}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {c.reason ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModuleLayout>
  );
}
